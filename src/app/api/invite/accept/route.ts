import { getSession } from '@/lib/auth/session';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  let inviteId = '';
  try {
    const formData = await request.formData();
    inviteId = (formData.get('inviteId') as string) || '';

    const context = getRequestContext();
    const env = context.env as CloudflareEnv;
    const db = env.DB;

    const user = await getSession(db);
    if (!user) {
      return NextResponse.redirect(new URL(`/auth/login?invite=${inviteId}`, request.url), 303);
    }

    // 1. Fetch the invitation (must still be pending)
    const invite = await db.prepare(`
      SELECT * FROM invitations WHERE id = ? AND status = 'pending'
    `).bind(inviteId).first<{ id: string, inviter_id: string, invitee_email: string }>();

    if (!invite) {
      return NextResponse.redirect(new URL(`/invite/${inviteId}?error=not_found`, request.url), 303);
    }

    // 2. Strict binding: the signed-in account must match the invited email
    if (user.email.toLowerCase() !== invite.invitee_email.toLowerCase()) {
      return NextResponse.redirect(new URL(`/invite/${inviteId}?error=wrong_account`, request.url), 303);
    }

    // 3. Block accepting your own invitation
    if (user.id === invite.inviter_id) {
      return NextResponse.redirect(new URL(`/invite/${inviteId}?error=self_invite`, request.url), 303);
    }

    // 4. Block if the accepter is already in a couple
    if (user.couple_id) {
      return NextResponse.redirect(new URL(`/invite/${inviteId}?error=already_coupled`, request.url), 303);
    }

    // 5. Inviter must still exist and be unattached
    const inviter = await db.prepare('SELECT id, couple_id FROM users WHERE id = ?')
      .bind(invite.inviter_id).first<{ id: string, couple_id: string | null }>();

    if (!inviter || inviter.couple_id) {
      return NextResponse.redirect(new URL(`/invite/${inviteId}?error=inviter_unavailable`, request.url), 303);
    }

    // 6. Create the couple and connect both partners atomically
    const coupleId = crypto.randomUUID();
    await db.batch([
      db.prepare('INSERT INTO couples (id) VALUES (?)').bind(coupleId),
      db.prepare('UPDATE users SET couple_id = ? WHERE id = ?').bind(coupleId, invite.inviter_id),
      db.prepare('UPDATE users SET couple_id = ? WHERE id = ?').bind(coupleId, user.id),
      db.prepare("UPDATE invitations SET status = 'accepted' WHERE id = ?").bind(inviteId),
    ]);

    return NextResponse.redirect(new URL('/dashboard', request.url), 303);
  } catch (err) {
    console.error('Accept invite error:', err);
    return NextResponse.redirect(new URL(`/invite/${inviteId}?error=accept_failed`, request.url), 303);
  }
}
