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

    // Check if subscription already exists for this user
    const existing = await db.prepare('SELECT id FROM push_subscriptions WHERE user_id = ? AND subscription_json = ?')
      .bind(user.id, subscriptionJson)
      .first();

    if (!existing) {
      await db.prepare('INSERT INTO push_subscriptions (user_id, subscription_json) VALUES (?, ?)')
        .bind(user.id, subscriptionJson)
        .run();
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Subscription error:', err);
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
  }
}
