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

    const { confirmation } = await request.json() as { confirmation: string };
    
    // We'll accept either the user's name or the word "DELETE"
    const expectedConfirmation = "DELETE";
    const userName = user.name || "";

    const normalizedConfirmation = confirmation.trim().toUpperCase();
    const normalizedExpected = expectedConfirmation.toUpperCase();
    const normalizedUserName = userName.trim().toUpperCase();

    if (normalizedConfirmation !== normalizedExpected && normalizedConfirmation !== normalizedUserName) {
      return NextResponse.json({ error: 'Confirmation does not match' }, { status: 400 });
    }

    // Begin deletion process
    // 1. Delete check-ins
    await db.prepare('DELETE FROM checkins WHERE user_id = ?').bind(user.id).run();
    
    // 2. Delete commitments
    await db.prepare('DELETE FROM commitments WHERE user_id = ?').bind(user.id).run();
    
    // 3. Delete invitations sent by the user
    await db.prepare('DELETE FROM invitations WHERE inviter_id = ?').bind(user.id).run();
    
    // 4. Delete sessions
    await db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(user.id).run();
    
    // 5. Delete the user record
    await db.prepare('DELETE FROM users WHERE id = ?').bind(user.id).run();

    // Create response and clear the session cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set('sayyes_session', '', {
      path: '/',
      expires: new Date(0),
      httpOnly: true,
      secure: true,
      sameSite: 'lax'
    });

    return response;
  } catch (err) {
    console.error('Account deletion error:', err);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}
