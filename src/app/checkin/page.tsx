'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CHECKIN_CATEGORIES } from '@/lib/checkin';
import Link from 'next/link';

export default function CheckinPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { score: number, note: string }>>({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const currentCategory = CHECKIN_CATEGORIES[currentStep];

  const handleScore = (score: number) => {
    setAnswers({
      ...answers,
      [currentCategory.id]: { ...answers[currentCategory.id], score }
    });
  };

  const handleNote = (note: string) => {
    setAnswers({
      ...answers,
      [currentCategory.id]: { ...answers[currentCategory.id], note }
    });
  };

  const nextStep = async () => {
    if (currentStep < CHECKIN_CATEGORIES.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await submitCheckin();
    }
  };

  const submitCheckin = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });

      if (res.ok) {
        router.push('/dashboard');
      } else {
        alert('Failed to save check-in');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const isCurrentStepAnswered = !!answers[currentCategory.id]?.score;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-[var(--background)]">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex justify-between items-center mb-12">
          <Link href="/dashboard" className="text-xs text-[var(--muted)] uppercase tracking-widest">Cancel</Link>
          <div className="flex gap-1">
            {CHECKIN_CATEGORIES.map((_, i) => (
              <div 
                key={i} 
                className={`h-1 w-6 rounded-full transition-colors ${i <= currentStep ? 'bg-[var(--primary)]' : 'bg-[var(--accent)]'}`} 
              />
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <p className="text-xs text-[var(--muted)] uppercase tracking-widest">{currentCategory.name}</p>
          <h1 className="text-2xl font-light text-[var(--primary)] leading-snug">
            {currentCategory.question}
          </h1>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            {currentCategory.description}
          </p>
        </div>

        <div className="flex justify-between items-center pt-8">
          {[1, 2, 3, 4, 5].map((score) => (
            <button
              key={score}
              onClick={() => handleScore(score)}
              className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-medium transition-all ${
                answers[currentCategory.id]?.score === score 
                  ? 'bg-[var(--primary)] text-white scale-110 shadow-md' 
                  : 'bg-white border border-[var(--accent)] text-[var(--muted)] hover:border-[var(--primary)]'
              }`}
            >
              {score}
            </button>
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-[var(--muted)] uppercase tracking-widest px-2">
          <span>Not at all</span>
          <span>Completely</span>
        </div>

        <div className="pt-8">
          <textarea
            placeholder="Optional reflection..."
            value={answers[currentCategory.id]?.note || ''}
            onChange={(e) => handleNote(e.target.value)}
            className="w-full bg-white border border-[var(--accent)] rounded-2xl p-4 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary)] transition-all h-24 resize-none"
          />
        </div>

        <button
          onClick={nextStep}
          disabled={!isCurrentStepAnswered || loading}
          className="w-full bg-[var(--primary)] text-white px-6 py-4 rounded-full font-medium hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-30 disabled:grayscale mt-8 shadow-sm"
        >
          {currentStep === CHECKIN_CATEGORIES.length - 1 ? (loading ? 'Saving...' : 'Finish Check-in') : 'Next Category'}
        </button>
      </div>
    </main>
  );
}
