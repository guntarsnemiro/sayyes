'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfileForm({ initialName, email }: { initialName: string, email: string }) {
  const [name, setName] = useState(initialName);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully' });
        router.refresh();
      } else {
        const data = await res.json() as { error?: string };
        setMessage({ type: 'error', text: data.error || 'Failed to update profile' });
      }
    } catch {
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-xs text-[var(--muted)] uppercase tracking-widest mb-2 px-1">
          Email Address
        </label>
        <input
          type="text"
          disabled
          value={email}
          className="w-full bg-stone-50 border border-[var(--accent)] text-stone-400 px-5 py-3 rounded-full cursor-not-allowed text-sm"
        />
      </div>

      <div>
        <label className="block text-xs text-[var(--muted)] uppercase tracking-widest mb-2 px-1">
          Display Name
        </label>
        <input
          type="text"
          placeholder="How should your partner call you?"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-white border border-[var(--accent)] text-[var(--primary)] px-5 py-3 rounded-full focus:outline-none focus:ring-1 focus:ring-[var(--primary)] transition-all"
        />
      </div>

      {message && (
        <p className={`text-center text-xs ${message.type === 'success' ? 'text-green-600' : 'text-rose-500'}`}>
          {message.text}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || name === initialName}
        className="w-full bg-[var(--primary)] text-white px-6 py-3 rounded-full font-medium hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:bg-stone-200 disabled:text-stone-400"
      >
        {loading ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
}
