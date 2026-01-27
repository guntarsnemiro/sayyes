import { getGoogleUser } from '@/lib/auth/google';
import { createSession } from '@/lib/auth/session';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(new URL('/auth/login?error=google_failed', request.url));
  }

  try {
    const context = getRequestContext();
    const env = context.env as CloudflareEnv;
    
    const clientId = env.GOOGLE_CLIENT_ID;
    const clientSecret = env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error('Missing Google credentials:', { hasClientId: !!clientId, hasClientSecret: !!clientSecret });
      throw new Error('Google credentials not configured');
    }

    const siteUrl = env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
    const redirectUri = `${siteUrl}/api/auth/google/callback`;

    console.log('Attempting Google token exchange with redirectUri:', redirectUri);

    const googleUser = await getGoogleUser(code, clientId, clientSecret, redirectUri);
    
    const db = env.DB;
    if (!db) {
      throw new Error('Database not configured');
    }

    // First, check if a user with this email already exists
    const existingUser = await db.prepare('SELECT id FROM users WHERE email = ?')
      .bind(googleUser.email)
      .first<{ id: string }>();

    let userId = googleUser.sub;

    // Link to couple if another account with this email is already connected
    const coupleLink = await db.prepare('SELECT couple_id FROM users WHERE email = ? AND couple_id IS NOT NULL LIMIT 1')
      .bind(googleUser.email.toLowerCase())
      .first<{ couple_id: string }>();

    if (existingUser) {
      userId = existingUser.id;
      // Update existing user with Google info and couple_id if found
      await db.prepare(`
        UPDATE users SET 
          name = ?, 
          picture = ?,
          couple_id = COALESCE(couple_id, ?)
        WHERE id = ?
      `).bind(googleUser.name, googleUser.picture, coupleLink?.couple_id || null, userId).run();
    } else {
      // Create new user
      await db.prepare(`
        INSERT INTO users (id, email, name, picture, couple_id) 
        VALUES (?, ?, ?, ?, ?)
      `).bind(userId, googleUser.email.toLowerCase(), googleUser.name, googleUser.picture, coupleLink?.couple_id || null).run();
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
    console.error('Google Auth Error:', err);
    return NextResponse.redirect(new URL('/auth/login?error=auth_error', request.url));
  }
}
