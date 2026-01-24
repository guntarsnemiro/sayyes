import { getSession } from '@/lib/auth/session';
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

    const { email } = await request.json() as { email: string };
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const inviteeEmail = email.toLowerCase();
    
    // Check if user is inviting themselves
    if (inviteeEmail === user.email.toLowerCase()) {
      return NextResponse.json({ error: "You can't invite yourself" }, { status: 400 });
    }

    const inviteId = crypto.randomUUID();
    
    // Save invitation to DB
    await db.prepare(`
      INSERT INTO invitations (id, inviter_id, invitee_email)
      VALUES (?, ?, ?)
    `).bind(inviteId, user.id, inviteeEmail).run();

    // Send invitation email via Resend
    const siteUrl = env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
    const inviteLink = `${siteUrl}/invite/${inviteId}`;
    const resendApiKey = env.RESEND_API_KEY;

    if (resendApiKey) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'SayYes <info@sayyesapp.com>',
          to: inviteeEmail,
          subject: `${user.name || 'Your partner'} invited you to SayYes`,
          html: `
            <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 40px 20px; color: #44403c;">
              <h1 style="font-size: 24px; font-weight: 300; margin-bottom: 24px;">SayYes</h1>
              <p style="font-size: 16px; line-height: 1.5; margin-bottom: 32px;">
                ${user.name || user.email} has invited you to join them in a private, weekly connection space.
              </p>
              <a href="${inviteLink}" style="display: inline-block; background-color: #44403c; color: #ffffff; padding: 12px 32px; border-radius: 9999px; text-decoration: none; font-weight: 500;">
                Join your partner
              </a>
              <p style="font-size: 12px; color: #a8a29e; margin-top: 40px;">
                SayYes helps couples stay aligned through simple weekly check-ins.
              </p>
            </div>
          `,
        }),
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Invite error:', err);
    return NextResponse.json({ error: 'Failed to send invitation' }, { status: 500 });
  }
}
