import Link from 'next/link';

export const runtime = 'edge';

export default function TermsPage() {
  return (
    <main className="flex min-h-screen flex-col bg-[var(--background)] p-6 md:p-24">
      <div className="max-w-2xl mx-auto w-full space-y-12">
        <header>
          <Link href="/" className="text-xs text-[var(--muted)] uppercase tracking-widest hover:text-[var(--primary)] transition-colors">
            ← Home
          </Link>
          <h1 className="text-3xl font-light text-[var(--primary)] mt-8">Terms of Service</h1>
          <p className="text-xs text-[var(--muted)] uppercase tracking-widest mt-2">Last Updated: January 27, 2026</p>
        </header>

        <div className="space-y-8 text-[var(--muted)] leading-relaxed">
          <section className="space-y-4">
            <h2 className="text-xl font-medium text-[var(--primary)]">1. Acceptance of Terms</h2>
            <p>
              By using SayYes, you agree to these terms. If you do not agree, please do 
              not use the service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-medium text-[var(--primary)]">2. Not Therapy</h2>
            <p>
              SayYes is a tool for relationship reflection and intentionality. It is not 
              therapy, counseling, or medical advice. It is not designed for 
              relationships in crisis or situations involving abuse. If you are in a 
              crisis, please seek professional help.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-medium text-[var(--primary)]">3. Use of Service</h2>
            <p>
              You must provide accurate information and maintain the security of your 
              login method. You are responsible for the content you enter into the app.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-medium text-[var(--primary)]">4. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your access to the service 
              for any reason, particularly if you violate the intent of maintaining 
              a safe and intentional space.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-medium text-[var(--primary)]">5. Limitation of Liability</h2>
            <p>
              SayYes is provided &quot;as is.&quot; We are not liable for any relationship 
              outcomes or data issues resulting from the use of this tool.
            </p>
          </section>
        </div>

        <footer className="pt-12 border-t border-stone-100">
          <p className="text-sm">Contact: info@sayyesapp.com</p>
        </footer>
      </div>
    </main>
  );
}
