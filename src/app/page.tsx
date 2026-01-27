import Link from 'next/link';
import { getSession } from '@/lib/auth/session';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { redirect } from 'next/navigation';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default async function Home() {
  const context = getRequestContext();
  const env = context.env as CloudflareEnv;
  const db = env.DB;
  const user = await getSession(db);

  if (user) {
    redirect('/dashboard');
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-6 md:p-24 bg-[var(--background)]">
      <div className="z-10 w-full max-w-sm flex flex-col items-center text-center mt-20">
        <h1 className="text-4xl font-light tracking-tight text-[var(--primary)] mb-4">
          SayYes
        </h1>
        <p className="text-[var(--muted)] text-lg leading-relaxed mb-12 px-4">
          A weekly space for couples who choose to stay together.
        </p>

        <div className="flex flex-col w-full gap-4">
          <Link href="/auth/login" className="bg-[#44403c] text-white px-8 py-4 rounded-full font-medium active:scale-95 transition-transform text-center shadow-sm">
            Get Started
          </Link>
          <p className="text-xs text-[var(--muted)] mt-4">
            Private. Intentional. Calm.
          </p>
        </div>
      </div>

      <footer className="w-full max-w-sm text-center pb-8">
        <p className="text-xs text-[var(--accent)] uppercase tracking-widest">
          Choose connection every week
        </p>
      </footer>
    </main>
  );
}
