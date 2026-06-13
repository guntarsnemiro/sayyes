import { generateBridgeInsight, type PartnerInput } from './ai';
import { getDeepDiveCategory, type BridgeInsight, type DeepDiveCategory } from './deepdive';

export interface DeepDiveRow {
  id: string;
  couple_id: string;
  category: string;
  week_date: string;
  status: string;
  insight_json: string | null;
}

export interface ResponseRow {
  user_id: string;
  name: string | null;
  primary_facet: string | null;
  reflection: string | null;
  what_would_help: string | null;
}

function labelFor(list: { id: string; label: string }[], id: string | null): string | null {
  if (!id) return null;
  return list.find((x) => x.id === id)?.label || id;
}

export async function getOrCreateDive(
  db: D1Database,
  coupleId: string,
  category: string,
  weekDate: string
): Promise<DeepDiveRow> {
  await db
    .prepare('INSERT OR IGNORE INTO deep_dives (id, couple_id, category, week_date) VALUES (?, ?, ?, ?)')
    .bind(crypto.randomUUID(), coupleId, category, weekDate)
    .run();

  const dive = await db
    .prepare('SELECT * FROM deep_dives WHERE couple_id = ? AND category = ? AND week_date = ?')
    .bind(coupleId, category, weekDate)
    .first<DeepDiveRow>();

  // Row was just ensured to exist, so this is always present.
  return dive as DeepDiveRow;
}

export async function getResponses(db: D1Database, diveId: string): Promise<ResponseRow[]> {
  const res = await db
    .prepare(`
      SELECT r.user_id, u.name, r.primary_facet, r.reflection, r.what_would_help
      FROM deep_dive_responses r
      JOIN users u ON r.user_id = u.id
      WHERE r.deep_dive_id = ?
    `)
    .bind(diveId)
    .all<ResponseRow>();

  return res.results || [];
}

function toPartnerInput(cat: DeepDiveCategory | null, r: ResponseRow): PartnerInput {
  return {
    name: (r.name || 'Partner').split(' ')[0],
    primaryFacet: cat ? labelFor(cat.facets, r.primary_facet) : r.primary_facet,
    reflection: r.reflection,
    whatWouldHelp: cat ? labelFor(cat.whatWouldHelp, r.what_would_help) : r.what_would_help,
  };
}

/**
 * Generates (and persists) the shared bridge insight once both partners have
 * responded. Returns the existing insight if already generated, or null if it
 * is not yet ready (fewer than two responses).
 */
export async function tryGenerateInsight(
  db: D1Database,
  env: CloudflareEnv,
  dive: DeepDiveRow
): Promise<BridgeInsight | null> {
  if (dive.insight_json) {
    return JSON.parse(dive.insight_json) as BridgeInsight;
  }

  const responses = await getResponses(db, dive.id);
  if (responses.length < 2) return null;

  const cat = getDeepDiveCategory(dive.category);
  const catName = cat?.name || dive.category;

  const insight = await generateBridgeInsight(
    env,
    catName,
    toPartnerInput(cat, responses[0]),
    toPartnerInput(cat, responses[1])
  );

  // Ephemeral privacy: once the shared insight exists, discard the raw
  // free-text reflections. We keep the low-sensitivity structured fields
  // (facet / what-would-help) but wipe the intimate prose.
  await db.batch([
    db
      .prepare("UPDATE deep_dives SET insight_json = ?, status = 'unlocked' WHERE id = ?")
      .bind(JSON.stringify(insight), dive.id),
    db
      .prepare('UPDATE deep_dive_responses SET reflection = NULL WHERE deep_dive_id = ?')
      .bind(dive.id),
  ]);

  return insight;
}
