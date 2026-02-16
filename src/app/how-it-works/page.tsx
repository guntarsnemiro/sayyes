import Link from 'next/link';
import type { Metadata } from 'next';
import Footer from '../Footer';

export const metadata: Metadata = {
  title: "How it works — SayYes",
  description: "Learn how a simple weekly rhythm can prevent relationship drift and build sustainable clarity for long-term connection.",
  alternates: {
    canonical: '/how-it-works',
  },
  openGraph: {
    title: "How it works — SayYes",
    description: "Learn how a simple weekly rhythm can prevent relationship drift and build sustainable clarity for long-term connection.",
    url: '/how-it-works',
    type: 'website',
  },
};

export const runtime = 'edge';

export default function HowItWorksPage() {
  return (
    <main className="flex min-h-screen flex-col bg-[var(--background)]">
      <div className="max-w-2xl mx-auto w-full space-y-12 p-6 md:p-24 flex-grow">
        <header>
          <Link href="/" className="text-xs text-[var(--muted)] uppercase tracking-widest hover:text-[var(--primary)] transition-colors">
            ← Home
          </Link>
          <h1 className="text-3xl font-light text-[var(--primary)] mt-8">How a weekly relationship check-in works</h1>
          <p className="text-xs text-[var(--muted)] uppercase tracking-widest mt-2">Sustainable clarity for long-term connection</p>
        </header>

        <div className="space-y-12 text-[var(--muted)] leading-relaxed">
          <section className="space-y-4">
            <h2 className="text-xl font-medium text-[var(--primary)]">The Rhythm of Consistency</h2>
            <p>
              SayYes is built on the belief that relationship maintenance shouldn&apos;t feel like a heavy clinical exercise. 
              Instead, it should be a quiet, predictable rhythm. By checking in once a week, you prevent the slow drift 
              that happens when life gets busy and communication becomes purely logistical.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-medium text-[var(--primary)]">1. Private Reflection</h2>
            <p>
              Every week, you and your partner receive a notification that your connection space is ready. 
              You each answer five simple questions independently. These questions cover the core pillars of 
              a healthy partnership: emotional support, physical intimacy, financial alignment, household 
              logistics, and mutual respect.
            </p>
            <p>
              Answering separately ensures that your responses are honest and uninfluenced by your partner&apos;s current mood 
              or presence. It is a moment of personal reflection on the relationship.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-medium text-[var(--primary)]">2. Shared Alignment</h2>
            <p>
              Once both partners have finished their check-in, the results are revealed. SayYes highlights your 
              &quot;Alignment Score&quot;—a percentage that reflects how synchronized you feel across all categories.
            </p>
            <p>
              This isn&apos;t about a &quot;perfect score.&quot; It is about visibility. Seeing a lower score in 
              logistics or emotional support isn&apos;t a failure; it&apos;s a neutral signal that those areas simply 
              need a little more intentionality in the coming week.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-medium text-[var(--primary)]">3. Actionable Clarity</h2>
            <p>
              The goal of the check-in is to move from vague feelings of &quot;something is off&quot; to specific clarity. 
              Instead of having a heavy, two-hour &quot;talk&quot; about everything, you can have a five-minute 
              conversation about the one specific category that needs attention.
            </p>
            <p>
              Over time, SayYes tracks your Relationship Pulse, showing you how your alignment trends. This long-term 
              view helps you see progress and identify patterns before they become deep-seated issues.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-medium text-[var(--primary)]">Why it works</h2>
            <ul className="space-y-4 list-none pl-0">
              <li className="flex gap-4">
                <span className="text-[var(--primary)] font-medium">Low Friction:</span>
                <span>Takes less than five minutes a week.</span>
              </li>
              <li className="flex gap-4">
                <span className="text-[var(--primary)] font-medium">Neutral Language:</span>
                <span>Avoids clinical jargon or blame-heavy prompts.</span>
              </li>
              <li className="flex gap-4">
                <span className="text-[var(--primary)] font-medium">Privacy-First:</span>
                <span>Your private notes are never shared; only the scores are compared.</span>
              </li>
            </ul>
          </section>
        </div>

        <div className="pt-12 border-t border-stone-100">
          <Link href="/auth/login" className="inline-block bg-[#44403c] text-white px-8 py-3 rounded-full font-medium active:scale-95 transition-all text-center self-start">
            Start your first check-in
          </Link>
        </div>
      </div>
      <Footer />
    </main>
  );
}
