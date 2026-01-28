'use client';

import { useState, useEffect } from 'react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if dismissed in last 7 days
    const lastDismissed = localStorage.getItem('install_prompt_dismissed');
    if (lastDismissed) {
      const dismissedDate = new Date(parseInt(lastDismissed));
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < 7) {
        return;
      }
    }

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsStandalone(true);
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(ios);

    // Listen for Android install prompt
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // For iOS, we show the prompt after a small delay if not standalone
    if (ios && !isStandalone) {
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [isStandalone]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('install_prompt_dismissed', Date.now().toString());
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsVisible(false);
    }
  };

  if (isStandalone || !isVisible) return null;

  return (
    <div className="bg-[var(--primary)] text-white p-6 rounded-3xl shadow-lg animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-light mb-1">Install SayYes</h3>
          <p className="text-xs opacity-80 leading-relaxed">
            {isIOS 
              ? 'Add SayYes to your home screen for the full experience and app notifications.' 
              : 'Install our app for a faster experience and instant notifications.'}
          </p>
        </div>
        <button 
          onClick={handleDismiss}
          className="text-white opacity-50 hover:opacity-100 p-1"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M15 5L5 15M5 5l10 10" />
          </svg>
        </button>
      </div>

      {isIOS ? (
        <div className="flex items-center gap-3 bg-white/10 p-3 rounded-2xl">
          <div className="bg-white/20 p-2 rounded-lg">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
            </svg>
          </div>
          <p className="text-[10px] leading-tight">
            Tap the <span className="font-bold underline">Share</span> button in Safari, then select <span className="font-bold underline">Add to Home Screen</span>.
          </p>
        </div>
      ) : (
        <button
          onClick={handleInstallClick}
          className="w-full bg-white text-[var(--primary)] py-3 rounded-full text-sm font-medium hover:bg-stone-50 active:scale-[0.98] transition-all"
        >
          Install Now
        </button>
      )}
    </div>
  );
}
