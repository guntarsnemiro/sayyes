import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full border-t border-stone-100 bg-stone-50 py-16 px-6">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        <div className="space-y-2">
          <p className="text-sm font-medium text-[var(--primary)]">SayYes</p>
          <p className="text-xs text-[var(--muted)] uppercase tracking-widest">Not therapy. Privacy-first. Designed for intentionality.</p>
          <p className="text-[10px] text-[var(--muted)] max-w-xs mx-auto leading-relaxed pt-2">
            SayYes is built by a small independent team focused on privacy-first tools for long-term relationships.
          </p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-[10px] text-[var(--muted)] uppercase tracking-widest">
          <Link href="/" className="hover:text-[var(--primary)] transition-colors">Home</Link>
          <Link href="/how-it-works" className="hover:text-[var(--primary)] transition-colors">How it works</Link>
          <Link href="/privacy" className="hover:text-[var(--primary)] transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-[var(--primary)] transition-colors">Terms of Service</Link>
          <a href="mailto:info@sayyesapp.com" className="hover:text-[var(--primary)] transition-colors">
            info<span>@</span>sayyesapp.com
          </a>
        </div>

        <p className="text-[10px] text-[var(--accent)]">
          &copy; {new Date().getFullYear()} SayYes. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
