import { getGoogleAuthUrl } from '@/lib/auth/google';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const context = getRequestContext();
  const env = context.env as CloudflareEnv;
  
  // In Cloudflare Workers, env vars are on the env object
  const clientId = env.GOOGLE_CLIENT_ID;
  
  // Ensure we use a consistent site URL. 
  // For Google OAuth, the redirect URI must be exactly what's configured in Google Console.
  const siteUrl = env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  const redirectUri = `${siteUrl}/api/auth/google/callback`;

  if (!clientId) {
    console.error('GOOGLE_CLIENT_ID is missing from Cloudflare environment');
    return NextResponse.json({ 
      error: 'Google Client ID not configured',
      details: 'Ensure GOOGLE_CLIENT_ID is set in your Cloudflare dashboard or .dev.vars'
    }, { status: 500 });
  }

  const url = getGoogleAuthUrl(clientId, redirectUri);
  return NextResponse.redirect(url);
}
