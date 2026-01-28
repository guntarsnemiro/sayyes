import { getSession } from '@/lib/auth/session';
import { getWeekDate } from '@/lib/checkin';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  try {
    const context = getRequestContext();
    const env = context.env as CloudflareEnv;
    const db = env.DB;
    
    const user = await getSession(db);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const weekDate = getWeekDate();

    const checkins = await db.prepare(`
      SELECT category, score, note 
      FROM checkins 
      WHERE user_id = ? AND week_date = ?
    `).bind(user.id, weekDate).all<{ category: string, score: number, note: string }>();

    const answers: Record<string, { score: number, note: string }> = {};
    checkins.results.forEach(c => {
      answers[c.category] = { score: c.score, note: c.note || '' };
    });

    return NextResponse.json({ answers });
  } catch (err) {
    console.error('Checkin fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch check-in' }, { status: 500 });
  }
}
