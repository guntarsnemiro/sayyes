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
    if (user.couple_id) {
      // 1. Uncouple the partner if they exist
      await db.prepare('UPDATE users SET couple_id = NULL WHERE couple_id = ? AND id != ?')
        .bind(user.couple_id, user.id)
        .run();
    }

    // 2. Delete check-ins
    await db.prepare('DELETE FROM checkins WHERE user_id = ?').bind(user.id).run();
    
    // 3. Delete commitments
    await db.prepare('DELETE FROM commitments WHERE user_id = ?').bind(user.id).run();
    
    // 4. Delete invitations sent by or to the user
    await db.prepare('DELETE FROM invitations WHERE inviter_id = ? OR invitee_email = ?')
      .bind(user.id, user.email)
      .run();
    
    // 5. Delete push subscriptions
    await db.prepare('DELETE FROM push_subscriptions WHERE user_id = ?').bind(user.id).run();

    // 6. Delete feedback
    await db.prepare('DELETE FROM feedback WHERE user_id = ?').bind(user.id).run();

    // 7. Delete magic links
    await db.prepare('DELETE FROM magic_links WHERE email = ?').bind(user.email).run();

    // 8. Delete sessions
    await db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(user.id).run();
    
    // 9. Delete the user record
    await db.prepare('DELETE FROM users WHERE id = ?').bind(user.id).run();

    // 10. Clean up orphaned couple record if no one is left
    if (user.couple_id) {
      const remaining = await db.prepare('SELECT COUNT(*) as count FROM users WHERE couple_id = ?')
        .bind(user.couple_id)
        .first<{ count: number }>();
      
      if (!remaining || remaining.count === 0) {
        // No one left in the couple, delete the couple record and its associated data
        // Note: partner's checkins would have been deleted if they also deleted their account
        await db.prepare('DELETE FROM couples WHERE id = ?').bind(user.couple_id).run();
      }
    }

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
