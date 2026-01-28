'use client';

import { useState } from 'react';

type FeedbackType = 'bug' | 'idea' | 'love';

export default function FeedbackForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>('idea');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, message }),
      });

      if (res.ok) {
        setSuccess(true);
        setMessage('');
        setTimeout(() => {
          setSuccess(false);
          setIsOpen(false);
        }, 3000);
      } else {
        const data = await res.json() as { error?: string };
        setError(data.error || 'Failed to submit feedback');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <div className="mt-8 pt-8 border-t border-stone-100 text-center">
        <button
          onClick={() => setIsOpen(true)}
          className="text-[10px] text-stone-400 uppercase tracking-widest font-medium hover:text-stone-600 transition-colors"
        >
          Share Feedback
        </button>
      </div>
    );
  }

  return (
    <div className="mt-8 pt-8 border-t border-stone-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {success ? (
        <div className="bg-green-50 border border-green-100 rounded-3xl p-6 text-center">
          <p className="text-xs text-green-700 font-medium">✨ Thank you! Your feedback helps us grow.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs text-stone-400 uppercase tracking-widest font-medium">What&apos;s on your mind?</h3>
            <button 
              type="button" 
              onClick={() => setIsOpen(false)}
              className="text-stone-300 hover:text-stone-500"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M15 5L5 15M5 5l10 10" />
              </svg>
            </button>
          </div>

          <div className="flex gap-2">
            {(['bug', 'idea', 'love'] as FeedbackType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 py-2 rounded-2xl text-[10px] uppercase tracking-widest font-medium border transition-all ${
                  type === t 
                    ? 'bg-[var(--primary)] text-white border-[var(--primary)]' 
                    : 'bg-white text-stone-400 border-stone-100 hover:border-stone-200'
                }`}
              >
                {t === 'bug' ? '🐞 Bug' : t === 'idea' ? '💡 Idea' : '❤️ Love'}
              </button>
            ))}
          </div>

          <textarea
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={
              type === 'bug' ? "What broke? (e.g. results not loading)" :
              type === 'idea' ? "What's your suggestion?" :
              "What do you enjoy about SayYes?"
            }
            className="w-full bg-stone-50 border border-stone-100 text-[var(--primary)] p-4 rounded-2xl text-xs focus:outline-none focus:ring-1 focus:ring-[var(--primary)] transition-all min-h-[100px] resize-none"
          />

          {error && <p className="text-rose-500 text-[10px] text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading || message.length < 5}
            className="w-full bg-stone-100 text-stone-600 py-3 rounded-full text-xs font-medium hover:bg-stone-200 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Feedback'}
          </button>
        </form>
      )}
    </div>
  );
}
