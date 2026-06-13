/**
 * Admin access is controlled by the ADMIN_EMAILS environment variable
 * (a comma-separated list of email addresses), so it can be changed
 * without code edits and isn't hard-coded into the bundle.
 */
export function isAdmin(email: string | undefined | null, env: CloudflareEnv): boolean {
  if (!email) return false;

  const admins = (env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  return admins.includes(email.toLowerCase());
}
