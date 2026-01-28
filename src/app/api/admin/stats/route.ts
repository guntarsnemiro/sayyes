import { getSession } from '@/lib/auth/session';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

const ADMIN_EMAILS = ['guntarsnemiro@gmail.com'];

export async function GET() {
  try {
    const context = getRequestContext();
    const env = context.env as CloudflareEnv;
    const db = env.DB;
    
    const user = await getSession(db);
    if (!user || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Get Totals
    const userCount = await db.prepare('SELECT COUNT(*) as count FROM users').first<{ count: number }>();
    const coupleCount = await db.prepare('SELECT COUNT(*) as count FROM couples').first<{ count: number }>();
    const checkinCount = await db.prepare('SELECT COUNT(*) as count FROM checkins').first<{ count: number }>();
    const feedbackCount = await db.prepare('SELECT COUNT(*) as count FROM feedback').first<{ count: number }>();

    // 2. Get Latest Users
    const latestUsers = await db.prepare(`
      SELECT email, name, couple_id, created_at 
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 20
    `).all<{ email: string, name: string | null, couple_id: string | null, created_at: string }>();

    // 3. Get Latest Invites
    const latestInvites = await db.prepare(`
      SELECT invitee_email, status, created_at 
      FROM invitations 
      ORDER BY created_at DESC 
      LIMIT 10
    `).all<{ invitee_email: string, status: string, created_at: string }>();

    // 4. Get Latest Feedback
    const latestFeedback = await db.prepare(`
      SELECT f.type, f.message, f.created_at, u.email, u.name
      FROM feedback f
      JOIN users u ON f.user_id = u.id
      ORDER BY f.created_at DESC
      LIMIT 20
    `).all<{ type: string, message: string, created_at: string, email: string, name: string | null }>();

    return NextResponse.json({
      stats: {
        users: userCount?.count || 0,
        couples: coupleCount?.count || 0,
        checkins: checkinCount?.count || 0,
        feedback: feedbackCount?.count || 0
      },
      latestUsers: latestUsers.results,
      latestInvites: latestInvites.results,
      latestFeedback: latestFeedback.results
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
