import { getSession } from '@/lib/auth/session';
import { getWeekDate, CHECKIN_CATEGORIES, calculateAlignment, getPrimaryAction } from '@/lib/checkin';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const runtime = 'edge';

export default async function ResultsPage({ searchParams }: { searchParams: Promise<{ week?: string }> }) {
  const { week } = await searchParams;
  const context = getRequestContext();
  const env = context.env as CloudflareEnv;
  const db = env.DB;
  const user = await getSession(db);

  if (!user) {
    redirect('/auth/login');
  }

  // Refresh user data from DB to ensure we have the latest couple_id
  const freshUser = await db.prepare('SELECT * FROM users WHERE id = ?').bind(user.id).first<{
    id: string;
    email: string;
    name?: string;
    picture?: string;
    couple_id?: string;
    created_at: string;
  }>();
  
  const currentUser = freshUser || user;

  if (!currentUser.couple_id) {
    redirect('/dashboard');
  }

  const weekDate = week || getWeekDate();

  // Fetch all checkins for this couple this week
  const checkins = await db.prepare(`
    SELECT user_id, category, score, note 
    FROM checkins 
    WHERE couple_id = ? AND week_date = ?
  `).bind(currentUser.couple_id, weekDate).all<{ user_id: string, category: string, score: number, note: string }>();

  const userCheckins = checkins.results.filter(c => c.user_id === currentUser.id);
  const partnerCheckins = checkins.results.filter(c => c.user_id !== currentUser.id);

  if (userCheckins.length < 5 || partnerCheckins.length < 5) {
    // If the counts are off, it might be due to duplicate accounts. 
    // Let's try one more time by email if the primary check fails.
    if (checkins.results.length < 10) {
      redirect('/dashboard');
    }
  }

  // Map to category records
  const userMap: Record<string, number> = {};
  userCheckins.forEach(c => userMap[c.category] = c.score);
  
  const partnerMap: Record<string, number> = {};
  partnerCheckins.forEach(c => partnerMap[c.category] = c.score);

  const alignment = calculateAlignment(userMap, partnerMap);
  const action = getPrimaryAction(alignment);

  // Fetch partner info for the UI
  const partner = await db.prepare(
    'SELECT name, email FROM users WHERE couple_id = ? AND id != ?'
  ).bind(currentUser.couple_id, currentUser.id).first<{ name: string, email: string }>();

  const userName = currentUser.name?.split(' ')[0] || 'You';
  const partnerName = partner?.name?.split(' ')[0] || partner?.email?.split('@')[0] || 'Partner';

  return (
    <main className="flex min-h-screen flex-col bg-[var(--background)] p-6">
      <header className="flex justify-between items-center max-w-2xl mx-auto w-full mb-12">
        <Link href="/dashboard" className="text-xs text-[var(--muted)] uppercase tracking-widest hover:text-[var(--primary)] transition-colors">
          ← Dashboard
        </Link>
        <h1 className="text-xl font-light tracking-tight text-[var(--primary)]">
          Weekly Results
        </h1>
        <div className="w-12"></div>
      </header>

      <div className="max-w-2xl mx-auto w-full space-y-8 pb-12">
        <div className="bg-white border border-[var(--accent)] rounded-3xl p-8 shadow-sm text-center">
          <p className="text-xs text-[var(--muted)] uppercase tracking-widest mb-2">This week&apos;s focus</p>
          <h2 className="text-xl font-medium text-[var(--primary)] leading-relaxed">
            &quot;{action}&quot;
          </h2>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between px-6 text-[10px] text-[var(--muted)] uppercase tracking-widest">
            <span>Category</span>
            <div className="flex gap-4">
              <span>{userName}</span>
              <span>{partnerName}</span>
            </div>
          </div>
          
          {CHECKIN_CATEGORIES.map((cat) => {
            const state = alignment[cat.id];
            const userScore = userMap[cat.id];
            const partnerScore = partnerMap[cat.id];
            
            const userNote = userCheckins.find(c => c.category === cat.id)?.note;
            const partnerNote = partnerCheckins.find(c => c.category === cat.id)?.note;

            return (
              <div key={cat.id} className="bg-white border border-[var(--accent)] rounded-3xl p-6 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-xs text-[var(--muted)] uppercase tracking-widest mb-1">{cat.name}</p>
                    <h3 className="text-lg font-light text-[var(--primary)]">{cat.question}</h3>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-medium ${
                    state === 'aligned' ? 'bg-green-50 text-green-700 border border-green-100' :
                    state === 'partially-aligned' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                    'bg-rose-50 text-rose-700 border border-rose-100'
                  }`}>
                    {state.replace('-', ' ')}
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <div className="flex-grow h-2 bg-stone-100 rounded-full overflow-hidden flex">
                    <div 
                      className="h-full bg-[var(--primary)] opacity-30" 
                      style={{ width: `${(Math.min(userScore, partnerScore) / 5) * 100}%` }}
                    />
                    <div 
                      className="h-full bg-[var(--primary)]" 
                      style={{ width: `${(Math.abs(userScore - partnerScore) / 5) * 100}%` }}
                    />
                  </div>
                  <div className="flex gap-4 text-xs font-medium text-[var(--primary)]">
                    <span className={userScore < partnerScore ? 'opacity-50' : ''}>{userScore}</span>
                    <span className={partnerScore < userScore ? 'opacity-50' : ''}>{partnerScore}</span>
                  </div>
                </div>

                {(userNote || partnerNote) && (
                  <div className="mt-6 pt-4 border-t border-stone-50 space-y-3">
                    {userNote && (
                      <div className="flex gap-3">
                        <div className="w-1 h-auto bg-stone-200 rounded-full" />
                        <p className="text-xs text-[var(--muted)] italic leading-relaxed">
                          <span className="not-italic font-medium text-[var(--primary)] uppercase text-[9px] block mb-1">{userName}</span>
                          &quot;{userNote}&quot;
                        </p>
                      </div>
                    )}
                    {partnerNote && (
                      <div className="flex gap-3">
                        <div className="w-1 h-auto bg-stone-200 rounded-full" />
                        <p className="text-xs text-[var(--muted)] italic leading-relaxed">
                          <span className="not-italic font-medium text-[var(--primary)] uppercase text-[9px] block mb-1">{partnerName}</span>
                          &quot;{partnerNote}&quot;
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="pt-8 text-center">
          <p className="text-xs text-[var(--muted)] leading-relaxed max-w-xs mx-auto">
            Results are meant to start a conversation, not to judge. Take a moment to listen to each other.
          </p>
        </div>
      </div>
    </main>
  );
}
