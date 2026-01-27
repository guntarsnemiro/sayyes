export const CHECKIN_CATEGORIES = [
  {
    id: 'emotional',
    name: 'Emotional support',
    question: 'Did you feel emotionally supported this week?',
    description: 'Feeling heard, understood, and cared for by your partner.'
  },
  {
    id: 'intimacy',
    name: 'Intimacy & desire',
    question: 'Did you feel close or connected to your partner?',
    description: 'Physical connection, affection, and emotional intimacy.'
  },
  {
    id: 'money',
    name: 'Money & fairness',
    question: 'Did financial matters feel fair and calm?',
    description: 'Alignment on spending, saving, and financial stress.'
  },
  {
    id: 'logistics',
    name: 'Responsibilities & logistics',
    question: 'Did responsibilities feel shared fairly?',
    description: 'Housework, kids, planning, and daily life tasks.'
  },
  {
    id: 'respect',
    name: 'Respect & communication',
    question: 'Did you feel listened to when something mattered?',
    description: 'Tone of voice, respect for boundaries, and clear communication.'
  }
];

export function getWeekDate() {
  const now = new Date();
  const day = now.getDay();
  // Get the date of the most recent Monday
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split('T')[0];
}

export const ACTION_SUGGESTIONS: Record<string, string> = {
  emotional: "Share one thing you appreciated about your partner this week.",
  intimacy: "Dedicate 15 minutes to distraction-free physical connection or conversation.",
  money: "Set aside 10 minutes to discuss one financial goal or concern calmly.",
  logistics: "Review next week's schedule together and ask 'How can I help you most?'.",
  respect: "Practice active listening: let your partner speak for 3 minutes without interrupting."
};

export type AlignmentState = 'aligned' | 'partially-aligned' | 'misaligned';

export function getAlignmentState(score1: number, score2: number): AlignmentState {
  const diff = Math.abs(score1 - score2);
  if (diff <= 1) return 'aligned';
  if (diff === 2) return 'partially-aligned';
  return 'misaligned';
}

export function getPrimaryAction(alignment: Record<string, AlignmentState>) {
  const misaligned = CHECKIN_CATEGORIES.find(cat => alignment[cat.id] === 'misaligned');
  if (misaligned) return ACTION_SUGGESTIONS[misaligned.id];

  const partially = CHECKIN_CATEGORIES.find(cat => alignment[cat.id] === 'partially-aligned');
  if (partially) return ACTION_SUGGESTIONS[partially.id];

  return "You are perfectly aligned this week. Enjoy the connection!";
}

export function calculateAlignment(answers1: Record<string, number>, answers2: Record<string, number>) {
  const alignment: Record<string, AlignmentState> = {};
  for (const cat of CHECKIN_CATEGORIES) {
    alignment[cat.id] = getAlignmentState(answers1[cat.id], answers2[cat.id]);
  }
  return alignment;
}

export function calculateWeeklyScore(answers1: Record<string, number>, answers2: Record<string, number>): number {
  let totalDiff = 0;
  let categoriesCount = 0;

  for (const cat of CHECKIN_CATEGORIES) {
    if (answers1[cat.id] !== undefined && answers2[cat.id] !== undefined) {
      totalDiff += Math.abs(answers1[cat.id] - answers2[cat.id]);
      categoriesCount++;
    }
  }

  if (categoriesCount === 0) return 0;

  // Max difference per category is 4 (5-1). Total max diff = 4 * 5 = 20.
  // We want a score where 100% is perfect alignment (diff = 0)
  const maxDiff = categoriesCount * 4;
  const score = Math.round(((maxDiff - totalDiff) / maxDiff) * 100);
  return Math.max(0, score);
}
