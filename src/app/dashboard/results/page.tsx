import { getSession } from '@/lib/auth/session';
import { getSession } from '@/lib/auth/session';
import { getWeekDate, CHECKIN_CATEGORIES, calculateAlignment, getWeeklyFocus, calculateCategoryAverage } from '@/lib/checkin';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const runtime = 'edge';

export default async function ResultsPage() {
  const context = getRequestContext();
  const env = context.env as CloudflareEnv;
  const db = env.DB;
  const user = await getSession(db);

  if (!user) {
    redirect('/auth/login');
  }

  // Refresh user data from DB to ensure we have the latest couple_id
  const freshUser = await db.prepare('SELECT * FROM users WHERE id = ?').bind(user.id).first<{
    id: string;
    email: string;
    name?: string;
    picture?: string;
    couple_id?: string;
    created_at: string;
  }>();
  
  const currentUser = freshUser || user;

  if (!currentUser.couple_id) {
    redirect('/dashboard');
  }

  const weekDate = getWeekDate();

  // Fetch all checkins for this couple this week
  const checkins = await db.prepare(`
    SELECT user_id, category, score, note 
    FROM checkins 
    WHERE couple_id = ? AND week_date = ?
  `).bind(currentUser.couple_id, weekDate).all<{ user_id: string, category: string, score: number, note: string }>();

  const userCheckins = checkins.results.filter(c => c.user_id === currentUser.id);
  const partnerCheckins = checkins.results.filter(c => c.user_id !== currentUser.id);

  if (userCheckins.length < 5 || partnerCheckins.length < 5) {
    // If the counts are off, it might be due to duplicate accounts. 
    // Let's try one more time by email if the primary check fails.
    if (checkins.results.length < 10) {
      redirect('/dashboard');
    }
  }

  // Map to category records
  const userMap: Record<string, number> = {};
  userCheckins.forEach(c => userMap[c.category] = c.score);
  
  const partnerMap: Record<string, number> = {};
  partnerCheckins.forEach(c => partnerMap[c.category] = c.score);

  const alignment = calculateAlignment(userMap, partnerMap);
  const weeklyFocus = getWeeklyFocus(userMap, partnerMap);

  // FETCH 8-WEEK HISTORY FOR CATEGORY AVERAGES
  const allHistoryCheckins = await db.prepare(`
    SELECT week_date, user_id, category, score 
    FROM checkins 
    WHERE couple_id = ? 
    ORDER BY week_date DESC 
    LIMIT 100
  `).bind(currentUser.couple_id).all<{ week_date: string, user_id: string, category: string, score: number }>();

  const byWeek: Record<string, any> = {};
  allHistoryCheckins.results?.forEach(c => {
    if (!byWeek[c.week_date]) byWeek[c.week_date] = { user: {}, partner: {} };
    const role = c.user_id === currentUser.id ? 'user' : 'partner';
    byWeek[c.week_date][role][c.category] = c.score;
  });

  const historyWeeks = Object.keys(byWeek).sort().slice(-8);
  const categoryEightWeekAvgs: Record<string, number> = {};

  CHECKIN_CATEGORIES.forEach(cat => {
    let sum = 0;
    let count = 0;
    historyWeeks.forEach(week => {
      const weekData = byWeek[week];
      const s1 = weekData.user[cat.id];
      const s2 = weekData.partner[cat.id];
      if (s1 !== undefined || s2 !== undefined) {
        sum += calculateCategoryAverage(s1, s2);
        count++;
      }
    });
    categoryEightWeekAvgs[cat.id] = count > 0 ? Math.round((sum / count) * 10) / 10 : 0;
  });

  // Fetch partner info for the UI
  const partner = await db.prepare(
    'SELECT name, email FROM users WHERE couple_id = ? AND id != ?'
  ).bind(currentUser.couple_id, currentUser.id).first<{ name: string, email: string }>();

  const userName = currentUser.name?.split(' ')[0] || 'You';
  const partnerName = partner?.name?.split(' ')[0] || partner?.email?.split('@')[0] || 'Partner';

  return (
    <main className="flex min-h-screen flex-col bg-[var(--background)] p-6">
      <header className="flex justify-between items-center max-w-2xl mx-auto w-full mb-12">
        <Link href="/dashboard" className="text-xs text-[var(--muted)] uppercase tracking-widest hover:text-[var(--primary)] transition-colors">
          ← Dashboard
        </Link>
        <h1 className="text-xl font-light tracking-tight text-[var(--primary)]">
          Weekly Results
        </h1>
        <Link 
          href="/checkin" 
          className="text-[10px] text-[var(--muted)] uppercase tracking-widest hover:text-[var(--primary)] transition-colors border border-[var(--accent)] px-3 py-1 rounded-full"
        >
          Edit
        </Link>
      </header>

      <div className="max-w-2xl mx-auto w-full space-y-8 pb-12">
        <div className="space-y-4">
          {CHECKIN_CATEGORIES.map((cat) => {
            const state = alignment[cat.id];
            const userScore = userMap[cat.id];
            const partnerScore = partnerMap[cat.id];
            const thisWeekAvg = calculateCategoryAverage(userScore, partnerScore);
            const eightWeekAvg = categoryEightWeekAvgs[cat.id];
            
            const userNote = userCheckins.find(c => c.category === cat.id)?.note;
            const partnerNote = partnerCheckins.find(c => c.category === cat.id)?.note;

            const isFocus = weeklyFocus?.categoryId === cat.id;

            return (
              <div key={cat.id} className={`bg-white border ${isFocus ? 'border-[var(--primary)] shadow-md ring-1 ring-[var(--primary)]/10' : 'border-[var(--accent)] shadow-sm'} rounded-3xl p-6 transition-all`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-xs text-[var(--muted)] uppercase tracking-widest mb-1">{cat.name}</p>
                    <h3 className="text-lg font-light text-[var(--primary)]">{cat.question}</h3>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-medium ${
                    state === 'aligned' ? 'bg-green-50 text-green-700 border border-green-100' :
                    state === 'partially-aligned' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                    'bg-rose-50 text-rose-700 border border-rose-100'
                  }`}>
                    {state.replace('-', ' ')}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6 py-3 border-y border-stone-50">
                  <div className="text-center border-r border-stone-50">
                    <p className="text-lg font-light text-[var(--primary)]">{thisWeekAvg.toFixed(1)}</p>
                    <p className="text-[8px] text-[var(--muted)] uppercase tracking-widest">This Week Avg</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-light text-[var(--primary)]">{eightWeekAvg.toFixed(1)}</p>
                    <p className="text-[8px] text-[var(--muted)] uppercase tracking-widest">8-Week Avg</p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  {/* User Bar */}
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] text-[var(--muted)] uppercase tracking-widest w-16">{userName}</span>
                    <div className="flex-grow h-1.5 bg-stone-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[var(--primary)]" 
                        style={{ width: `${(userScore / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-[var(--primary)] w-4 text-right">{userScore}</span>
                  </div>

                  {/* Partner Bar */}
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] text-[var(--muted)] uppercase tracking-widest w-16">{partnerName}</span>
                    <div className="flex-grow h-1.5 bg-stone-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[var(--primary)] opacity-60" 
                        style={{ width: `${(partnerScore / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-[var(--primary)] w-4 text-right">{partnerScore}</span>
                  </div>
                </div>

                {isFocus && (
                  <div className="mt-6 p-4 bg-stone-50 rounded-2xl border border-[var(--primary)]/10 animate-in fade-in slide-in-from-top-2 duration-500">
                    <p className="text-[10px] text-[var(--muted)] uppercase tracking-widest mb-2 font-medium">Weekly Focus Suggestion</p>
                    <p className="text-sm text-[var(--primary)] leading-relaxed italic">
                      &quot;{weeklyFocus.message}&quot;
                    </p>
                  </div>
                )}

                {(userNote || partnerNote) && (
                  <div className="mt-6 pt-4 border-t border-stone-50 space-y-3">
                    {userNote && (
                      <div className="flex gap-3">
                        <div className="w-1 h-auto bg-stone-200 rounded-full" />
                        <p className="text-xs text-[var(--muted)] italic leading-relaxed">
                          <span className="not-italic font-medium text-[var(--primary)] uppercase text-[9px] block mb-1">{userName}</span>
                          &quot;{userNote}&quot;
                        </p>
                      </div>
                    )}
                    {partnerNote && (
                      <div className="flex gap-3">
                        <div className="w-1 h-auto bg-stone-200 rounded-full" />
                        <p className="text-xs text-[var(--muted)] italic leading-relaxed">
                          <span className="not-italic font-medium text-[var(--primary)] uppercase text-[9px] block mb-1">{partnerName}</span>
                          &quot;{partnerNote}&quot;
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="pt-8 text-center">
          <p className="text-xs text-[var(--muted)] leading-relaxed max-w-xs mx-auto">
            Results are meant to start a conversation, not to judge. Take a moment to listen to each other.
          </p>
        </div>
      </div>
    </main>
  );
}
