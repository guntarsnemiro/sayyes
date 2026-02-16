import Link from 'next/link';
import type { Metadata } from 'next';
import Footer from './Footer';

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
  },
  openGraph: {
    url: '/',
  },
};

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default async function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-[var(--background)]">
      {/* ... previous content ... */}
      <div className="max-w-2xl mx-auto px-6 space-y-20 pb-32">
        {/* ... previous content ... */}
        <div className="pt-12 text-center">
          <Link href="/auth/login" className="inline-block bg-[#44403c] text-white px-10 py-4 rounded-full font-medium active:scale-95 transition-all shadow-sm hover:opacity-90">
            Start Your Connection
          </Link>
        </div>
      </div>

      <Footer />
    </main>
  );
}
