import Link from 'next/link';
import type { Metadata } from 'next';
import Footer from '../Footer';

export const metadata: Metadata = {
  title: "Privacy Policy — SayYes",
  description: "SayYes is private-first. Learn how we protect your relationship data and keep your connection secure.",
  alternates: {
    canonical: '/privacy',
  },
  openGraph: {
    title: "Privacy Policy — SayYes",
    description: "SayYes is private-first. Learn how we protect your relationship data and keep your connection secure.",
    url: '/privacy',
    type: 'website',
  },
};

export const runtime = 'edge';

export default function PrivacyPage() {
  return (
    <main className="flex min-h-screen flex-col bg-[var(--background)]">
      <div className="max-w-2xl mx-auto w-full space-y-12 p-6 md:p-24 flex-grow">
        <header>
          <Link href="/" className="text-xs text-[var(--muted)] uppercase tracking-widest hover:text-[var(--primary)] transition-colors">
            ← Home
          </Link>
          <h1 className="text-3xl font-light text-[var(--primary)] mt-8">Privacy Policy</h1>
          <p className="text-xs text-[var(--muted)] uppercase tracking-widest mt-2">Last Updated: January 27, 2026</p>
        </header>

        <div className="space-y-8 text-[var(--muted)] leading-relaxed">
          <section className="space-y-4">
            <h2 className="text-xl font-medium text-[var(--primary)]">1. Our Commitment</h2>
            <p>
              SayYes is built on the principle of intentionality and trust. Your relationship 
              data is private by design. We only collect the minimum information required to 
              operate the service and connect you with your partner.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-medium text-[var(--primary)]">2. Data We Collect</h2>
            <p>
              We collect your email address and name (provided by you or your login provider) 
              to identify your account. During check-ins, we store your scores and optional 
              private notes. These notes are never shared with your partner; only the scores 
              are compared to show alignment.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-medium text-[var(--primary)]">3. How We Use Data</h2>
            <p>
              Your data is used solely to facilitate your weekly connection. We do not sell 
              your data, and we do not use it for advertising. Your email is used for 
              authentication links and weekly reminder notifications.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-medium text-[var(--primary)]">4. Your Rights</h2>
            <p>
              You own your data. You may request to see your information or have your 
              account and all associated data deleted at any time by contacting us at 
              <span dangerouslySetInnerHTML={{ __html: '<!--email_off-->' }} />info@sayyesapp.com<span dangerouslySetInnerHTML={{ __html: '<!--email_on-->' }} />.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-medium text-[var(--primary)]">5. Security</h2>
            <p>
              We use industry-standard encryption and secure infrastructure provided by 
              Cloudflare to protect your connection.
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  );
}
