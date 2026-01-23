import { getGoogleAuthUrl } from '@/lib/auth/google';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const context = getRequestContext();
  const clientId = context?.env?.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  const redirectUri = `${siteUrl}/api/auth/google/callback`;

  if (!clientId) {
    console.error('GOOGLE_CLIENT_ID is missing from environment');
    return NextResponse.json({ error: 'Google Client ID not configured' }, { status: 500 });
  }

  const url = getGoogleAuthUrl(clientId, redirectUri);
  return NextResponse.redirect(url);
}
