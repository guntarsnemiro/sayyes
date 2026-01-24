import { getRequestContext } from '@cloudflare/next-on-pages';
import { getSession } from '@/lib/auth/session';
import Link from 'next/link';

export const runtime = 'edge';

interface InvitePageProps {
  params: Promise<{ id: string }>;
}

export default async function AcceptInvitePage({ params }: InvitePageProps) {
  const { id } = await params;
  const context = getRequestContext();
  const env = context.env as CloudflareEnv;
  const db = env.DB;

  // 1. Fetch the invitation
  const invite = await db.prepare(`
    SELECT invitations.*, users.email as inviter_email, users.name as inviter_name
    FROM invitations
    JOIN users ON invitations.inviter_id = users.id
    WHERE invitations.id = ? AND invitations.status = 'pending'
  `).bind(id).first<{ 
    id: string, 
    inviter_id: string, 
    invitee_email: string, 
    inviter_email: string, 
    inviter_name: string 
  }>();

  if (!invite) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-[var(--background)]">
        <div className="w-full max-w-sm text-center space-y-6">
          <h1 className="text-2xl font-light text-[var(--primary)]">Invitation not found</h1>
          <p className="text-[var(--muted)]">This invitation may have expired or already been used.</p>
          <Link href="/" className="inline-block bg-[var(--primary)] text-white px-8 py-3 rounded-full font-medium">
            Go Home
          </Link>
        </div>
      </main>
    );
  }

  // 2. Check if the current user is logged in
  const currentUser = await getSession(db);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-[var(--background)]">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="space-y-4">
          <h1 className="text-3xl font-light text-[var(--primary)] tracking-tight">SayYes</h1>
          <div className="pt-4">
            <p className="text-lg text-[var(--primary)] font-medium">
              {invite.inviter_name || invite.inviter_email}
            </p>
            <p className="text-[var(--muted)]">invited you to connect</p>
          </div>
        </div>

        <div className="bg-white border border-[var(--accent)] rounded-3xl p-8 shadow-sm">
          <p className="text-sm text-[var(--muted)] leading-relaxed mb-8">
            By joining, you both will start a weekly check-in to stay aligned and connected.
          </p>

          {!currentUser ? (
            <Link 
              href={`/auth/login?invite=${id}`} 
              className="block w-full bg-[var(--primary)] text-white px-6 py-3 rounded-full font-medium hover:opacity-90 active:scale-[0.98] transition-all"
            >
              Sign in to Join
            </Link>
          ) : (
            <form action="/api/invite/accept" method="POST">
              <input type="hidden" name="inviteId" value={id} />
              <button 
                type="submit"
                className="w-full bg-[var(--primary)] text-white px-6 py-3 rounded-full font-medium hover:opacity-90 active:scale-[0.98] transition-all"
              >
                Accept & Connect
              </button>
            </form>
          )}
        </div>

        <p className="text-[10px] text-[var(--muted)] uppercase tracking-widest leading-relaxed px-8">
          Private. Intentional. Calm.
        </p>
      </div>
    </main>
  );
}
