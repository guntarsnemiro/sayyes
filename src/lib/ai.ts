import type { BridgeInsight } from './deepdive';

export interface PartnerInput {
  name: string;
  primaryFacet?: string | null;
  reflection?: string | null;
  whatWouldHelp?: string | null;
}

// Workers AI model. Override with the AI_MODEL env var if desired.
const DEFAULT_MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';

const SYSTEM_PROMPT = `You are a calm, neutral relationship facilitator inside an app called SayYes, for committed couples who have chosen to stay together.

Two partners have each privately reflected on one area of their relationship. You can see BOTH reflections; they cannot see each other's raw words. Your job is to translate what they wrote into ONE shared, blameless insight that helps them feel understood and gives them one small, doable step.

Hard rules:
- You are NOT a therapist. Do not diagnose, label, or use clinical language.
- Never take sides, never assign blame, never say one partner is right or wrong.
- Translate complaints into underlying needs. Lead with common ground.
- Never pressure anyone toward sex or any specific behavior. Lower desire is normal, not a flaw.
- Be warm, concise, and concrete. Plain language. No therapy jargon, no platitudes.
- If either reflection suggests abuse, violence, coercion, fear, or self-harm, set "safety" to true, keep all text gentle and supportive, and make the experiment about reaching out for support (not a relationship exercise).

Respond with ONLY a JSON object, no markdown, no prose around it, with exactly these keys:
{
  "sharedNeed": "1-2 sentences naming the need they seem to share, blameless",
  "commonGround": "1 sentence on where they already agree",
  "difference": "1 sentence on the main difference framed with compassion, or null if none",
  "experiment": "one tiny, specific thing to try this week",
  "safety": false
}`;

function parseInsight(text: string): BridgeInsight {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('AI did not return JSON');
  }

  const parsed = JSON.parse(text.slice(start, end + 1)) as Partial<BridgeInsight>;

  return {
    sharedNeed: String(parsed.sharedNeed || '').trim(),
    commonGround: String(parsed.commonGround || '').trim(),
    difference:
      parsed.difference == null || String(parsed.difference).trim() === ''
        ? null
        : String(parsed.difference).trim(),
    experiment: String(parsed.experiment || '').trim(),
    safety: Boolean(parsed.safety),
  };
}

export async function generateBridgeInsight(
  env: CloudflareEnv,
  categoryName: string,
  a: PartnerInput,
  b: PartnerInput
): Promise<BridgeInsight> {
  const model = env.AI_MODEL || DEFAULT_MODEL;

  const payload = {
    area: categoryName,
    partnerA: {
      name: a.name,
      mostAffected: a.primaryFacet || 'unspecified',
      reflection: a.reflection || '(no note)',
      wouldHelp: a.whatWouldHelp || 'unspecified',
    },
    partnerB: {
      name: b.name,
      mostAffected: b.primaryFacet || 'unspecified',
      reflection: b.reflection || '(no note)',
      wouldHelp: b.whatWouldHelp || 'unspecified',
    },
  };

  const res: any = await (env.AI as any).run(model, {
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Two partners reflected privately on "${categoryName}". Here is what each wrote (JSON). Produce the shared insight JSON.\n\n${JSON.stringify(
          payload
        )}`,
      },
    ],
    max_tokens: 600,
    temperature: 0.6,
  });

  const text: string = typeof res === 'string' ? res : res?.response ?? '';
  return parseInsight(text);
}
