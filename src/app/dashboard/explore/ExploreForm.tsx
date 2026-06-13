'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Option {
  id: string;
  label: string;
}

interface ExploreFormProps {
  category: string;
  facets: Option[];
  whatWouldHelp: Option[];
  reflectionPrompt: string;
  initial?: {
    primaryFacet?: string | null;
    reflection?: string | null;
    whatWouldHelp?: string | null;
  };
}

export default function ExploreForm({
  category,
  facets,
  whatWouldHelp,
  reflectionPrompt,
  initial,
}: ExploreFormProps) {
  const router = useRouter();
  const [primaryFacet, setPrimaryFacet] = useState(initial?.primaryFacet || '');
  const [reflection, setReflection] = useState(initial?.reflection || '');
  const [help, setHelp] = useState(initial?.whatWouldHelp || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/deepdive/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          primaryFacet: primaryFacet || undefined,
          reflection: reflection || undefined,
          whatWouldHelp: help || undefined,
        }),
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        return;
      }
      router.refresh();
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="bg-white border border-[var(--accent)] rounded-3xl p-6 shadow-sm">
        <p className="text-xs text-[var(--muted)] uppercase tracking-widest mb-4">
          Which part feels most off right now?
        </p>
        <div className="space-y-2">
          {facets.map((f) => (
            <label
              key={f.id}
              className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                primaryFacet === f.id
                  ? 'border-[var(--primary)] bg-stone-50'
                  : 'border-[var(--accent)] hover:bg-stone-50'
              }`}
            >
              <input
                type="radio"
                name="facet"
                value={f.id}
                checked={primaryFacet === f.id}
                onChange={() => setPrimaryFacet(f.id)}
                className="accent-[var(--primary)]"
              />
              <span className="text-sm text-[var(--primary)]">{f.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="bg-white border border-[var(--accent)] rounded-3xl p-6 shadow-sm">
        <label className="block text-xs text-[var(--muted)] uppercase tracking-widest mb-3">
          In your own words
        </label>
        <p className="text-sm text-[var(--primary)] mb-3">{reflectionPrompt}</p>
        <textarea
          required
          minLength={10}
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          rows={5}
          placeholder="Write as honestly as you like — your partner never sees these words, only the shared insight."
          className="w-full bg-white border border-[var(--accent)] text-[var(--primary)] px-4 py-3 rounded-2xl focus:outline-none focus:ring-1 focus:ring-[var(--primary)] transition-all text-sm leading-relaxed"
        />
      </div>

      <div className="bg-white border border-[var(--accent)] rounded-3xl p-6 shadow-sm">
        <p className="text-xs text-[var(--muted)] uppercase tracking-widest mb-4">
          What would help most?
        </p>
        <div className="space-y-2">
          {whatWouldHelp.map((h) => (
            <label
              key={h.id}
              className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                help === h.id
                  ? 'border-[var(--primary)] bg-stone-50'
                  : 'border-[var(--accent)] hover:bg-stone-50'
              }`}
            >
              <input
                type="radio"
                name="help"
                value={h.id}
                checked={help === h.id}
                onChange={() => setHelp(h.id)}
                className="accent-[var(--primary)]"
              />
              <span className="text-sm text-[var(--primary)]">{h.label}</span>
            </label>
          ))}
        </div>
      </div>

      {error && <p className="text-center text-xs text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[var(--primary)] text-white px-6 py-4 rounded-full font-medium hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
      >
        {loading ? 'Saving…' : 'Share privately'}
      </button>
    </form>
  );
}
