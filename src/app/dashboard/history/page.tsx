import { getSession } from '@/lib/auth/session';
import { getWeekDate, CHECKIN_CATEGORIES, getAlignmentState } from '@/lib/checkin';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const runtime = 'edge';

interface WeeklyData {
  week_date: string;
  alignment_score: number; // 0 to 100 based on diffs
  is_complete: boolean;
}

export default async function HistoryPage() {
  const context = getRequestContext();
  const env = context.env as CloudflareEnv;
  const db = env.DB;
  const user = await getSession(db);

  if (!user || !user.couple_id) {
    redirect('/dashboard');
  }

  // Fetch all historical checkins for the couple
  const allCheckins = await db.prepare(`
    SELECT week_date, user_id, category, score
    FROM checkins 
    WHERE couple_id = ?
    ORDER BY week_date DESC
  `).bind(user.couple_id).all<{ week_date: string, user_id: string, category: string, score: number }>();

  // Group by week
  const weeksMap: Record<string, any> = {};
  allCheckins.results.forEach(c => {
    if (!weeksMap[c.week_date]) {
      weeksMap[c.week_date] = { user: {}, partner: {}, count: 0 };
    }
    if (c.user_id === user.id) {
      weeksMap[c.week_date].user[c.category] = c.score;
    } else {
      weeksMap[c.week_date].partner[c.category] = c.score;
    }
    weeksMap[c.week_date].count++;
  });

  // Calculate alignment score per week (0-100)
  const history: WeeklyData[] = Object.entries(weeksMap)
    .map(([date, data]) => {
      const userScores = Object.values(data.user) as number[];
      const partnerScores = Object.values(data.partner) as number[];
      
      let totalDiff = 0;
      let categoriesCompared = 0;

      CHECKIN_CATEGORIES.forEach(cat => {
        if (data.user[cat.id] !== undefined && data.partner[cat.id] !== undefined) {
          totalDiff += Math.abs(data.user[cat.id] - data.partner[cat.id]);
          categoriesCompared++;
        }
      });

      // Score: 100 is perfect alignment, 0 is max difference (diff of 4 across 5 cats = 20)
      const alignmentScore = categoriesCompared > 0 
        ? Math.max(0, 100 - (totalDiff * (100 / (categoriesCompared * 4))))
        : 0;

      return {
        week_date: date,
        alignment_score: alignmentScore,
        is_complete: categoriesCompared === 5
      };
    })
    .sort((a, b) => a.week_date.localeCompare(b.week_date))
    .slice(-12); // Last 12 weeks

  // Generate SVG path for the pulse line
  const graphWidth = 300;
  const graphHeight = 60;
  const points = history.map((d, i) => {
    const x = (i / (Math.max(1, history.length - 1))) * graphWidth;
    const y = graphHeight - (d.alignment_score / 100) * graphHeight;
    return `${x},${y}`;
  });
  const dPath = points.length > 1 ? `M ${points.join(' L ')}` : '';

  return (
    <main className="flex min-h-screen flex-col bg-[var(--background)] p-6">
      <header className="flex justify-between items-center max-w-2xl mx-auto w-full mb-12">
        <Link href="/dashboard" className="text-xs text-[var(--muted)] uppercase tracking-widest hover:text-[var(--primary)] transition-colors">
          ← Dashboard
        </Link>
        <h1 className="text-xl font-light tracking-tight text-[var(--primary)]">
          Relationship Pulse
        </h1>
        <div className="w-12"></div>
      </header>

      <div className="max-w-2xl mx-auto w-full space-y-12">
        {/* Visual Pulse Card */}
        <div className="bg-white border border-[var(--accent)] rounded-3xl p-8 shadow-sm overflow-hidden">
          <p className="text-xs text-[var(--muted)] uppercase tracking-widest mb-8">Alignment Trend</p>
          
          {history.length > 1 ? (
            <div className="relative h-20 w-full">
              <svg viewBox={`0 0 ${graphWidth} ${graphHeight}`} className="w-full h-full overflow-visible">
                <path 
                  d={dPath} 
                  fill="none" 
                  stroke="var(--primary)" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className="opacity-20"
                />
                {history.map((d, i) => {
                  const x = (i / (history.length - 1)) * graphWidth;
                  const y = graphHeight - (d.alignment_score / 100) * graphHeight;
                  return (
                    <circle 
                      key={i} 
                      cx={x} 
                      cy={y} 
                      r="2" 
                      fill="var(--primary)"
                      className={i === history.length - 1 ? "animate-pulse" : ""}
                    />
                  );
                })}
              </svg>
            </div>
          ) : (
            <div className="h-20 flex items-center justify-center border border-dashed border-stone-100 rounded-2xl">
              <p className="text-xs text-[var(--muted)] italic">More data needed to show your pulse</p>
            </div>
          )}
          
          <div className="flex justify-between mt-4 text-[9px] text-[var(--muted)] uppercase tracking-widest px-1">
            <span>Earlier</span>
            <span>This Week</span>
          </div>
        </div>

        {/* Weekly List */}
        <div className="space-y-4">
          <h2 className="text-xs text-[var(--muted)] uppercase tracking-widest px-4">Past Check-ins</h2>
          {Object.entries(weeksMap)
            .sort((a, b) => b[0].localeCompare(a[0]))
            .map(([date, data]) => {
              const isComplete = Object.keys(data.user).length >= 5 && Object.keys(data.partner).length >= 5;
              return (
                <div key={date} className="bg-white border border-[var(--accent)] rounded-2xl p-5 flex justify-between items-center shadow-sm">
                  <div>
                    <p className="text-sm font-medium text-[var(--primary)]">
                      {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    <p className="text-[10px] text-[var(--muted)] uppercase tracking-widest mt-1">
                      {isComplete ? 'Results Synced' : 'Partial Data'}
                    </p>
                  </div>
                  {isComplete ? (
                    <Link 
                      href={`/dashboard/results?week=${date}`} 
                      className="text-xs font-medium text-[var(--primary)] bg-stone-50 px-4 py-2 rounded-full hover:bg-stone-100 transition-colors"
                    >
                      Review
                    </Link>
                  ) : (
                    <span className="text-[10px] text-stone-300 uppercase tracking-widest">Incomplete</span>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </main>
  );
}
