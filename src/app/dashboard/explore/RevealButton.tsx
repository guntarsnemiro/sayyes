'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RevealButton({ category }: { category: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleReveal = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/deepdive/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || 'Could not reveal yet.');
        return;
      }
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <button
        onClick={handleReveal}
        disabled={loading}
        className="w-full bg-[var(--primary)] text-white px-6 py-4 rounded-full font-medium hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
      >
        {loading ? 'Reflecting together…' : 'Reveal our shared insight'}
      </button>
      {error && <p className="text-center text-xs text-red-500">{error}</p>}
    </div>
  );
}
