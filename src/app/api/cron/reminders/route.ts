import { getRequestContext } from '@cloudflare/next-on-pages';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

/**
 * MONDAY MORNING REMINDERS
 * This endpoint uses the Resend BATCH API to avoid rate limits (2 req/s).
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

    // 2. Find all users in a couple
    const users = await db.prepare(`
      SELECT email, name, couple_id FROM users 
      WHERE couple_id IS NOT NULL
    `).all<{ email: string, name: string, couple_id: string }>();

    if (!users.results || users.results.length === 0) {
      return NextResponse.json({ success: true, count: 0 });
    }

    // 3. Prepare Batch Emails
    const resendApiKey = env.RESEND_API_KEY;
    if (!resendApiKey) return NextResponse.json({ error: 'Resend API key missing' }, { status: 500 });

    const siteUrl = env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
    
    const batchEmails = users.results.map(user => {
      const firstName = user.name?.split(' ')[0] || user.email.split('@')[0];
      return {
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
      };
    });

    // 4. Send Batch Request (Counts as 1 request to Resend API)
    const res = await fetch('https://api.resend.com/emails/batch', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(batchEmails),
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error('Batch send error:', errorData);
      return NextResponse.json({ error: 'Failed to send batch', details: errorData }, { status: 500 });
    }

    const result = await res.json();
    return NextResponse.json({ 
      success: true, 
      sent: users.results.length,
      resend_response: result 
    });

  } catch (err) {
    console.error('Cron error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
