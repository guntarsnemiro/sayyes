import { getSession } from '@/lib/auth/session';
import { getWeekDate } from '@/lib/checkin';
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

  // AUTO-REPAIR: Ensure all accounts with this email are synced to the same couple
  let activeCoupleId = currentUser.couple_id;

  if (!activeCoupleId) {
    // 1. Check if any other user record with this email has a couple_id
    const emailMatch = await db.prepare(`
      SELECT couple_id FROM users 
      WHERE LOWER(email) = LOWER(?) AND couple_id IS NOT NULL 
      LIMIT 1
    `).bind(currentUser.email).first<{ couple_id: string }>();

    if (emailMatch) {
      activeCoupleId = emailMatch.couple_id;
    } else {
      // 2. Check if there is an accepted invitation for this email
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

  const weekDate = getWeekDate();
  
  // Check couple status and partner info
  let partner = null;
  let userDone = false;
  let partnerDone = false;

  if (currentUser.couple_id) {
    partner = await db.prepare(
      'SELECT name, email FROM users WHERE couple_id = ? AND id != ?'
    ).bind(currentUser.couple_id, currentUser.id).first<{ name: string, email: string }>();

    const checkinsRes = await db.prepare(`
      SELECT user_id, COUNT(DISTINCT category) as count 
      FROM checkins 
      WHERE couple_id = ? AND week_date = ? 
      GROUP BY user_id
    `).bind(currentUser.couple_id, weekDate).all<{ user_id: string, count: number }>();

    const checkins = checkinsRes.results || [];
    const userCheckin = checkins.find(c => c.user_id === currentUser.id);
    const partnerCheckin = checkins.find(c => c.user_id !== currentUser.id);

    userDone = (userCheckin?.count || 0) >= 5;
    partnerDone = (partnerCheckin?.count || 0) >= 5;
  }

  const userFirstName = (currentUser.name || currentUser.email || '').split(' ')[0].split('@')[0];
  const partnerFirstName = (partner?.name || partner?.email || 'your partner').split(' ')[0].split('@')[0];

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
          <h2 className="text-2xl font-light text-[var(--primary)] mb-2">
            Hello, {userFirstName}
          </h2>
          {partner && (
            <p className="text-xs text-[var(--muted)] uppercase tracking-widest">
              Connected with {partnerFirstName}
            </p>
          )}
          <p className="text-[var(--muted)] leading-relaxed mt-4">
            {userDone && partnerDone ? "This week&apos;s results are ready." : 
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
                <Link href="/dashboard/results/" className="bg-stone-100 text-[var(--primary)] px-5 py-2 rounded-full text-sm font-medium hover:bg-stone-200 transition-colors">
                  View
                </Link>
              ) : !userDone ? (
                <Link href="/checkin" className="bg-stone-100 text-[var(--primary)] px-5 py-2 rounded-full text-sm font-medium hover:bg-stone-200 transition-colors">
                  Start
                </Link>
              ) : (
                <div className="bg-stone-50 text-[var(--muted)] px-5 py-2 rounded-full text-sm font-medium">
                  Done
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
          </div>
        )}
      </div>
    </main>
  );
}
