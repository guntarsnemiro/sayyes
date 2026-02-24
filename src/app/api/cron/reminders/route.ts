import { getRequestContext } from '@cloudflare/next-on-pages';
import { NextRequest, NextResponse } from 'next/server';
import { sendPushNotification } from '@/lib/push';
import { getWeekDate } from '@/lib/checkin';
import { sendBatchEmails, getEmailTemplate } from '@/lib/email';

export const runtime = 'edge';

/**
 * WEEKLY REMINDERS
 * Strategy:
 * 1. Sunday (default): Send to all registered users to start the week.
 * 2. Mid-week (type=midweek): Send to users who haven't completed their report after 48h.
 */
export async function GET(request: NextRequest) {
  try {
    const context = getRequestContext();
    const env = context.env as CloudflareEnv;
    const db = env.DB;
    
    // 1. Verify Secret
    const authHeader = request.headers.get('Authorization');
    const cronSecret = env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'sunday';
    const weekDate = getWeekDate();
    const siteUrl = env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;

    let users;

    if (type === 'midweek') {
      // 2a. Find users who HAVEN'T completed their check-in and HAVEN'T received a midweek reminder
      // We check if they have at least 5 check-in records for this week
      users = await db.prepare(`
        SELECT u.id, u.email, u.name, u.couple_id, ps.subscription_json
        FROM users u
        LEFT JOIN push_subscriptions ps ON u.id = ps.user_id
        WHERE (u.last_midweek_reminder_at IS NULL OR u.last_midweek_reminder_at != ?)
        AND u.id NOT IN (
          SELECT user_id FROM checkins 
          WHERE week_date = ? 
          GROUP BY user_id 
          HAVING COUNT(category) >= 5
        )
      `).bind(weekDate, weekDate).all<{ 
        id: string, 
        email: string, 
        name: string, 
        couple_id: string | null,
        subscription_json: string | null 
      }>();
    } else {
      // 2b. Sunday Morning: Find all users who haven't received a reminder this week
      users = await db.prepare(`
        SELECT u.id, u.email, u.name, u.couple_id, ps.subscription_json
        FROM users u
        LEFT JOIN push_subscriptions ps ON u.id = ps.user_id
        WHERE u.last_reminder_at IS NULL OR u.last_reminder_at != ?
      `).bind(weekDate).all<{ 
        id: string, 
        email: string, 
        name: string, 
        couple_id: string | null,
        subscription_json: string | null 
      }>();
    }

    if (!users.results || users.results.length === 0) {
      return NextResponse.json({ success: true, message: 'No users to notify', count: 0 });
    }

    const pushTasks: { sub: string, title: string, body: string }[] = [];
    const emailTasks: any[] = [];
    const notifiedUserIds: string[] = [];
    const seenEmails = new Set<string>();

    users.results.forEach(user => {
      const isInCouple = !!user.couple_id;
      const firstName = user.name?.split(' ')[0] || user.email.split('@')[0];

      if (!seenEmails.has(user.email.toLowerCase())) {
        seenEmails.add(user.email.toLowerCase());
        notifiedUserIds.push(user.id);

        let subject, bodyText, emailBody, buttonText, buttonUrl;

        if (type === 'midweek') {
          subject = 'Just a gentle nudge...';
          bodyText = `we noticed you haven't checked in for this week yet. It only takes 2 minutes to keep your relationship intentional and prevent drift.`;
          buttonText = 'Complete My Check-in';
          buttonUrl = `${siteUrl}/dashboard`;
        } else {
          subject = isInCouple ? 'A new week has started' : 'Ready to start with your partner?';
          bodyText = isInCouple 
            ? 'a new week has started. Take 2 minutes to check in with your partner and keep your connection intentional.' 
            : 'ready to start your weekly connection? Invite your partner to SayYes today to begin your check-ins together.';
          buttonText = isInCouple ? 'Go to Dashboard' : 'Invite Your Partner';
          buttonUrl = `${siteUrl}/dashboard`;
        }

        // PUSH
        if (user.subscription_json) {
          pushTasks.push({
            sub: user.subscription_json,
            title: subject,
            body: bodyText
          });
        }

        // EMAIL
        emailTasks.push({
          from: 'SayYes <info@sayyesapp.com>',
          to: user.email,
          subject,
          text: `Hi ${firstName}, ${bodyText} ${buttonUrl}`,
          html: getEmailTemplate(
            firstName, 
            bodyText, 
            buttonText, 
            buttonUrl, 
            isInCouple ? 'You are receiving this because you are connected with your partner on SayYes.' : 'You are receiving this because you signed up for SayYes.'
          ),
        });
      }
    });

    // 4. Handle Push
    if (pushTasks.length > 0) {
      await Promise.all(pushTasks.map(task => sendPushNotification(task.sub, task.title, task.body)));
    }

    // 5. Handle Emails
    let emailSentCount = 0;
    if (emailTasks.length > 0) {
      const success = await sendBatchEmails(env, emailTasks);
      if (success) {
        emailSentCount = emailTasks.length;
        
        // 6. UPDATE SAFETY LOCK in DB
        const placeholders = notifiedUserIds.map(() => '?').join(',');
        const column = type === 'midweek' ? 'last_midweek_reminder_at' : 'last_reminder_at';
        
        await db.prepare(`
          UPDATE users SET ${column} = ? WHERE id IN (${placeholders})
        `).bind(weekDate, ...notifiedUserIds).run();
      }
    }

    return NextResponse.json({ 
      success: true, 
      type,
      emails_sent: emailSentCount
    });

  } catch (err) {
    console.error('Cron error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
