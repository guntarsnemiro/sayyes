import { getSession } from '@/lib/auth/session';
import { getWeekDate, calculateWeeklyScore, calculateAverageScore, getWeeklyFocus, CHECKIN_CATEGORIES } from '@/lib/checkin';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const runtime = 'edge';

export default async function DashboardPage() {
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

  // 1. AUTO-REPAIR: Ensure all accounts with this email are synced to the same couple
  let activeCoupleId = currentUser.couple_id;

  if (!activeCoupleId) {
    // Check if any other user record with this email has a couple_id
    const emailMatch = await db.prepare(`
      SELECT couple_id FROM users 
      WHERE LOWER(email) = LOWER(?) AND couple_id IS NOT NULL 
      LIMIT 1
    `).bind(currentUser.email).first<{ couple_id: string }>();

    if (emailMatch) {
      activeCoupleId = emailMatch.couple_id;
    } else {
      // Check if there is an accepted invitation for this email
      const inviteMatch = await db.prepare(`
        SELECT couple_id FROM users 
        WHERE id IN (
          SELECT inviter_id FROM invitations 
          WHERE LOWER(invitee_email) = LOWER(?) AND status = 'accepted'
        ) AND couple_id IS NOT NULL LIMIT 1
      `).bind(currentUser.email).first<{ couple_id: string }>();
      
      if (inviteMatch) activeCoupleId = inviteMatch.couple_id;
    }

    if (activeCoupleId) {
      await db.prepare('UPDATE users SET couple_id = ? WHERE id = ?')
        .bind(activeCoupleId, currentUser.id).run();
      currentUser.couple_id = activeCoupleId;
    }
  }

  // 2. CHECK COMMITMENT GATE (Only if in a couple)
  if (currentUser.couple_id) {
    try {
      const hasCommitment = await db.prepare(`
        SELECT id FROM commitments 
        WHERE user_id = ? 
        LIMIT 1
      `).bind(currentUser.id).first();

      if (!hasCommitment) {
        redirect('/commitment');
      }
    } catch (e) {
      console.error('Commitment check failed:', e);
      // Fallback: if the table is still being created or has issues, 
      // don't crash the whole dashboard, just skip the gate for this request.
    }
  }

  const weekDate = getWeekDate();
  
  // Check couple status and partner info
  let partner = null;
  let userDone = false;
  let partnerDone = false;
  let weeklyFocus = null;
  let focusCategory = null;

  if (currentUser.couple_id) {
    partner = await db.prepare(
      'SELECT name, email FROM users WHERE couple_id = ? AND id != ?'
    ).bind(currentUser.couple_id, currentUser.id).first<{ name: string, email: string }>();

    const checkinsRes = await db.prepare(`
      SELECT user_id, category, score 
      FROM checkins 
      WHERE couple_id = ? AND week_date = ?
    `).bind(currentUser.couple_id, weekDate).all<{ user_id: string, category: string, score: number }>();

    const checkins = checkinsRes.results || [];
    const userCheckins = checkins.filter(c => c.user_id === currentUser.id);
    const partnerCheckins = checkins.filter(c => c.user_id !== currentUser.id);

    userDone = userCheckins.length >= 5;
    partnerDone = partnerCheckins.length >= 5;

    if (userDone && partnerDone) {
      const userMap: Record<string, number> = {};
      userCheckins.forEach(c => userMap[c.category] = c.score);
      const partnerMap: Record<string, number> = {};
      partnerCheckins.forEach(c => partnerMap[c.category] = c.score);
      
      weeklyFocus = getWeeklyFocus(userMap, partnerMap);
      if (weeklyFocus) {
        focusCategory = CHECKIN_CATEGORIES.find(c => c.id === weeklyFocus.categoryId);
      }
    }
  }

  // FETCH HISTORY FOR GRAPH & AVERAGES
  let history: { week: string, score: number, average: number }[] = [];
  let eightWeekAvg = 0;
  
  if (currentUser.couple_id) {
    const allCheckins = await db.prepare(`
      SELECT week_date, user_id, category, score 
      FROM checkins 
      WHERE couple_id = ? 
      ORDER BY week_date DESC 
      LIMIT 100
    `).bind(currentUser.couple_id).all<{ week_date: string, user_id: string, category: string, score: number }>();

    const byWeek: Record<string, any> = {};
    allCheckins.results?.forEach(c => {
      if (!byWeek[c.week_date]) byWeek[c.week_date] = { user: {}, partner: {} };
      const role = c.user_id === currentUser.id ? 'user' : 'partner';
      byWeek[c.week_date][role][c.category] = c.score;
    });

    history = Object.entries(byWeek)
      .map(([week, data]: [string, any]) => {
        const score = calculateWeeklyScore(data.user, data.partner);
        const average = calculateAverageScore(data.user, data.partner);
        return { week, score, average };
      })
      .filter(h => h.score > 0)
      .sort((a, b) => a.week.localeCompare(b.week))
      .slice(-8); // Last 8 weeks

    if (history.length > 0) {
      const sum = history.reduce((acc, h) => acc + h.average, 0);
      eightWeekAvg = Math.round((sum / history.length) * 10) / 10;
    }
  }

  const userFirstName = (currentUser.name || currentUser.email || 'You').split(' ')[0].split('@')[0];
  const partnerFirstName = partner 
    ? (partner.name || partner.email || 'partner').split(' ')[0].split('@')[0]
    : 'your partner';

  const currentWeekAvg = history.length > 0 ? history[history.length - 1].average : 0;

  return (
    <main className="flex min-h-screen flex-col bg-[var(--background)] p-6">
      <header className="flex justify-between items-center max-w-2xl mx-auto w-full mb-12">
        <h1 className="text-xl font-light tracking-tight text-[var(--primary)]">
          SayYes
        </h1>
        <form action="/api/auth/logout" method="POST">
          <button type="submit" className="text-xs text-[var(--muted)] uppercase tracking-widest hover:text-[var(--primary)] transition-colors">
            Sign Out
          </button>
        </form>
      </header>

      <div className="max-w-2xl mx-auto w-full space-y-8">
        <div className="bg-white border border-[var(--accent)] rounded-3xl p-8 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <h2 className="text-2xl font-light text-[var(--primary)]">
              Hello, {userFirstName}
            </h2>
            <Link 
              href="/dashboard/profile" 
              className="text-[10px] text-[var(--muted)] uppercase tracking-widest hover:text-[var(--primary)] transition-colors border border-[var(--accent)] px-3 py-1 rounded-full"
            >
              Settings
            </Link>
          </div>
          {partner && (
            <p className="text-xs text-[var(--muted)] uppercase tracking-widest">
              Connected with {partnerFirstName}
            </p>
          )}
          <p className="text-[var(--muted)] leading-relaxed mt-4">
            {userDone && partnerDone ? "This week's results are ready." : 
             userDone ? `Waiting for ${partnerFirstName} to finish.` : 
             "Your weekly connection space is ready."}
          </p>
        </div>

        {!currentUser.couple_id ? (
          <div className="bg-stone-50 border border-dashed border-[var(--accent)] rounded-3xl p-8 text-center shadow-sm">
            <h3 className="text-lg font-medium text-[var(--primary)] mb-4">
              Connect with your partner
            </h3>
            <p className="text-sm text-[var(--muted)] mb-6">
              Invite your partner to start your weekly check-ins together.
            </p>
            <Link 
              href="/dashboard/invite" 
              className="inline-block bg-[var(--primary)] text-white px-8 py-3 rounded-full font-medium active:scale-95 transition-all shadow-sm"
            >
              Invite Partner
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white border border-[var(--accent)] rounded-3xl p-6 flex justify-between items-center shadow-sm transition-all hover:border-[var(--primary)]/20">
              <div>
                <p className="text-xs text-[var(--muted)] uppercase tracking-widest mb-1">Weekly Check-in</p>
                <p className="text-[var(--primary)] font-medium">
                  {userDone && partnerDone ? 'Results are ready' : 
                   userDone ? `Waiting for ${partnerFirstName}` : 
                   'Ready for this week'}
                </p>
              </div>
              {userDone && partnerDone ? (
                <div className="flex gap-2">
                  <Link href="/checkin" className="text-[10px] text-[var(--muted)] uppercase tracking-widest hover:text-[var(--primary)] transition-colors border border-[var(--accent)] px-3 py-2 rounded-full flex items-center">
                    Edit
                  </Link>
                  <Link href="/dashboard/results/" className="bg-stone-100 text-[var(--primary)] px-5 py-2 rounded-full text-sm font-medium hover:bg-stone-200 transition-colors">
                    View
                  </Link>
                </div>
              ) : !userDone ? (
                <Link href="/checkin" className="bg-stone-100 text-[var(--primary)] px-5 py-2 rounded-full text-sm font-medium hover:bg-stone-200 transition-colors">
                  Start
                </Link>
              ) : (
                <div className="flex gap-2 items-center">
                  <Link href="/checkin" className="text-[10px] text-[var(--muted)] uppercase tracking-widest hover:text-[var(--primary)] transition-colors border border-[var(--accent)] px-3 py-2 rounded-full">
                    Edit
                  </Link>
                  <div className="bg-stone-50 text-[var(--muted)] px-5 py-2 rounded-full text-sm font-medium">
                    Done
                  </div>
                </div>
              )}
            </div>

            {userDone && !partnerDone && (
              <div className="bg-stone-50 border border-[var(--accent)] rounded-3xl p-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                <p className="text-xs text-[var(--muted)] uppercase tracking-widest mb-4">While you wait</p>
                <h3 className="text-lg font-light text-[var(--primary)] mb-4 italic">
                  &quot;What is one small thing {partnerFirstName} did this week that you appreciated?&quot;
                </h3>
                <p className="text-sm text-[var(--muted)]">
                  Take a second to tell them, or just hold it in your mind.
                </p>
              </div>
            )}

            {userDone && partnerDone && weeklyFocus && focusCategory && (
              <div className="bg-white border border-[var(--primary)] shadow-sm rounded-3xl p-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-[var(--primary)]" />
                  <p className="text-[10px] text-[var(--muted)] uppercase tracking-widest font-medium">Weekly Focus: {focusCategory.name}</p>
                </div>
                <p className="text-sm text-[var(--primary)] leading-relaxed italic">
                  &quot;{weeklyFocus.message}&quot;
                </p>
              </div>
            )}

            {history.length > 1 && (
              <div className="bg-white border border-[var(--accent)] rounded-3xl p-8 shadow-sm">
                <div className="flex justify-between items-end mb-8">
                  <div>
                    <p className="text-xs text-[var(--muted)] uppercase tracking-widest mb-1">Relationship Pulse</p>
                    <h3 className="text-lg font-light text-[var(--primary)]">Weekly Alignment</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-light text-[var(--primary)]">{history[history.length-1].score}%</p>
                    <p className="text-[10px] text-[var(--muted)] uppercase tracking-widest">Alignment</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8 py-4 border-y border-stone-50">
                  <div className="text-center border-r border-stone-50">
                    <p className="text-xl font-light text-[var(--primary)]">{currentWeekAvg.toFixed(1)}</p>
                    <p className="text-[9px] text-[var(--muted)] uppercase tracking-widest mt-1">This Week Avg</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-light text-[var(--primary)]">{eightWeekAvg.toFixed(1)}</p>
                    <p className="text-[9px] text-[var(--muted)] uppercase tracking-widest mt-1">8-Week Avg</p>
                  </div>
                </div>
                
                <div className="h-32 w-full flex items-end gap-2">
                  {history.map((h, i) => (
                    <div key={h.week} className="flex-grow flex flex-col items-center group relative">
                      {/* Tooltip on hover */}
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[var(--primary)] text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        {h.score}%
                      </div>
                      
                      <div 
                        className="w-full bg-stone-100 rounded-t-lg transition-all group-hover:bg-stone-200 relative overflow-hidden"
                        style={{ height: `${h.score}%` }}
                      >
                        <div 
                          className="absolute bottom-0 left-0 right-0 bg-[var(--primary)] opacity-20"
                          style={{ height: '100%' }}
                        />
                        {i === history.length - 1 && (
                          <div 
                            className="absolute bottom-0 left-0 right-0 bg-[var(--primary)] opacity-40 animate-pulse"
                            style={{ height: '100%' }}
                          />
                        )}
                      </div>
                      <p className="text-[8px] text-[var(--muted)] mt-2 uppercase tracking-tighter">
                        {new Date(h.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
