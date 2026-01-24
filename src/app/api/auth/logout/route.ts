import { deleteSession } from '@/lib/auth/session';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const context = getRequestContext();
    const env = context.env as CloudflareEnv;
    const db = env.DB;

    if (db) {
      await deleteSession(db);
    }

    // Use 303 See Other to ensure the browser switches from POST to GET
    return NextResponse.redirect(new URL('/auth/login', request.url), 303);
  } catch (err) {
    console.error('Logout error:', err);
    return NextResponse.redirect(new URL('/', request.url), 303);
  }
}
