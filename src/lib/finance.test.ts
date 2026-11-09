import { describe, it, expect } from 'vitest';
import {
  calculateEMI,
  calculateSIP,
  calculateCompound,
  compoundSeries,
  indianNumber,
  scoreQuiz,
  filterBlockTypes,
  inr
} from './finance';
const blocks = [
  { type: 'emi-calculator', label: 'EMI Calculator', keywords: ['loan', 'calc'] },
  { type: 'rich-text', label: 'Rich Text', keywords: ['writing'] },
];
describe('Indian number formatting', () => {
  it('formats lakhs and crores', () => {
    expect(indianNumber(100000)).toBe('1,00,000');
    expect(indianNumber(10000000)).toBe('1,00,00,000');
  });
  it('handles decimals, zero and negatives', () => {
    expect(indianNumber(1234.5)).toBe('1,234.5');
    expect(indianNumber(0)).toBe('0');
    expect(indianNumber(-1000)).toBe('-1,000');
  });
});
describe('EMI calculator', () => {
  it('matches the specification reference', () => {
    expect(calculateEMI(500000, 8.5, 240).emi).toBeCloseTo(4339.12, 1);
  });
  it('calculates schedule with one row per month', () => {
    const r = calculateEMI(500000, 8.5, 12);
    expect(r.schedule).toHaveLength(12);
    expect(r.schedule[11].closing).toBeCloseTo(0, 5);
  });
  it('handles minimum principal, maximum rate and tenure', () => {
    expect(calculateEMI(10000, 36, 360).emi).toBeGreaterThan(0);
  });
  it('handles maximum principal and one month', () => {
    expect(calculateEMI(100000000, 1, 1).emi).toBeGreaterThan(100000000);
  });
  it.each([
    [9999, 8, 12],
    [100000001, 8, 12],
    [50000, 0, 12],
    [50000, 37, 12],
    [50000, 8, 0],
    [50000, 8, 361],
  ])('rejects invalid range %s %s %s', (p, r, n) => {
    expect(() => calculateEMI(p, r, n)).toThrow();
  });
  it('rejects non-integer tenure', () => expect(() => calculateEMI(50000, 8, 1.5)).toThrow());
});
describe('SIP calculator', () => {
  it('uses annuity due formula', () => {
    const x = calculateSIP(5000, 12, 10);
    expect(x.futureValue).toBeGreaterThan(1100000);
    expect(x.yearly).toHaveLength(10);
  });
  it('calculates invested amount', () => expect(calculateSIP(500, 1, 1).invested).toBe(6000));
  it.each([
    [499, 12, 10],
    [1000001, 12, 10],
    [5000, 0, 10],
    [5000, 31, 10],
    [5000, 12, 0],
    [5000, 12, 41],
  ])('rejects invalid input %s %s %s', (p, r, y) => expect(() => calculateSIP(p, r, y)).toThrow());
  it('reports wealth gained', () => {
    const x = calculateSIP(5000, 12, 10);
    expect(x.wealthGained).toBe(x.futureValue - x.invested);
  });
});
describe('compound interest', () => {
  it('supports four frequencies', () => {
    const values = [1, 2, 4, 12].map((f) => calculateCompound(100000, 8, 10, f as 1 | 2 | 4 | 12));
    expect(values[0]).toBeLessThan(values[3]);
  });
  it('returns a yearly growth series', () =>
    expect(compoundSeries(10000, 8, 5, 4)).toHaveLength(5));
  it('rejects invalid principal', () => expect(() => calculateCompound(0, 8, 5, 4)).toThrow());
  it('rejects negative rate', () => expect(() => calculateCompound(10000, -1, 5, 4)).toThrow());
  it('rejects invalid years', () => expect(() => calculateCompound(10000, 8, 0, 4)).toThrow());
});
describe('quiz scoring', () => {
  it('scores a correct single answer', () => expect(scoreQuiz([1], [1], 10)).toBe(10));
  it('scores zero for wrong answer', () => expect(scoreQuiz([0], [1], 10)).toBe(0));
  it('supports multi-correct exact match', () => expect(scoreQuiz([0, 1], [0, 1], 10)).toBe(10));
  it('supports partial credit', () => expect(scoreQuiz([0], [0, 1], 10, true)).toBe(5));
  it('deducts wrong selections in partial mode', () =>
    expect(scoreQuiz([0, 2], [0, 1], 10, true)).toBe(0));
  it('handles no correct answers', () => expect(scoreQuiz([1], [], 10)).toBe(0));
});
describe('slash command filtering', () => {
  it('matches type and keyword', () => expect(filterBlockTypes('calc', blocks)).toHaveLength(1));
  it('matches partial labels', () => expect(filterBlockTypes('rich', blocks)).toHaveLength(1));
  it('returns all for empty query', () => expect(filterBlockTypes('', blocks)).toHaveLength(2));
  it('returns no result for unmatched query', () =>
    expect(filterBlockTypes('not-a-block', blocks)).toHaveLength(0));
});
describe('INR currency formatter', () => {
  it('formats a positive INR amount', () => {
    expect(inr(1000)).toBe('₹1,000.00');
  });

  it('formats decimal INR amounts', () => {
    expect(inr(1234.56)).toBe('₹1,234.56');
  });

  it('formats zero', () => {
    expect(inr(0)).toBe('₹0.00');
  });

  it('handles NaN safely', () => {
    expect(inr(NaN)).toBe('₹0.00');
  });

  it('handles positive infinity safely', () => {
    expect(inr(Infinity)).toBe('₹0.00');
  });

  it('handles negative infinity safely', () => {
    expect(inr(-Infinity)).toBe('₹0.00');
  });
});