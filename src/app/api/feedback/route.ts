import { getSession } from '@/lib/auth/session';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const context = getRequestContext();
    const env = context.env as CloudflareEnv;
    const db = env.DB;
    
    const user = await getSession(db);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, message } = await request.json() as { type: string, message: string };
    
    if (!type || !message || message.trim().length < 5) {
      return NextResponse.json({ error: 'Please provide a message (min 5 characters)' }, { status: 400 });
    }

    await db.prepare('INSERT INTO feedback (user_id, type, message) VALUES (?, ?, ?)')
      .bind(user.id, type, message.trim())
      .run();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Feedback submission error:', err);
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
  }
}
