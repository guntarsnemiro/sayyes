'use client';

import { useState } from 'react';

export default function CopyInviteButton({ inviteId }: { inviteId: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    const url = `${window.location.origin}/invite/${inviteId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={copy}
      className="text-[10px] text-[var(--muted)] uppercase tracking-widest hover:text-[var(--primary)] transition-colors border border-[var(--accent)] px-4 py-2 rounded-full flex items-center gap-2 mx-auto mt-4"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M8 10a4 4 0 014-4h8a4 4 0 014 4v8a4 4 0 01-4 4h-8a4 4 0 01-4-4v-8z" />
        <path d="M16 4V4a4 4 0 00-4-4H4a4 4 0 00-4 4v8a4 4 0 004 4h0" />
      </svg>
      {copied ? 'Copied!' : 'Copy Direct Link'}
    </button>
  );
}
