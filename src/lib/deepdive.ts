// Configuration for the optional, on-demand "deep dive" experience.
// Each category defines its own facets and options so adding new categories
// later (money, respect, ...) is a config change, not new code.

export interface DeepDiveCategory {
  id: string;
  name: string;
  intro: string;
  facets: { id: string; label: string }[];
  whatWouldHelp: { id: string; label: string }[];
  reflectionPrompt: string;
}

export const DEEP_DIVE_CATEGORIES: Record<string, DeepDiveCategory> = {
  intimacy: {
    id: 'intimacy',
    name: 'Intimacy & desire',
    intro:
      "A private space to understand what's behind your closeness lately. There are no right answers, and you can skip anything. You'll only ever see shared themes together — never each other's raw words.",
    facets: [
      { id: 'emotional', label: 'Emotional closeness — feeling known and understood' },
      { id: 'affection', label: 'Physical affection — non-sexual touch (hugs, hand-holding)' },
      { id: 'sexual', label: 'Sexual connection & desire' },
      { id: 'desired', label: 'Feeling wanted / desired' },
      { id: 'time', label: 'Time & attention for each other' },
      { id: 'unsure', label: "Not sure" },
    ],
    whatWouldHelp: [
      { id: 'affection', label: 'More non-sexual affection' },
      { id: 'time', label: 'More quality time together' },
      { id: 'talk', label: 'Talking about needs more openly' },
      { id: 'rest', label: 'Less stress / more rest' },
      { id: 'desired', label: 'Feeling more desired / initiated with' },
      { id: 'unsure', label: 'Not sure' },
    ],
    reflectionPrompt:
      "In your own words: what feels off about closeness lately — and what would 'better' feel like for you?",
  },
};

export interface BridgeInsight {
  // The blameless need both partners seem to share.
  sharedNeed: string;
  // Where they already agree — surfaced first to reduce defensiveness.
  commonGround: string;
  // The one key difference, framed with compassion (or null if none).
  difference: string | null;
  // One tiny, specific experiment for the week.
  experiment: string;
  // True if the content suggests distress/coercion/safety concerns.
  safety: boolean;
}

export function getDeepDiveCategory(id: string): DeepDiveCategory | null {
  return DEEP_DIVE_CATEGORIES[id] || null;
}
