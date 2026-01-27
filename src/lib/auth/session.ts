import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'sayyes_session';

interface SessionRow {
  id: string;
  user_id: string;
  expires_at: string;
}

export interface UserRow {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  couple_id?: string;
  created_at: string;
}

export async function createSession(db: D1Database, userId: string) {
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  await db
    .prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)')
    .bind(sessionId, userId, expiresAt.toISOString())
    .run();

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  });

  return sessionId;
}

export async function getSession(db: D1Database) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) return null;

  const session = await db
    .prepare('SELECT * FROM sessions WHERE id = ? AND expires_at > ?')
    .bind(sessionId, new Date().toISOString())
    .first<SessionRow>();

  if (!session) return null;

  const user = await db
    .prepare('SELECT * FROM users WHERE id = ?')
    .bind(session.user_id)
    .first<UserRow>();

  return user;
}

export async function deleteSession(db: D1Database) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (sessionId) {
    try {
      await db.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
    } catch (e) {
      console.error('Failed to delete session from DB:', e);
    }
  }

  cookieStore.set(SESSION_COOKIE_NAME, '', {
    expires: new Date(0),
    path: '/',
  });
}
