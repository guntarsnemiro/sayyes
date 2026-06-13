import { createMagicLink, wasMagicLinkRecentlySent } from '@/lib/auth/magic-link';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sendEmail } from '@/lib/email';

export const runtime = 'edge';

const MAGIC_LINK_THROTTLE_SECONDS = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { email?: string, inviteId?: string };
    const email = body.email;
    const inviteId = body.inviteId;
    
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const context = getRequestContext();
    const env = context.env as CloudflareEnv;
    if (!env?.DB) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }
    const db = env.DB;

    // Rate limit: avoid spamming an inbox / abusing the endpoint
    if (await wasMagicLinkRecentlySent(db, email, MAGIC_LINK_THROTTLE_SECONDS)) {
      return NextResponse.json({
        error: 'Please wait a moment before requesting another link.',
      }, { status: 429 });
    }

    const token = await createMagicLink(db, email);

    const siteUrl = env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
    const magicLink = `${siteUrl}/api/auth/magic/callback?token=${token}`;

    if (inviteId) {
      const cookieStore = await cookies();
      cookieStore.set('pending_invite', inviteId, { 
        path: '/', 
        maxAge: 3600, // 1 hour
        httpOnly: true,
        secure: true,
        sameSite: 'lax'
      });
    }

    // Send email via the shared transport
    if (env.RESEND_API_KEY) {
      const ok = await sendEmail(env, {
        to: email,
        subject: 'Your Sign-in Link for SayYes',
        text: `Click here to sign in to SayYes: ${magicLink}`,
        html: `
          <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 40px 20px; color: #44403c;">
            <h1 style="font-size: 24px; font-weight: 300; margin-bottom: 24px;">SayYes</h1>
            <p style="font-size: 16px; line-height: 1.5; margin-bottom: 32px;">
              Click the button below to sign in to your weekly connection. This link will expire in 15 minutes.
            </p>
            <a href="${magicLink}" style="display: inline-block; background-color: #44403c; color: #ffffff; padding: 12px 32px; border-radius: 9999px; text-decoration: none; font-weight: 500;">
              Sign In
            </a>
            <p style="font-size: 12px; color: #a8a29e; margin-top: 40px; border-top: 1px solid #e5e5e5; padding-top: 20px;">
              SayYes — A weekly connection for couples.<br>
              If you didn't request this email, you can safely ignore it.
            </p>
          </div>
        `,
      });

      if (!ok) {
        return NextResponse.json({
          error: 'Failed to send email',
          details: 'We could not send your sign-in link. Please try again shortly.',
        }, { status: 500 });
      }
    } else {
      console.warn('RESEND_API_KEY is missing. Magic link printed to console only:');
      console.log(`To: ${email} | Link: ${magicLink}`);
    }

    return NextResponse.json({ success: true, message: 'Magic link sent' });
  } catch (err) {
    console.error('Magic link error:', err);
    return NextResponse.json({ error: 'Failed to send magic link' }, { status: 500 });
  }
}
