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

  const weekDate = getWeekDate();
  
  // Check couple status and partner info
  let partner = null;
  let userDone = false;
  let partnerDone = false;

  if (user.couple_id) {
    partner = await db.prepare(
      'SELECT name, email FROM users WHERE couple_id = ? AND id != ?'
    ).bind(user.couple_id, user.id).first<{ name: string, email: string }>();

    const checkins = await db.prepare(`
      SELECT user_id, COUNT(DISTINCT category) as count 
      FROM checkins 
      WHERE couple_id = ? AND week_date = ? 
      GROUP BY user_id
    `).bind(user.couple_id, weekDate).all<{ user_id: string, count: number }>();

    const userCheckin = checkins.results.find(c => c.user_id === user.id);
    const partnerCheckin = checkins.results.find(c => c.user_id !== user.id);

    userDone = (userCheckin?.count || 0) >= 5;
    partnerDone = (partnerCheckin?.count || 0) >= 5;
  }

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
            Hello, {user.name || user.email.split('@')[0]}
          </h2>
          {partner && (
            <p className="text-xs text-[var(--muted)] uppercase tracking-widest">
              Connected with {partner.name || partner.email.split('@')[0]}
            </p>
          )}
          <p className="text-[var(--muted)] leading-relaxed mt-4">
            {userDone && partnerDone ? "This week's results are ready." : 
             userDone ? "Waiting for your partner to finish." : 
             "Your weekly connection space is ready."}
          </p>
        </div>

        {!user.couple_id ? (
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
          <div className="grid gap-4">
            <div className="bg-white border border-[var(--accent)] rounded-3xl p-6 flex justify-between items-center shadow-sm">
              <div>
                <p className="text-xs text-[var(--muted)] uppercase tracking-widest mb-1">Weekly Check-in</p>
                <p className="text-[var(--primary)] font-medium">
                  {userDone && partnerDone ? 'Results are ready' : 
                   userDone ? 'Waiting for partner' : 
                   'Ready for this week'}
                </p>
              </div>
              {userDone && partnerDone ? (
                <Link href="/dashboard/results" className="bg-stone-100 text-[var(--primary)] px-5 py-2 rounded-full text-sm font-medium hover:bg-stone-200 transition-colors">
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
          </div>
        )}
      </div>
    </main>
  );
}
