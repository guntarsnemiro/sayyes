import { getSession } from '@/lib/auth/session';
import { getWeekDate } from '@/lib/checkin';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const context = getRequestContext();
    const env = context.env as CloudflareEnv;
    const db = env.DB;
    
    const user = await getSession(db);
    if (!user || !user.couple_id) {
      return NextResponse.json({ error: 'Unauthorized or not in a couple' }, { status: 401 });
    }

    const { answers } = await request.json() as { 
      answers: Record<string, { score: number, note: string }> 
    };

    const weekDate = getWeekDate();

    // Insert each category checkin
    const statements = Object.entries(answers).map(([category, data]) => {
      return db.prepare(`
        INSERT INTO checkins (user_id, couple_id, week_date, category, score, note)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(user.id, user.couple_id, weekDate, category, data.score, data.note || null);
    });

    await db.batch(statements);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Checkin submission error:', err);
    return NextResponse.json({ error: 'Failed to save check-in' }, { status: 500 });
  }
}
