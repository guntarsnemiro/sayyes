import { getRequestContext } from '@cloudflare/next-on-pages';
import { NextRequest, NextResponse } from 'next/server';
import { sendPushNotification } from '@/lib/push';

export const runtime = 'edge';

/**
 * MONDAY MORNING REMINDERS
 * Strategy: Push-First, Email-Fallback.
 * If a user has a push subscription, we send a push notification.
 * If not, we send an email via Resend BATCH API.
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

    // 2. Find all registered users and their push subscriptions
    const usersData = await db.prepare(`
      SELECT u.id, u.email, u.name, u.couple_id, ps.subscription_json
      FROM users u
      LEFT JOIN push_subscriptions ps ON u.id = ps.user_id
    `).all<{ id: string, email: string, name: string, couple_id: string | null, subscription_json: string | null }>();

    if (!usersData.results || usersData.results.length === 0) {
      return NextResponse.json({ success: true, count: 0 });
    }

    // 3. Prepare notifications
    const pushTasks: { sub: string, title: string, body: string }[] = [];
    const emailTasks: any[] = [];
    const seenEmails = new Set<string>();

    usersData.results.forEach(user => {
      const isInCouple = !!user.couple_id;
      const firstName = user.name?.split(' ')[0] || user.email.split('@')[0];

      // PUSH NOTIFICATION
      if (user.subscription_json) {
        pushTasks.push({
          sub: user.subscription_json,
          title: isInCouple ? 'A new week has started 💫' : 'Ready to start? ✨',
          body: isInCouple 
            ? 'Time for your weekly check-in. Take 2 minutes to connect.'
            : 'Invite your partner to SayYes to start your weekly check-ins.'
        });
      }

      // EMAIL NOTIFICATION
      if (!seenEmails.has(user.email.toLowerCase())) {
        seenEmails.add(user.email.toLowerCase());
        
        const siteUrl = env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
        const subject = isInCouple ? 'A new week has started' : 'Ready to start with your partner?';
        const bodyText = isInCouple
          ? `Hi ${firstName}, it's Sunday! A new week has started. Take 2 minutes to check in with your partner on SayYes: ${siteUrl}/dashboard`
          : `Hi ${firstName}, it's Sunday! Ready to start your weekly connection? Invite your partner to SayYes to begin your check-ins together: ${siteUrl}/dashboard`;

        const htmlContent = `
          <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 40px 20px; color: #44403c;">
            <h1 style="font-size: 24px; font-weight: 300; margin-bottom: 24px;">SayYes</h1>
            <p style="font-size: 16px; line-height: 1.5; margin-bottom: 32px;">
              Hi ${firstName}, ${isInCouple 
                ? 'a new week has started. Take 2 minutes to check in with your partner and keep your connection intentional.' 
                : 'ready to start your weekly connection? Invite your partner to SayYes today to begin your check-ins together.'}
            </p>
            <div style="text-align: center; margin-bottom: 32px;">
              <a href="${siteUrl}/dashboard" style="display: inline-block; background-color: #44403c; color: #ffffff; padding: 12px 32px; border-radius: 9999px; text-decoration: none; font-weight: 500;">
                ${isInCouple ? 'Go to Dashboard' : 'Invite Your Partner'}
              </a>
            </div>
            <p style="font-size: 12px; color: #a8a29e; margin-top: 40px; border-top: 1px solid #e5e5e5; padding-top: 20px;">
              SayYes — A weekly connection for couples.<br>
              ${isInCouple 
                ? 'You are receiving this because you are connected with your partner on SayYes.' 
                : 'You are receiving this because you signed up for SayYes.'}
            </p>
          </div>
        `;

        emailTasks.push({
          from: 'SayYes <info@sayyesapp.com>',
          to: user.email,
          subject,
          text: bodyText,
          html: htmlContent,
        });
      }
    });

    // 4. Handle Push Notifications
    let pushSentCount = 0;
    if (pushTasks.length > 0) {
      const results = await Promise.all(
        pushTasks.map(task => sendPushNotification(task.sub, task.title, task.body))
      );
      pushSentCount = results.filter(Boolean).length;
    }

    // 5. Handle Batch Emails
    let emailSentCount = 0;
    if (emailTasks.length > 0) {
      const resendApiKey = env.RESEND_API_KEY;
      if (resendApiKey) {
        const res = await fetch('https://api.resend.com/emails/batch', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(emailTasks),
        });

        if (res.ok) emailSentCount = emailTasks.length;
      }
    }

    return NextResponse.json({ 
      success: true, 
      push_sent: pushSentCount,
      emails_sent: emailSentCount
    });

  } catch (err) {
    console.error('Cron error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
