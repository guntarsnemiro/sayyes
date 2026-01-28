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

export const CONVERSATION_STARTERS: Record<string, string> = {
  emotional: "Ask this: 'What is one thing I could do this week to make your load feel 10% lighter?'",
  intimacy: "The 30-Second Rule: Try a 30-second hug today. No agenda, no talking—just a moment of physical presence.",
  money: "Small wins: Instead of a big budget talk, share one small thing you both spent money on this week that actually brought you joy.",
  logistics: "Sync up: Take 10 minutes tonight to look at next week's calendar together. Who's doing what?",
  respect: "Pride point: Tell your partner one thing they did this week (even something small) that made you feel proud to be with them."
};

export type AlignmentState = 'aligned' | 'partially-aligned' | 'misaligned';

export function getAlignmentState(score1: number, score2: number): AlignmentState {
  const diff = Math.abs(score1 - score2);
  if (diff <= 1) return 'aligned';
  if (diff === 2) return 'partially-aligned';
  return 'misaligned';
}

export function getWeeklyFocus(userMap: Record<string, number>, partnerMap: Record<string, number>) {
  // 1. Check for Gaps (Difference >= 2)
  const gapCategories = CHECKIN_CATEGORIES.filter(cat => {
    const score1 = userMap[cat.id] || 0;
    const score2 = partnerMap[cat.id] || 0;
    return Math.abs(score1 - score2) >= 2;
  });

  if (gapCategories.length > 0) {
    // Return the one with the biggest gap, or just the first one
    const focus = gapCategories.sort((a, b) => {
      const diffA = Math.abs((userMap[a.id] || 0) - (partnerMap[a.id] || 0));
      const diffB = Math.abs((userMap[b.id] || 0) - (partnerMap[b.id] || 0));
      return diffB - diffA;
    })[0];
    return { categoryId: focus.id, message: CONVERSATION_STARTERS[focus.id] };
  }

  // 2. Check for Low Floor (Total < 7)
  const lowFloorCategories = CHECKIN_CATEGORIES.filter(cat => {
    const score1 = userMap[cat.id] || 0;
    const score2 = partnerMap[cat.id] || 0;
    return (score1 + score2) < 7 && score1 > 0 && score2 > 0;
  });

  if (lowFloorCategories.length > 0) {
    // Return the one with the lowest total
    const focus = lowFloorCategories.sort((a, b) => {
      const totalA = (userMap[a.id] || 0) + (partnerMap[a.id] || 0);
      const totalB = (userMap[b.id] || 0) + (partnerMap[b.id] || 0);
      return totalA - totalB;
    })[0];
    return { categoryId: focus.id, message: CONVERSATION_STARTERS[focus.id] };
  }

  return null;
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

export function calculateAverageScore(answers1: Record<string, number>, answers2: Record<string, number>): number {
  let totalScore = 0;
  let count = 0;

  for (const cat of CHECKIN_CATEGORIES) {
    if (answers1[cat.id] !== undefined) {
      totalScore += answers1[cat.id];
      count++;
    }
    if (answers2[cat.id] !== undefined) {
      totalScore += answers2[cat.id];
      count++;
    }
  }

  if (count === 0) return 0;
  return Math.round((totalScore / count) * 10) / 10;
}

export function calculateCategoryAverage(score1?: number, score2?: number): number {
  if (score1 === undefined && score2 === undefined) return 0;
  const s1 = score1 || 0;
  const s2 = score2 || 0;
  const count = (score1 !== undefined ? 1 : 0) + (score2 !== undefined ? 1 : 0);
  return Math.round(((s1 + s2) / count) * 10) / 10;
}
