import { deleteSession } from '@/lib/auth/session';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const context = getRequestContext();
    const env = context?.env as CloudflareEnv | undefined;
    const db = env?.DB;

    if (db) {
      await deleteSession(db);
    }

    return NextResponse.redirect(new URL('/auth/login', request.url));
  } catch (err) {
    console.error('Logout error:', err);
    return NextResponse.redirect(new URL('/', request.url));
  }
}
