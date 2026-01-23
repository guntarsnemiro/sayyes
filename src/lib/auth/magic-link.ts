export async function createMagicLink(db: D1Database, email: string) {
  const token = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 15);

  await db
    .prepare('INSERT INTO magic_links (id, email, expires_at) VALUES (?, ?, ?)')
    .bind(token, email.toLowerCase(), expiresAt.toISOString())
    .run();

  return token;
}

export async function verifyMagicLink(db: D1Database, token: string) {
  const link = await db
    .prepare('SELECT * FROM magic_links WHERE id = ? AND expires_at > ?')
    .bind(token, new Date().toISOString())
    .first<any>();

  if (!link) return null;

  await db.prepare('DELETE FROM magic_links WHERE id = ?').bind(token).run();

  return link.email;
}
