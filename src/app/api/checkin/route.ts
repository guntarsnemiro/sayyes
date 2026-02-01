import { getSession } from '@/lib/auth/session';
import { getWeekDate } from '@/lib/checkin';
import { sendPushNotification } from '@/lib/push';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const context = getRequestContext();
    const env = context.env as CloudflareEnv;
    const db = env.DB;
    
    const user = await getSession(db);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { answers } = await request.json() as { 
      answers: Record<string, { score: number, note: string }> 
    };

    const weekDate = getWeekDate();

    // 1. Clear any existing checkins for this user/week to allow editing
    await db.prepare('DELETE FROM checkins WHERE user_id = ? AND week_date = ?')
      .bind(user.id, weekDate)
      .run();

    // 2. Insert each category checkin
    const statements = Object.entries(answers).map(([category, data]) => {
      return db.prepare(`
        INSERT INTO checkins (user_id, couple_id, week_date, category, score, note)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(user.id, user.couple_id || null, weekDate, category, data.score, data.note || null);
    });

    await db.batch(statements);

    // 3. TRIGGER PUSH NOTIFICATION TO PARTNER (Only if in a couple)
    if (user.couple_id) {
      try {
      // Find partner's subscriptions
      const partnerSubs = await db.prepare(`
        SELECT subscription_json FROM push_subscriptions 
        WHERE user_id = (SELECT id FROM users WHERE couple_id = ? AND id != ? LIMIT 1)
      `).bind(user.couple_id, user.id).all<{ subscription_json: string }>();

      if (partnerSubs.results && partnerSubs.results.length > 0) {
        const userName = user.name?.split(' ')[0] || 'Your partner';
        const title = 'Check-in Finished! ✨';
        const body = `${userName} has completed their check-in.`;
        
        // Send to all partner devices
        const pushPromises = partnerSubs.results.map(sub => 
          sendPushNotification(sub.subscription_json, title, body, '/dashboard')
        );
        await Promise.all(pushPromises);
      }
    } catch (pushErr) {
      console.error('Push notification failed but check-in saved:', pushErr);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Checkin submission error:', err);
    return NextResponse.json({ error: 'Failed to save check-in' }, { status: 500 });
  }
}
