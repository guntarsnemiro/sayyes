import { createMagicLink } from '@/lib/auth/magic-link';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { email?: string };
    const email = body.email;
    
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const context = getRequestContext();
    const env = context?.env as CloudflareEnv | undefined;
    if (!env?.DB) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }
    const db = env.DB;
    const token = await createMagicLink(db, email);

    const siteUrl = env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
    const magicLink = `${siteUrl}/api/auth/magic/callback?token=${token}`;

    // Send email via Resend
    const resendApiKey = env.RESEND_API_KEY;
    if (resendApiKey) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'SayYes <info@sayyesapp.com>',
          to: email,
          subject: 'Your Sign-in Link for SayYes',
          html: `
            <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 40px 20px; color: #44403c;">
              <h1 style="font-size: 24px; font-weight: 300; margin-bottom: 24px;">SayYes</h1>
              <p style="font-size: 16px; line-height: 1.5; margin-bottom: 32px;">
                Click the button below to sign in to your weekly connection. This link will expire in 15 minutes.
              </p>
              <a href="${magicLink}" style="display: inline-block; background-color: #44403c; color: #ffffff; padding: 12px 32px; border-radius: 9999px; text-decoration: none; font-weight: 500;">
                Sign In
              </a>
              <p style="font-size: 12px; color: #a8a29e; margin-top: 40px;">
                If you didn't request this email, you can safely ignore it.
              </p>
            </div>
          `,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error('Resend error details:', JSON.stringify(errorData));
        return NextResponse.json({ 
          error: 'Failed to send email', 
          details: errorData.message || 'Unknown error from Resend'
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
