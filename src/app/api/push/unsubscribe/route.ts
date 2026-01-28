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

    const { subscription } = await request.json() as { subscription: any };
    
    if (!subscription) {
      return NextResponse.json({ error: 'Subscription is required' }, { status: 400 });
    }

    const subscriptionJson = JSON.stringify(subscription);

    // Delete this specific subscription for this user
    await db.prepare('DELETE FROM push_subscriptions WHERE user_id = ? AND subscription_json = ?')
      .bind(user.id, subscriptionJson)
      .run();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Unsubscription error:', err);
    return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 });
  }
}
