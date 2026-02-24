import { getSession } from '@/lib/auth/session';
import { getWeekDate } from '@/lib/checkin';
import { sendPushNotification } from '@/lib/push';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, getEmailTemplate } from '@/lib/email';

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

    // 3. NOTIFICATIONS (Only if in a couple)
    if (user.couple_id) {
      try {
        // Find partner's info and subscriptions
        const partner = await db.prepare(`
          SELECT id, email, name FROM users WHERE couple_id = ? AND id != ? LIMIT 1
        `).bind(user.couple_id, user.id).first<{ id: string, email: string, name: string }>();

        if (partner) {
          // Check if partner has finished their report
          const partnerCheckins = await db.prepare(`
            SELECT COUNT(id) as count FROM checkins WHERE user_id = ? AND week_date = ?
          `).bind(partner.id, weekDate).first<{ count: number }>();

          const partnerFinished = (partnerCheckins?.count || 0) >= 5;
          const userName = user.name?.split(' ')[0] || 'Your partner';
          const partnerFirstName = partner.name?.split(' ')[0] || partner.email.split('@')[0];
          const siteUrl = env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;

          // A. PUSH NOTIFICATION
          const partnerSubs = await db.prepare(`
            SELECT subscription_json FROM push_subscriptions WHERE user_id = ?
          `).bind(partner.id).all<{ subscription_json: string }>();

          if (partnerFinished && partnerSubs.results && partnerSubs.results.length > 0) {
            const title = 'Weekly Results Ready! ✨';
            const body = `Both you and ${userName} have finished. Check your results now.`;
            
            const pushPromises = partnerSubs.results.map(sub => 
              sendPushNotification(sub.subscription_json, title, body, '/dashboard')
            );
            await Promise.all(pushPromises);
          }

          // B. EMAIL NOTIFICATION (Only if results are ready)
          if (partnerFinished) {
            const subject = 'Your weekly results are ready! ✨';
            const bodyText = `both you and ${userName} have finished your check-ins. Your alignment results and weekly focus are now ready to view.`;
            const buttonText = 'View Results';
            const buttonUrl = `${siteUrl}/dashboard/results`;

            await sendEmail(env, {
              to: partner.email,
              subject,
              text: `Hi ${partnerFirstName}, ${bodyText} ${buttonUrl}`,
              html: getEmailTemplate(
                partnerFirstName,
                bodyText,
                buttonText,
                buttonUrl,
                'You are receiving this because you are connected with your partner on SayYes.'
              )
            });
          }
        }
      } catch (notifyErr) {
        console.error('Notification failed but check-in saved:', notifyErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Checkin submission error:', err);
    return NextResponse.json({ error: 'Failed to save check-in' }, { status: 500 });
  }
}
