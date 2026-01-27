import { verifyMagicLink } from '@/lib/auth/magic-link';
import { createSession } from '@/lib/auth/session';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/auth/login?error=invalid_token', request.url));
  }

  try {
    const context = getRequestContext();
    const env = context?.env as CloudflareEnv | undefined;
    const db = env?.DB;
    if (!db) {
      throw new Error('Database connection failed');
    }
    const email = await verifyMagicLink(db, token);

    if (!email) {
      return NextResponse.redirect(new URL('/auth/login?error=expired_token', request.url));
    }

    const normalizedEmail = email.toLowerCase();
    
    // Check if user already exists with this email (from Google or previous Magic Link)
    const existingUser = await db.prepare('SELECT id, couple_id FROM users WHERE email = ?')
      .bind(normalizedEmail)
      .first<{ id: string, couple_id?: string }>();
    
    let userId: string;
    
    if (existingUser) {
      userId = existingUser.id;
    } else {
      userId = crypto.randomUUID();
      await db.prepare('INSERT INTO users (id, email) VALUES (?, ?)').bind(userId, normalizedEmail).run();
    }

    await createSession(db, userId);

    const cookieStore = await cookies();
    const pendingInvite = cookieStore.get('pending_invite')?.value;
    
    if (pendingInvite) {
      cookieStore.delete('pending_invite');
      return NextResponse.redirect(new URL(`/invite/${pendingInvite}`, request.url));
    }

    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (err) {
    console.error('Magic callback error:', err);
    return NextResponse.redirect(new URL('/auth/login?error=auth_error', request.url));
  }
}
