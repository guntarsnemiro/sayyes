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
