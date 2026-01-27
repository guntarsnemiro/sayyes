import { getRequestContext } from '@cloudflare/next-on-pages';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

/**
 * MONDAY MORNING REMINDERS
 * This endpoint is intended to be called by a cron job every Monday morning.
 * It sends a reminder email to all users who are in a couple.
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
      console.warn('Unauthorized cron attempt or CRON_SECRET not set');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Find all users in a couple
    const users = await db.prepare(`
      SELECT email, name, couple_id FROM users 
      WHERE couple_id IS NOT NULL
    `).all<{ email: string, name: string, couple_id: string }>();

    if (!users.results || users.results.length === 0) {
      return NextResponse.json({ success: true, count: 0, message: 'No users in couples found' });
    }

    // 3. Send Reminders
    const resendApiKey = env.RESEND_API_KEY;
    if (!resendApiKey) {
      return NextResponse.json({ error: 'Resend API key missing' }, { status: 500 });
    }

    const siteUrl = env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
    
    let successCount = 0;
    let errorCount = 0;

    // We process sequentially to avoid hitting Resend rate limits if the user base grows,
    // though for small numbers Promise.all would be faster.
    for (const user of users.results) {
      const firstName = user.name?.split(' ')[0] || user.email.split('@')[0];
      
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'SayYes <info@sayyesapp.com>',
            to: user.email,
            subject: 'A new week has started',
            text: `Hi ${firstName}, it's Monday! A new week has started. Take 2 minutes to check in with your partner on SayYes: ${siteUrl}/dashboard`,
            html: `
              <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 40px 20px; color: #44403c;">
                <h1 style="font-size: 24px; font-weight: 300; margin-bottom: 24px;">SayYes</h1>
                <p style="font-size: 16px; line-height: 1.5; margin-bottom: 32px;">
                  Hi ${firstName}, a new week has started. Take 2 minutes to check in with your partner and keep your connection intentional.
                </p>
                <div style="text-align: center; margin-bottom: 32px;">
                  <a href="${siteUrl}/dashboard" style="display: inline-block; background-color: #44403c; color: #ffffff; padding: 12px 32px; border-radius: 9999px; text-decoration: none; font-weight: 500;">
                    Go to Dashboard
                  </a>
                </div>
                <p style="font-size: 12px; color: #a8a29e; margin-top: 40px; border-top: 1px solid #e5e5e5; padding-top: 20px;">
                  SayYes — A weekly connection for couples.<br>
                  You are receiving this because you are connected with your partner on SayYes.
                </p>
              </div>
            `,
          }),
        });

        if (res.ok) {
          successCount++;
        } else {
          const error = await res.json();
          console.error(`Resend error for ${user.email}:`, error);
          errorCount++;
        }
      } catch (e) {
        console.error(`Fetch error for ${user.email}:`, e);
        errorCount++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      sent: successCount, 
      failed: errorCount,
      total: users.results.length 
    });

  } catch (err) {
    console.error('Cron error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
