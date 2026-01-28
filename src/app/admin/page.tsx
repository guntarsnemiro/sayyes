'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Stats {
  users: number;
  couples: number;
  checkins: number;
  feedback: number;
}

interface User {
  email: string;
  name: string | null;
  couple_id: string | null;
  created_at: string;
}

interface Invite {
  invitee_email: string;
  status: string;
  created_at: string;
}

interface Feedback {
  type: string;
  message: string;
  created_at: string;
  email: string;
  name: string | null;
}

export default function AdminDashboard() {
  const [data, setData] = useState<{ 
    stats: Stats, 
    latestUsers: User[], 
    latestInvites: Invite[],
    latestFeedback: Feedback[]
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(res => {
        if (!res.ok) throw new Error('Unauthorized or failed to fetch');
        return res.json();
      })
      .then((json: any) => setData(json))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <p className="text-xs uppercase tracking-widest text-stone-400 animate-pulse">Loading Admin Panel...</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 p-6 text-center">
      <div>
        <h1 className="text-xl font-light text-rose-500 mb-2">Access Denied</h1>
        <p className="text-sm text-stone-500 mb-6">You don&apos;t have permission to view this page.</p>
        <Link href="/dashboard" className="text-xs uppercase tracking-widest underline underline-offset-4 text-stone-400 hover:text-stone-600">
          Return to Dashboard
        </Link>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-stone-50 p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-12">
        <header className="flex justify-between items-end">
          <div>
            <p className="text-[10px] text-stone-400 uppercase tracking-[0.2em] mb-2 font-medium">Admin Panel</p>
            <h1 className="text-3xl font-light text-[#44403c]">Growth Metrics</h1>
          </div>
          <Link href="/dashboard" className="text-xs text-stone-400 uppercase tracking-widest hover:text-stone-600 transition-colors mb-1">
            ← Back
          </Link>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-stone-200 rounded-3xl p-8 shadow-sm">
            <p className="text-[10px] text-stone-400 uppercase tracking-widest mb-1">Total Users</p>
            <p className="text-4xl font-light text-[#44403c]">{data?.stats.users}</p>
          </div>
          <div className="bg-white border border-stone-200 rounded-3xl p-8 shadow-sm">
            <p className="text-[10px] text-stone-400 uppercase tracking-widest mb-1">Active Couples</p>
            <p className="text-4xl font-light text-[#44403c]">{data?.stats.couples}</p>
          </div>
          <div className="bg-white border border-stone-200 rounded-3xl p-8 shadow-sm">
            <p className="text-[10px] text-stone-400 uppercase tracking-widest mb-1">Check-ins Done</p>
            <p className="text-4xl font-light text-[#44403c]">{data?.stats.checkins}</p>
          </div>
          <div className="bg-white border border-stone-200 rounded-3xl p-8 shadow-sm">
            <p className="text-[10px] text-stone-400 uppercase tracking-widest mb-1">Beta Feedback</p>
            <p className="text-4xl font-light text-[#44403c]">{data?.stats.feedback}</p>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-sm uppercase tracking-widest text-stone-400 font-medium px-2">Recent Beta Feedback</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data?.latestFeedback.map((f, i) => (
              <div key={i} className="bg-white border border-stone-200 rounded-[2rem] p-6 shadow-sm flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <span className={`text-[9px] px-2 py-0.5 rounded-full border uppercase tracking-widest font-medium ${
                      f.type === 'bug' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                      f.type === 'idea' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                      'bg-green-50 text-green-600 border-green-100'
                    }`}>
                      {f.type}
                    </span>
                    <span className="text-[10px] text-stone-400">
                      {new Date(f.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-xs text-[#44403c] leading-relaxed italic">&quot;{f.message}&quot;</p>
                </div>
                <div className="mt-6 pt-4 border-t border-stone-50">
                  <p className="text-[10px] font-medium text-stone-500">{f.name || 'Anonymous'}</p>
                  <p className="text-[9px] text-stone-400 lowercase">{f.email}</p>
                </div>
              </div>
            ))}
            {data?.latestFeedback.length === 0 && (
              <div className="col-span-full bg-stone-100/50 border border-dashed border-stone-200 rounded-[2rem] p-12 text-center">
                <p className="text-xs text-stone-400 uppercase tracking-widest">No feedback received yet</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Latest Registrations */}
          <section className="space-y-6">
            <h2 className="text-sm uppercase tracking-widest text-stone-400 font-medium px-2">Latest Registrations</h2>
            <div className="bg-white border border-stone-200 rounded-[2rem] overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-stone-50 border-b border-stone-100 text-[10px] uppercase tracking-widest text-stone-400">
                  <tr>
                    <th className="px-6 py-4 font-medium">User</th>
                    <th className="px-6 py-4 font-medium">Joined</th>
                    <th className="px-6 py-4 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {data?.latestUsers.map((user, i) => (
                    <tr key={i} className="hover:bg-stone-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-[#44403c]">{user.name || 'Anonymous'}</p>
                        <p className="text-[10px] text-stone-400 lowercase">{user.email}</p>
                      </td>
                      <td className="px-6 py-4 text-stone-400 text-xs whitespace-nowrap">
                        {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full border ${
                          user.couple_id ? 'bg-green-50 text-green-600 border-green-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>
                          {user.couple_id ? 'Connected' : 'Solo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Latest Invitations */}
          <section className="space-y-6">
            <h2 className="text-sm uppercase tracking-widest text-stone-400 font-medium px-2">Recent Invites</h2>
            <div className="bg-white border border-stone-200 rounded-[2rem] overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-stone-50 border-b border-stone-100 text-[10px] uppercase tracking-widest text-stone-400">
                  <tr>
                    <th className="px-6 py-4 font-medium">Invitee</th>
                    <th className="px-6 py-4 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {data?.latestInvites.map((invite, i) => (
                    <tr key={i} className="hover:bg-stone-50/50 transition-colors">
                      <td className="px-6 py-4 lowercase text-stone-500 font-medium">
                        {invite.invitee_email}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full border uppercase tracking-widest ${
                          invite.status === 'accepted' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-stone-50 text-stone-400 border-stone-100'
                        }`}>
                          {invite.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
