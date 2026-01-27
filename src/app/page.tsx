import Link from 'next/link';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default async function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-[var(--background)]">
      {/* Hero Section */}
      <section className="flex flex-col items-center text-center px-6 pt-24 pb-16 md:pt-32 md:pb-24 max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-light tracking-tight text-[var(--primary)] mb-6 leading-tight">
          A weekly connection for couples who choose to stay together
        </h1>
        <p className="text-[var(--muted)] text-lg md:text-xl leading-relaxed mb-12 max-w-2xl">
          SayYes is a calm, weekly relationship check-in designed to prevent drift and keep your connection intentional.
        </p>

        <div className="flex flex-col w-full max-w-sm gap-4">
          <Link href="/auth/login" className="bg-[#44403c] text-white px-10 py-4 rounded-full font-medium active:scale-95 transition-all text-center shadow-sm hover:opacity-90">
            Get Started
          </Link>
          <p className="text-[10px] text-[var(--muted)] uppercase tracking-widest mt-2">
            Private. Intentional. Calm.
          </p>
        </div>
      </section>

      {/* Main Content Body */}
      <div className="max-w-2xl mx-auto px-6 space-y-20 pb-32">
        
        {/* Section 1 */}
        <section>
          <h2 className="text-2xl font-light text-[var(--primary)] mb-6">Why relationships drift</h2>
          <div className="text-[var(--muted)] space-y-4 leading-relaxed">
            <p>
              Relationships rarely break suddenly. Most of the time, they experience a slow erosion. 
              It is the accumulation of silence, small unresolved issues, and the weight of daily 
              logistics that creates distance over months or years.
            </p>
            <p>
              This drift isn&apos;t anyone&apos;s fault. It happens because life gets busy and 
              intentional connection becomes a secondary priority. SayYes is designed to address 
              this erosion with no blame, no drama, and no heavy clinical language.
            </p>
          </div>
        </section>

        {/* Section 2 */}
        <section>
          <h2 className="text-2xl font-light text-[var(--primary)] mb-6">What SayYes does</h2>
          <div className="text-[var(--muted)] space-y-4 leading-relaxed">
            <p>
              SayYes provides a calm structure for relationship maintenance. Every week, you and 
              your partner answer five simple questions about your connection—separately and privately. 
              These cover the core areas of your life together: emotional support, intimacy, money, 
              logistics, and respect.
            </p>
            <p>
              Once you both finish, the app reveals where you are aligned and where you might need 
              a little more focus. It is not therapy, and it doesn&apos;t give advice. It simply 
              creates a rhythm for you to look at each other again.
            </p>
          </div>
        </section>

        {/* Section 3 */}
        <section>
          <h2 className="text-2xl font-light text-[var(--primary)] mb-6">A simple weekly relationship check-in</h2>
          <div className="text-[var(--muted)] space-y-4 leading-relaxed">
            <p>
              Consistency is more powerful than intensity. A simple weekly relationship check-in 
              takes only a few minutes, but its impact builds significantly over time. It creates 
              a sustainable habit of relationship reflection that keeps you both on the same page.
            </p>
            <p>
              By checking in once a week, you gain clarity on your relationship alignment without 
              the pressure of a long, heavy conversation. It is a moment of shared intentionality 
              in a fast-paced world.
            </p>
          </div>
        </section>

        {/* Section 4 */}
        <section>
          <h2 className="text-2xl font-light text-[var(--primary)] mb-6">A calm alternative to communication exercises for couples</h2>
          <div className="text-[var(--muted)] space-y-4 leading-relaxed">
            <p>
              Many communication exercises for couples feel heavy, clinical, or even awkward. 
              They often require a level of emotional energy that is hard to find after a long 
              day of work or parenting.
            </p>
            <p>
              SayYes is a lighter, more neutral alternative. Instead of constant effort or forced 
              &quot;talks,&quot; we offer one structured moment every week. It&apos;s an easy way to 
              practice couples communication without the weight of traditional exercises.
            </p>
          </div>
        </section>

        {/* Section 5 */}
        <section>
          <h2 className="text-2xl font-light text-[var(--primary)] mb-6">Who this is for</h2>
          <div className="text-[var(--muted)] space-y-4 leading-relaxed">
            <p>
              SayYes is for couples who want to stay together and are looking for ways of 
              staying connected as a couple. It is for those who feel &quot;something is off&quot; 
              but can&apos;t quite name it, or for those who simply want to protect their 
              connection from the drift before it starts.
            </p>
            <p className="border-l-2 border-stone-200 pl-6 italic italic text-sm">
              Important: SayYes is not designed for relationships in crisis, situations involving 
              abuse, or couples who have already decided to separate. It is a tool for 
              intentional maintenance, not emergency intervention.
            </p>
          </div>
        </section>

        {/* Section 6 */}
        <section>
          <h2 className="text-2xl font-light text-[var(--primary)] mb-6">Why weekly works</h2>
          <div className="text-[var(--muted)] space-y-4 leading-relaxed">
            <p>
              We believe daily relationship apps often fail because they feel like another chore 
              on your to-do list. Daily prompts can lead to defensiveness or &quot;notification fatigue.&quot;
            </p>
            <p>
              A weekly rhythm works better because it allows for reflection without constant pressure. 
              Consistency over intensity is the secret to long-term connection. It&apos;s about 
              the quiet, steady choice to say yes to each other every week.
            </p>
          </div>
        </section>

        {/* Final CTA */}
        <div className="pt-12 text-center">
          <Link href="/auth/login" className="inline-block bg-[#44403c] text-white px-10 py-4 rounded-full font-medium active:scale-95 transition-all shadow-sm hover:opacity-90">
            Start Your Connection
          </Link>
        </div>
      </div>

      {/* Footer (Phase 3) */}
      <footer className="w-full border-t border-stone-100 bg-stone-50 py-16 px-6">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <div className="space-y-2">
            <p className="text-sm font-medium text-[var(--primary)]">SayYes</p>
            <p className="text-xs text-[var(--muted)] uppercase tracking-widest">Not therapy. Privacy-first. Designed for intentionality.</p>
          </div>
          
          <div className="flex justify-center gap-8 text-[10px] text-[var(--muted)] uppercase tracking-widest">
            <Link href="/privacy" className="hover:text-[var(--primary)] transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-[var(--primary)] transition-colors">Terms of Service</Link>
            <a href="mailto:info@sayyesapp.com" className="hover:text-[var(--primary)] transition-colors">info@sayyesapp.com</a>
          </div>

          <p className="text-[10px] text-[var(--accent)]">
            &copy; {new Date().getFullYear()} SayYes. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
