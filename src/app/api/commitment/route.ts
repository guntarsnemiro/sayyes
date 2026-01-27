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
    if (!user || !user.couple_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status } = await request.json() as { status: 'yes' | 'unsure' | 'no' };
    
    await db.prepare(`
      INSERT INTO commitments (user_id, couple_id, status)
      VALUES (?, ?, ?)
    `).bind(user.id, user.couple_id, status).run();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Commitment error:', err);
    return NextResponse.json({ error: 'Failed to save intention' }, { status: 500 });
  }
}
