'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function InvitePage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push('/dashboard'), 3000);
      } else {
        setError(data.error || 'Failed to send invitation');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-[var(--background)]">
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-light text-[var(--primary)]">Invitation Sent</h1>
          <p className="text-[var(--muted)]">
            We&apos;ve sent a connection request to <span className="font-medium text-[var(--primary)]">{email}</span>.
          </p>
          <p className="text-xs text-[var(--muted)] uppercase tracking-widest pt-4">
            Redirecting to dashboard...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-[var(--background)]">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <Link href="/dashboard" className="text-xs text-[var(--muted)] uppercase tracking-widest hover:text-[var(--primary)] transition-colors">
            ← Back to Dashboard
          </Link>
          <h1 className="mt-8 text-2xl font-light text-[var(--primary)]">Invite your partner</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Enter your partner&apos;s email to start your weekly connection together.
          </p>
        </div>

        <form onSubmit={handleInvite} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="partner@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white border border-[var(--accent)] text-[var(--primary)] px-5 py-3 rounded-full focus:outline-none focus:ring-1 focus:ring-[var(--primary)] transition-all"
            />
          </div>

          {error && <p className="text-center text-xs text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full bg-[var(--primary)] text-white px-6 py-3 rounded-full font-medium hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Invitation'}
          </button>
        </form>

        <p className="text-[10px] text-center text-[var(--muted)] uppercase tracking-widest leading-relaxed px-4">
          SayYes is private. Your partner will receive an email to join you.
        </p>
      </div>
    </main>
  );
}
