'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CommitmentPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCommitment = async (status: 'yes' | 'unsure' | 'no') => {
    setLoading(true);
    try {
      const res = await fetch('/api/commitment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        router.push('/dashboard');
      } else {
        alert('Something went wrong. Please try again.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-[var(--background)]">
      <div className="w-full max-w-sm space-y-12 text-center">
        <div className="space-y-4">
          <h1 className="text-3xl font-light text-[var(--primary)] tracking-tight">The First Step</h1>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Every SayYes journey begins with a private intention. Please answer this one question to begin your connection.
          </p>
        </div>

        <div className="space-y-8">
          <h2 className="text-xl font-medium text-[var(--primary)] leading-snug px-4">
            Do you want to keep working on this relationship?
          </h2>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => handleCommitment('yes')}
              disabled={loading}
              className="w-full bg-[var(--primary)] text-white px-6 py-4 rounded-full font-medium hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              Yes, I do
            </button>
            <button
              onClick={() => handleCommitment('unsure')}
              disabled={loading}
              className="w-full bg-white border border-[var(--accent)] text-[var(--primary)] px-6 py-4 rounded-full font-medium hover:bg-stone-50 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              I&apos;m unsure right now
            </button>
            <button
              onClick={() => handleCommitment('no')}
              disabled={loading}
              className="w-full bg-stone-100 text-stone-500 px-6 py-4 rounded-full font-medium hover:bg-stone-200 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              No
            </button>
          </div>
        </div>

        <p className="text-[10px] text-[var(--muted)] uppercase tracking-widest leading-relaxed px-8">
          Your answer is completely private. It will never be shown to your partner.
        </p>
      </div>
    </main>
  );
}
