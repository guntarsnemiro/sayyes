import { verifyMagicLink } from '@/lib/auth/magic-link';
import { createSession } from '@/lib/auth/session';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/auth/login?error=invalid_token', request.url));
  }

  try {
    // @ts-ignore
    const context = getRequestContext();
    const db = context.env.DB;
    const email = await verifyMagicLink(db, token);

    if (!email) {
      return NextResponse.redirect(new URL('/auth/login?error=expired_token', request.url));
    }

    let user = await db.prepare('SELECT id FROM users WHERE email = ?').bind(email).first<any>();
    
    let userId = user?.id;
    if (!userId) {
      userId = crypto.randomUUID();
      await db.prepare('INSERT INTO users (id, email) VALUES (?, ?)').bind(userId, email).run();
    }

    await createSession(db, userId);

    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (err) {
    console.error('Magic callback error:', err);
    return NextResponse.redirect(new URL('/auth/login?error=auth_error', request.url));
  }
}
