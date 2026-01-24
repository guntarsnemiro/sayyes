import { getSession } from '@/lib/auth/session';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const inviteId = formData.get('inviteId') as string;

    const context = getRequestContext();
    const env = context.env as CloudflareEnv;
    const db = env.DB;
    
    const user = await getSession(db);
    if (!user) {
      return NextResponse.redirect(new URL(`/auth/login?invite=${inviteId}`, request.url), 303);
    }

    // 1. Fetch the invitation
    const invite = await db.prepare(`
      SELECT * FROM invitations WHERE id = ? AND status = 'pending'
    `).bind(inviteId).first<{ id: string, inviter_id: string, invitee_email: string }>();

    if (!invite) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    // 2. Create a couple record
    const coupleId = crypto.randomUUID();
    await db.prepare('INSERT INTO couples (id) VALUES (?)').bind(coupleId).run();

    // 3. Connect both users to the couple
    await db.prepare('UPDATE users SET couple_id = ? WHERE id = ?').bind(coupleId, invite.inviter_id).run();
    await db.prepare('UPDATE users SET couple_id = ? WHERE id = ?').bind(coupleId, user.id).run();

    // 4. Mark invitation as accepted
    await db.prepare("UPDATE invitations SET status = 'accepted' WHERE id = ?").bind(inviteId).run();

    return NextResponse.redirect(new URL('/dashboard', request.url), 303);
  } catch (err) {
    console.error('Accept invite error:', err);
    return NextResponse.redirect(new URL('/?error=accept_failed', request.url), 303);
  }
}
