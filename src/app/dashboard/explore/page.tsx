import { getSession } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/admin';
import { getWeekDate } from '@/lib/checkin';
import { getDeepDiveCategory, type BridgeInsight } from '@/lib/deepdive';
import { getResponses, type DeepDiveRow } from '@/lib/deepdive-server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import ExploreForm from './ExploreForm';
import RevealButton from './RevealButton';

export const runtime = 'edge';

const CATEGORY = 'intimacy';

export default async function ExplorePage() {
  const context = getRequestContext();
  const env = context.env as CloudflareEnv;
  const db = env.DB;
  const user = await getSession(db);

  if (!user) redirect('/auth/login');

  // Beta: limit to admins until the AI binding + migration are live in prod.
  if (!isAdmin(user.email, env)) redirect('/dashboard');

  const cat = getDeepDiveCategory(CATEGORY)!;

  const Shell = ({ children }: { children: React.ReactNode }) => (
    <main className="flex min-h-screen flex-col bg-[var(--background)] p-6">
      <header className="flex justify-between items-center max-w-xl mx-auto w-full mb-10">
        <Link
          href="/dashboard"
          className="text-xs text-[var(--muted)] uppercase tracking-widest hover:text-[var(--primary)] transition-colors"
        >
          ← Dashboard
        </Link>
        <h1 className="text-xl font-light tracking-tight text-[var(--primary)]">Explore together</h1>
        <span className="w-16" />
      </header>
      <div className="max-w-xl mx-auto w-full pb-16">{children}</div>
    </main>
  );

  if (!user.couple_id) {
    return (
      <Shell>
        <div className="bg-white border border-[var(--accent)] rounded-3xl p-8 text-center shadow-sm">
          <h2 className="text-lg font-light text-[var(--primary)] mb-3">Connect with your partner first</h2>
          <p className="text-sm text-[var(--muted)] mb-6">
            Exploring a topic together needs both of you. Invite your partner to begin.
          </p>
          <Link
            href="/dashboard/invite"
            className="inline-block bg-[var(--primary)] text-white px-8 py-3 rounded-full font-medium"
          >
            Invite Partner
          </Link>
        </div>
      </Shell>
    );
  }

  const weekDate = getWeekDate();

  const dive = await db
    .prepare('SELECT * FROM deep_dives WHERE couple_id = ? AND category = ? AND week_date = ?')
    .bind(user.couple_id, CATEGORY, weekDate)
    .first<DeepDiveRow>();

  const responses = dive ? await getResponses(db, dive.id) : [];
  const myResponse = responses.find((r) => r.user_id === user.id);
  const partnerResponded = responses.some((r) => r.user_id !== user.id);
  const insight: BridgeInsight | null = dive?.insight_json
    ? (JSON.parse(dive.insight_json) as BridgeInsight)
    : null;

  const partner = await db
    .prepare('SELECT name, email FROM users WHERE couple_id = ? AND id != ?')
    .bind(user.couple_id, user.id)
    .first<{ name: string | null; email: string }>();
  const partnerFirstName =
    (partner?.name || partner?.email?.split('@')[0] || 'your partner').split(' ')[0];

  // 1. Insight ready → show it
  if (insight) {
    return (
      <Shell>
        <div className="space-y-5">
          <p className="text-center text-[10px] text-[var(--muted)] uppercase tracking-widest">
            {cat.name} · Your shared insight
          </p>

          {insight.safety ? (
            <div className="bg-white border border-amber-200 rounded-3xl p-8 shadow-sm space-y-4">
              <p className="text-sm text-[var(--primary)] leading-relaxed">{insight.sharedNeed}</p>
              <p className="text-sm text-[var(--muted)] leading-relaxed">{insight.experiment}</p>
              <p className="text-xs text-[var(--muted)] leading-relaxed border-t border-stone-100 pt-4">
                If you ever feel unsafe or pressured, you deserve support. Consider reaching out to
                someone you trust or a local support service.
              </p>
            </div>
          ) : (
            <>
              <div className="bg-white border border-[var(--primary)] rounded-3xl p-8 shadow-sm">
                <p className="text-[10px] text-[var(--muted)] uppercase tracking-widest mb-3">
                  What you both seem to need
                </p>
                <p className="text-lg font-light text-[var(--primary)] leading-relaxed">
                  {insight.sharedNeed}
                </p>
              </div>

              <div className="bg-white border border-[var(--accent)] rounded-3xl p-6 shadow-sm">
                <p className="text-[10px] text-[var(--muted)] uppercase tracking-widest mb-2">
                  Where you already agree
                </p>
                <p className="text-sm text-[var(--primary)] leading-relaxed">{insight.commonGround}</p>
              </div>

              {insight.difference && (
                <div className="bg-white border border-[var(--accent)] rounded-3xl p-6 shadow-sm">
                  <p className="text-[10px] text-[var(--muted)] uppercase tracking-widest mb-2">
                    One difference, gently
                  </p>
                  <p className="text-sm text-[var(--primary)] leading-relaxed">{insight.difference}</p>
                </div>
              )}

              <div className="bg-stone-50 border border-[var(--primary)]/20 rounded-3xl p-6 shadow-sm">
                <p className="text-[10px] text-[var(--muted)] uppercase tracking-widest mb-2">
                  One small thing to try
                </p>
                <p className="text-sm text-[var(--primary)] leading-relaxed italic">
                  &quot;{insight.experiment}&quot;
                </p>
              </div>
            </>
          )}

          <p className="text-center text-xs text-[var(--muted)] leading-relaxed pt-4 px-6">
            This is a starting point for a conversation, not a verdict. Be curious with each other.
          </p>
          <p className="text-center text-[10px] text-[var(--muted)] uppercase tracking-widest pt-2">
            Your individual reflections were discarded — only this shared insight remains.
          </p>
        </div>
      </Shell>
    );
  }

  // 2. Both responded but no insight yet (e.g. generation failed) → reveal/retry
  if (myResponse && partnerResponded) {
    return (
      <Shell>
        <div className="space-y-6">
          <div className="bg-white border border-[var(--accent)] rounded-3xl p-8 text-center shadow-sm">
            <h2 className="text-lg font-light text-[var(--primary)] mb-2">You&apos;re both in</h2>
            <p className="text-sm text-[var(--muted)]">
              Reveal the shared insight from both of your reflections.
            </p>
          </div>
          <RevealButton category={CATEGORY} />
        </div>
      </Shell>
    );
  }

  // 3. I responded, waiting for partner
  if (myResponse && !partnerResponded) {
    return (
      <Shell>
        <div className="bg-white border border-[var(--accent)] rounded-3xl p-8 text-center shadow-sm space-y-4">
          <h2 className="text-lg font-light text-[var(--primary)]">Thank you for reflecting</h2>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Your shared insight will appear once {partnerFirstName} adds their perspective. Your words
            stay private until then.
          </p>
          <Link
            href="/dashboard"
            className="inline-block text-xs text-[var(--muted)] uppercase tracking-widest border border-[var(--accent)] px-5 py-2 rounded-full hover:text-[var(--primary)] transition-colors"
          >
            Back to dashboard
          </Link>
        </div>
      </Shell>
    );
  }

  // 4. Default → the form
  return (
    <Shell>
      <div className="space-y-6">
        <div className="bg-white border border-[var(--accent)] rounded-3xl p-6 shadow-sm">
          <p className="text-[10px] text-[var(--muted)] uppercase tracking-widest mb-2">{cat.name}</p>
          <p className="text-sm text-[var(--muted)] leading-relaxed">{cat.intro}</p>
        </div>
        <ExploreForm
          category={CATEGORY}
          facets={cat.facets}
          whatWouldHelp={cat.whatWouldHelp}
          reflectionPrompt={cat.reflectionPrompt}
          initial={
            myResponse
              ? {
                  primaryFacet: myResponse.primary_facet,
                  reflection: myResponse.reflection,
                  whatWouldHelp: myResponse.what_would_help,
                }
              : undefined
          }
        />
      </div>
    </Shell>
  );
}
