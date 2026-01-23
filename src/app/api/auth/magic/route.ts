import { createMagicLink } from '@/lib/auth/magic-link';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    // @ts-ignore
    const context = getRequestContext();
    if (!context || !context.env || !context.env.DB) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }
    const db = context.env.DB;
    const token = await createMagicLink(db, email);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
    const magicLink = `${siteUrl}/api/auth/magic/callback?token=${token}`;

    console.log('--- MAGIC LINK ---');
    console.log(`To: ${email}`);
    console.log(`Link: ${magicLink}`);
    console.log('------------------');

    return NextResponse.json({ success: true, message: 'Magic link sent' });
  } catch (err) {
    console.error('Magic link error:', err);
    return NextResponse.json({ error: 'Failed to send magic link' }, { status: 500 });
  }
}
