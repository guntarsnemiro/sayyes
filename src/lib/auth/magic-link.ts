interface MagicLinkRow {
  id: string;
  email: string;
  expires_at: string;
}

export const MAGIC_LINK_TTL_SECONDS = 15 * 60; // 15 minutes

export async function createMagicLink(db: D1Database, email: string) {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + MAGIC_LINK_TTL_SECONDS * 1000);

  await db
    .prepare('INSERT INTO magic_links (id, email, expires_at) VALUES (?, ?, ?)')
    .bind(token, email.toLowerCase(), expiresAt.toISOString())
    .run();

  return token;
}

/**
 * Lightweight rate limit: returns true if a still-valid magic link was issued
 * for this email within the last `withinSeconds`. We derive recency from the
 * ISO-format `expires_at` column (a fresh link expires ~TTL from now) rather
 * than `created_at`, which D1 stores in a different, non-comparable format.
 */
export async function wasMagicLinkRecentlySent(
  db: D1Database,
  email: string,
  withinSeconds: number
) {
  const thresholdMs = Date.now() + (MAGIC_LINK_TTL_SECONDS - withinSeconds) * 1000;
  const threshold = new Date(thresholdMs).toISOString();

  const row = await db
    .prepare('SELECT id FROM magic_links WHERE email = ? AND expires_at > ? LIMIT 1')
    .bind(email.toLowerCase(), threshold)
    .first();

  return !!row;
}

export async function verifyMagicLink(db: D1Database, token: string) {
  const link = await db
    .prepare('SELECT * FROM magic_links WHERE id = ? AND expires_at > ?')
    .bind(token, new Date().toISOString())
    .first<MagicLinkRow>();

  if (!link) return null;

  await db.prepare('DELETE FROM magic_links WHERE id = ?').bind(token).run();

  return link.email;
}
