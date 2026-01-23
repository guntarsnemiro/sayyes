import { getSession } from '@/lib/auth/session';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const runtime = 'edge';

export default async function DashboardPage() {
  // @ts-ignore
  const context = getRequestContext();
  const db = context.env.DB;
  const user = await getSession(db);

  if (!user) {
    redirect('/auth/login');
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
          <p className="text-[var(--muted)] leading-relaxed">
            Your weekly connection space is ready.
          </p>
        </div>

        {!user.couple_id ? (
          <div className="bg-stone-50 border border-dashed border-[var(--accent)] rounded-3xl p-8 text-center">
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
            <div className="bg-white border border-[var(--accent)] rounded-3xl p-6 flex justify-between items-center">
              <div>
                <p className="text-xs text-[var(--muted)] uppercase tracking-widest mb-1">Weekly Check-in</p>
                <p className="text-[var(--primary)] font-medium">Ready for this week</p>
              </div>
              <Link href="/checkin" className="bg-stone-100 text-[var(--primary)] px-5 py-2 rounded-full text-sm font-medium">
                Start
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
