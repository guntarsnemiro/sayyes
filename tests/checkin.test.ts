import { describe, it, expect } from 'vitest';
import {
  getAlignmentState,
  getScoreType,
  getWeeklyFocus,
  calculateWeeklyScore,
  calculateAverageScore,
  calculateCategoryAverage,
  getWeekDate,
  CONVERSATION_STARTERS,
} from '@/lib/checkin';

const allCategories = (value: number) => ({
  emotional: value,
  intimacy: value,
  money: value,
  logistics: value,
  respect: value,
});

describe('getAlignmentState', () => {
  it('treats a difference of 0 or 1 as aligned', () => {
    expect(getAlignmentState(3, 3)).toBe('aligned');
    expect(getAlignmentState(4, 3)).toBe('aligned');
    expect(getAlignmentState(2, 3)).toBe('aligned');
  });

  it('treats a difference of exactly 2 as partially aligned', () => {
    expect(getAlignmentState(5, 3)).toBe('partially-aligned');
    expect(getAlignmentState(1, 3)).toBe('partially-aligned');
  });

  it('treats a difference of 3 or more as misaligned', () => {
    expect(getAlignmentState(5, 2)).toBe('misaligned');
    expect(getAlignmentState(5, 1)).toBe('misaligned');
  });
});

describe('getScoreType', () => {
  it('is alignment when both partners answered a shared category', () => {
    expect(getScoreType(allCategories(4), allCategories(3))).toBe('alignment');
  });

  it('is fulfillment when only one partner answered', () => {
    expect(getScoreType(allCategories(4), {})).toBe('fulfillment');
  });
});

describe('calculateWeeklyScore', () => {
  it('returns 100 when both partners match exactly (alignment)', () => {
    expect(calculateWeeklyScore(allCategories(5), allCategories(5))).toBe(100);
  });

  it('returns 0 when partners are maximally apart', () => {
    expect(calculateWeeklyScore(allCategories(5), allCategories(1))).toBe(0);
  });

  it('scales linearly with the gap', () => {
    // diff of 1 across all 5 categories => 75% alignment
    expect(calculateWeeklyScore(allCategories(5), allCategories(4))).toBe(75);
  });

  it('falls back to a solo fulfillment score when only one answered', () => {
    expect(calculateWeeklyScore(allCategories(5), {})).toBe(100);
    expect(calculateWeeklyScore(allCategories(3), {})).toBe(60);
  });

  it('returns 0 when there is no data', () => {
    expect(calculateWeeklyScore({}, {})).toBe(0);
  });
});

describe('calculateAverageScore', () => {
  it('averages every present score across both partners', () => {
    expect(calculateAverageScore(allCategories(4), allCategories(2))).toBe(3);
  });

  it('returns 0 when empty', () => {
    expect(calculateAverageScore({}, {})).toBe(0);
  });
});

describe('calculateCategoryAverage', () => {
  it('averages both scores when present', () => {
    expect(calculateCategoryAverage(5, 3)).toBe(4);
  });

  it('uses only the present score when one is missing', () => {
    expect(calculateCategoryAverage(5, undefined)).toBe(5);
    expect(calculateCategoryAverage(undefined, 2)).toBe(2);
  });

  it('returns 0 when both are missing', () => {
    expect(calculateCategoryAverage(undefined, undefined)).toBe(0);
  });
});

describe('getWeeklyFocus', () => {
  it('prioritises the category with the biggest gap', () => {
    const user = { ...allCategories(5), money: 5 };
    const partner = { ...allCategories(5), money: 1 };
    const focus = getWeeklyFocus(user, partner);
    expect(focus).not.toBeNull();
    expect(focus?.categoryId).toBe('money');
    expect(focus?.message).toBe(CONVERSATION_STARTERS.money);
  });

  it('falls back to the lowest shared floor when there is no gap', () => {
    // No gaps (all equal) but emotional is a low joint floor (3 + 3 = 6 < 7)
    const user = { ...allCategories(5), emotional: 3 };
    const partner = { ...allCategories(5), emotional: 3 };
    const focus = getWeeklyFocus(user, partner);
    expect(focus?.categoryId).toBe('emotional');
  });

  it('returns null when everything is aligned and healthy', () => {
    expect(getWeeklyFocus(allCategories(5), allCategories(5))).toBeNull();
  });
});

describe('getWeekDate', () => {
  it('returns an ISO date string anchored to a Sunday (UTC)', () => {
    const week = getWeekDate();
    expect(week).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(new Date(`${week}T00:00:00Z`).getUTCDay()).toBe(0);
  });

  it('is not in the future', () => {
    const week = new Date(`${getWeekDate()}T00:00:00Z`).getTime();
    expect(week).toBeLessThanOrEqual(Date.now());
  });
});
