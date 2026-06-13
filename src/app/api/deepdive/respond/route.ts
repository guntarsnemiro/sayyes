import { getSession } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/admin';
import { getWeekDate } from '@/lib/checkin';
import { getDeepDiveCategory } from '@/lib/deepdive';
import { getOrCreateDive, tryGenerateInsight } from '@/lib/deepdive-server';
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

    const body = (await request.json()) as {
      category?: string;
      primaryFacet?: string;
      reflection?: string;
      whatWouldHelp?: string;
    };

    const category = body.category || 'intimacy';
    if (!getDeepDiveCategory(category)) {
      return NextResponse.json({ error: 'Unknown category' }, { status: 400 });
    }

    const weekDate = getWeekDate();
    const dive = await getOrCreateDive(db, user.couple_id, category, weekDate);

    // Upsert this partner's response (allows editing before insight is generated)
    await db
      .prepare('DELETE FROM deep_dive_responses WHERE deep_dive_id = ? AND user_id = ?')
      .bind(dive.id, user.id)
      .run();

    await db
      .prepare(`
        INSERT INTO deep_dive_responses (deep_dive_id, user_id, primary_facet, reflection, what_would_help)
        VALUES (?, ?, ?, ?, ?)
      `)
      .bind(
        dive.id,
        user.id,
        body.primaryFacet || null,
        body.reflection?.trim() || null,
        body.whatWouldHelp || null
      )
      .run();

    // If both partners are now in, generate the shared insight.
    let insightError = false;
    try {
      await tryGenerateInsight(db, env, dive);
    } catch (genErr) {
      console.error('Insight generation failed:', genErr);
      insightError = true;
    }

    return NextResponse.json({ success: true, insightError });
  } catch (err) {
    console.error('Deep dive respond error:', err);
    return NextResponse.json({ error: 'Failed to save response' }, { status: 500 });
  }
}
