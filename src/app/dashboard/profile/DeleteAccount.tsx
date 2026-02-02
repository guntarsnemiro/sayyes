'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DeleteAccount({ userName }: { userName: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/profile/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: confirmation.trim() }),
      });

      if (res.ok) {
        router.push('/');
        router.refresh();
      } else {
        const data = await res.json() as { error?: string };
        setError(data.error || 'Failed to delete account');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const isConfirmed = confirmation.trim().toUpperCase() === 'DELETE' || 
                     (userName && confirmation.trim().toUpperCase() === userName.trim().toUpperCase());

  if (!isOpen) {
    return (
      <div className="mt-12 pt-8 border-t border-stone-100">
        <button
          onClick={() => setIsOpen(true)}
          className="w-full border border-rose-100 text-rose-500 px-6 py-3 rounded-full text-xs font-medium hover:bg-rose-50 transition-all"
        >
          Delete My Account
        </button>
      </div>
    );
  }

  return (
    <div className="mt-12 pt-8 border-t border-rose-100 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="bg-rose-50 rounded-3xl p-6 border border-rose-100">
        <h3 className="text-sm font-medium text-rose-900 mb-2">Are you absolutely sure?</h3>
        <p className="text-xs text-rose-700 leading-relaxed mb-6">
          This action is permanent and cannot be undone. All your check-ins, scores, and profile data will be deleted immediately.
        </p>

        <form onSubmit={handleDelete} className="space-y-4">
          <div>
            <label className="block text-[10px] text-rose-900 uppercase tracking-widest mb-2 font-medium">
              Type <span className="font-bold">DELETE</span> {userName ? `or "${userName}"` : ''} to confirm
            </label>
            <input
              type="text"
              placeholder="Confirmation"
              required
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              className="w-full bg-white border border-rose-200 text-rose-900 px-5 py-3 rounded-full focus:outline-none focus:ring-1 focus:ring-rose-500 text-sm"
            />
          </div>

          {error && <p className="text-rose-600 text-[10px] text-center">{error}</p>}

          <div className="flex flex-col gap-2">
            <button
              type="submit"
              disabled={loading || !isConfirmed}
              className="w-full bg-rose-500 text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-rose-600 active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {loading ? 'Deleting...' : 'Permanently Delete My Data'}
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full text-stone-500 px-6 py-2 rounded-full text-xs hover:text-stone-700 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
