import { getGoogleUser } from '@/lib/auth/google';
import { createSession } from '@/lib/auth/session';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { NextRequest, NextResponse } from 'next/server';

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

    await db.prepare(`
      INSERT INTO users (id, email, name, picture) 
      VALUES (?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET 
        name = excluded.name,
        picture = excluded.picture
    `).bind(googleUser.sub, googleUser.email, googleUser.name, googleUser.picture).run();

    await createSession(db, googleUser.sub);

    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (err) {
    console.error('Google Auth Error:', err);
    return NextResponse.redirect(new URL('/auth/login?error=auth_error', request.url));
  }
}
