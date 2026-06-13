import { getSession } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/admin';
import { getWeekDate } from '@/lib/checkin';
import { getDeepDiveCategory } from '@/lib/deepdive';
import { tryGenerateInsight, type DeepDiveRow } from '@/lib/deepdive-server';
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
    if (!isAdmin(user.email, env)) {
      return NextResponse.json({ error: 'Not available yet' }, { status: 403 });
    }
    if (!user.couple_id) {
      return NextResponse.json({ error: 'You need a connected partner first.' }, { status: 400 });
    }

    const body = (await request.json()) as { category?: string };
    const category = body.category || 'intimacy';
    if (!getDeepDiveCategory(category)) {
      return NextResponse.json({ error: 'Unknown category' }, { status: 400 });
    }

    const weekDate = getWeekDate();
    const dive = await db
      .prepare('SELECT * FROM deep_dives WHERE couple_id = ? AND category = ? AND week_date = ?')
      .bind(user.couple_id, category, weekDate)
      .first<DeepDiveRow>();

    if (!dive) {
      return NextResponse.json({ error: 'Nothing to reveal yet' }, { status: 404 });
    }

    const insight = await tryGenerateInsight(db, env, dive);
    if (!insight) {
      return NextResponse.json({ error: 'Waiting for your partner' }, { status: 409 });
    }

    return NextResponse.json({ insight });
  } catch (err) {
    console.error('Deep dive generate error:', err);
    return NextResponse.json({ error: 'Could not generate insight. Please try again.' }, { status: 500 });
  }
}
