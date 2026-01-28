import { getSession } from '@/lib/auth/session';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import ProfileForm from './ProfileForm';
import DeleteAccount from './DeleteAccount';
import PushSettings from './PushSettings';

export const runtime = 'edge';

export default async function ProfilePage() {
  const context = getRequestContext();
  const env = context.env as CloudflareEnv;
  const db = env.DB;
  const user = await getSession(db);

  if (!user) {
    redirect('/auth/login');
  }

  // Fetch fresh user data including name
  const currentUser = await db.prepare('SELECT id, email, name FROM users WHERE id = ?')
    .bind(user.id)
    .first<{ id: string, email: string, name: string | null }>();

  if (!currentUser) {
    redirect('/auth/login');
  }

  return (
    <main className="flex min-h-screen flex-col bg-[var(--background)] p-6">
      <header className="flex justify-between items-center max-w-2xl mx-auto w-full mb-12">
        <Link href="/dashboard" className="text-xs text-[var(--muted)] uppercase tracking-widest hover:text-[var(--primary)] transition-colors">
          ← Dashboard
        </Link>
        <h1 className="text-xl font-light tracking-tight text-[var(--primary)]">
          Profile Settings
        </h1>
        <div className="w-12"></div>
      </header>

      <div className="max-w-md mx-auto w-full">
        <div className="bg-white border border-[var(--accent)] rounded-3xl p-8 shadow-sm">
          <ProfileForm initialName={currentUser.name || ''} email={currentUser.email} />
          <PushSettings />
          <DeleteAccount userName={currentUser.name || ''} />
        </div>
        
        <p className="text-[10px] text-[var(--muted)] uppercase tracking-widest leading-relaxed px-4 mt-8 text-center">
          Your display name is how you appear to your partner during check-ins and on the dashboard.
        </p>
      </div>
    </main>
  );
}
