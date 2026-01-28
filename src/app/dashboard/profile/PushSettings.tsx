'use client';

import { useState, useEffect } from 'react';

const VAPID_PUBLIC_KEY = 'BEPzqak_9q7BaW8V-ZD5BzKpPrL1krPkQldatT4hFbSH_Y9JbvwFyyvjzMhJPIFje4vRWEPaPoE1zw0FrAEQC0E';

export default function PushSettings() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'default' | 'granted' | 'denied'>('default');

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      checkSubscription();
    } else {
      setLoading(false);
    }
  }, []);

  async function checkSubscription() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      setSubscription(sub);
      setStatus(Notification.permission);
    } catch (err) {
      console.error('Error checking subscription:', err);
    } finally {
      setLoading(false);
    }
  }

  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  async function subscribe() {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub })
      });

      if (res.ok) {
        setSubscription(sub);
        setStatus('granted');
      }
    } catch (err) {
      console.error('Failed to subscribe:', err);
    } finally {
      setLoading(false);
    }
  }

  async function unsubscribe() {
    if (!subscription) return;
    setLoading(true);
    try {
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription })
      });

      await subscription.unsubscribe();
      setSubscription(null);
      setStatus('default');
    } catch (err) {
      console.error('Failed to unsubscribe:', err);
    } finally {
      setLoading(false);
    }
  }

  if (!isSupported) return null;

  return (
    <div className="mt-8 pt-8 border-t border-stone-100">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-xs text-[var(--muted)] uppercase tracking-widest font-medium">
          App Notifications
        </h3>
        {status === 'granted' && subscription && (
          <span className="text-[9px] bg-green-50 text-green-600 px-2 py-0.5 rounded-full border border-green-100">
            Active
          </span>
        )}
      </div>

      {status === 'denied' ? (
        <p className="text-[10px] text-rose-500 bg-rose-50 p-4 rounded-2xl border border-rose-100 leading-relaxed">
          Notifications are blocked in your browser settings. To receive alerts, please reset the site permissions in your browser bar.
        </p>
      ) : subscription ? (
        <div className="space-y-4 text-center px-4">
          <p className="text-[10px] text-[var(--muted)] leading-relaxed italic">
            Notifications are enabled. You will receive alerts for new check-ins and results.
          </p>
          <button
            onClick={unsubscribe}
            disabled={loading}
            className="text-[10px] text-rose-400 hover:text-rose-600 transition-colors uppercase tracking-widest font-medium"
          >
            {loading ? 'Disabling...' : 'Disable Notifications'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-[10px] text-[var(--muted)] leading-relaxed">
            Get instant alerts when your partner finishes their check-in or when a new week starts.
          </p>
          <button
            onClick={subscribe}
            disabled={loading}
            className="w-full border border-[var(--accent)] text-[var(--primary)] px-6 py-3 rounded-full text-xs font-medium hover:bg-stone-50 transition-all disabled:opacity-50"
          >
            {loading ? 'Setting up...' : 'Enable App Alerts'}
          </button>
        </div>
      )}
    </div>
  );
}
