import { describe, it, expect } from 'vitest';
import {
  calculateEMI,
  calculateSIP,
  calculateCompound,
  scoreQuiz,
  indianNumber,
  filterBlockTypes,
} from '../finance';
import { createBlock, createModule, exportModule, importModule, validateModule } from '../document';
import { BLOCK_TYPES } from '../../types';
const catalog = BLOCK_TYPES.map((type) => ({
  type,
  label: type.replaceAll('-', ' '),
  keywords: [type.split('-')[0], 'financial'],
}));
describe('EMI acceptance cases', () => {
  it.each([
    [10000, 1, 1],
    [10000, 36, 360],
    [100000000, 1, 1],
    [100000000, 36, 360],
    [500000, 8.5, 240],
    [2500000, 9.2, 180],
    [1000000, 10, 120],
    [750000, 7.5, 60],
    [1500000, 11, 240],
    [250000, 12, 24],
    [50000, 18, 36],
    [900000, 6.5, 300],
    [3000000, 8, 240],
    [10000000, 9, 360],
    [100000, 15, 12],
  ])('returns finite EMI for %s/%s/%s', (p, r, n) => {
    const result = calculateEMI(p, r, n);
    expect(Number.isFinite(result.emi)).toBe(true);
    expect(result.schedule).toHaveLength(n);
  });
});
describe('SIP acceptance cases', () => {
  it.each([
    [500, 1, 1],
    [500, 30, 40],
    [1000000, 1, 40],
    [1000000, 30, 1],
    [1000, 8, 5],
    [2500, 10, 10],
    [5000, 12, 15],
    [10000, 15, 20],
    [25000, 18, 25],
    [50000, 20, 30],
    [100000, 25, 35],
    [500000, 30, 40],
  ])('returns finite future value for %s/%s/%s', (p, r, y) => {
    const result = calculateSIP(p, r, y);
    expect(Number.isFinite(result.futureValue)).toBe(true);
    expect(result.yearly).toHaveLength(y);
  });
});
describe('compound acceptance cases', () => {
  it.each([1, 2, 4, 12] as const)('supports compounding frequency %s', (f) =>
    expect(calculateCompound(100000, 8, 10, f)).toBeGreaterThan(100000),
  );
  it.each([
    [1000, 1, 1],
    [5000, 5, 5],
    [10000, 8, 10],
    [50000, 10, 15],
    [100000, 12, 20],
    [500000, 15, 25],
  ])('grows positive principal %s/%s/%s', (p, r, y) =>
    expect(calculateCompound(p, r, y, 4)).toBeGreaterThan(p),
  );
});

const quizCases: Array<[number[], number[], number, number, boolean]> = [
  [[0], [0], 10, 10, false],
  [[1], [0], 10, 0, false],
  [[0, 1], [0, 1], 20, 20, false],
  [[0, 1], [0, 1, 2], 30, 0, false],
  [[0, 2], [0, 1], 10, 0, false],
  [[1, 2], [1, 2], 5, 5, false],
  [[0], [0, 1], 10, 0, false],
  [[0], [0, 1], 10, 5, true],
];

describe('quiz scoring acceptance cases', () => {
  it.each(quizCases)(
    'scores selected answers',
    (selected, correct, points, expected, partial) => {
      expect(scoreQuiz(selected, correct, points, partial)).toBe(expected);
    }
  );

  it('returns partial points', () =>
    expect(scoreQuiz([0, 1], [0, 1, 2], 30, true)).toBe(20));

  it('does not return negative partial score', () =>
    expect(scoreQuiz([3], [0, 1], 10, true)).toBe(0));

  it('handles empty selection', () =>
    expect(scoreQuiz([], [1], 10)).toBe(0));

  it('handles zero points', () =>
    expect(scoreQuiz([1], [1], 0)).toBe(0));

  it('handles negative points', () =>
    expect(scoreQuiz([1], [1], -1)).toBe(0));

  it('supports multiple correct selections', () =>
    expect(scoreQuiz([1, 2], [1, 2], 15)).toBe(15));

  it('rejects extra incorrect selection', () =>
    expect(scoreQuiz([1, 2, 3], [1, 2], 15)).toBe(0));
});

describe('block factory and registry', () => {
  it.each(BLOCK_TYPES)('creates default %s', (type) => {
    const b = createBlock(type);
    expect(b.type).toBe(type);
    expect(b.content).toBeDefined();
    expect(b.settings).toEqual({ isVisible: true, isLocked: false, customCss: '' });
  });
  it('creates a unique module and blocks', () => {
    const d = createModule();
    expect(new Set(d.blocks.map((b) => b.id)).size).toBe(d.blocks.length);
  });
});
describe('JSON acceptance cases', () => {
  it('exports schema version', () =>
    expect(JSON.parse(exportModule(createModule())).schemaVersion).toBe('1.0.0'));
  it('imports with new IDs', () => {
    const d = createModule();
    const x = importModule(JSON.stringify(d));
    expect(x.moduleId).not.toBe(d.moduleId);
  });
  it('preserves text and tags', () => {
    const d = createModule();
    d.metadata.tags = ['saving', 'budget'];
    const x = importModule(JSON.stringify(d));
    expect(x.metadata.tags).toEqual(d.metadata.tags);
  });
  it('rejects malformed input', () => expect(() => importModule('not json')).toThrow());
  it('rejects missing required document properties', () =>
    expect(() => importModule(JSON.stringify({ title: 'x' }))).toThrow());
  it('rejects a document without blocks', () => {
    const d = createModule();
    d.blocks = [];
    expect(validateModule(d).length).toBeGreaterThan(0);
  });
  it('detects duplicate block order', () => {
    const d = createModule();
    d.blocks[1].order = 0;
    expect(validateModule(d)).toContain('Internal error: duplicate block order detected.');
  });
});
describe('search and number-format acceptance cases', () => {
  it('formats Indian lakhs', () => expect(indianNumber(1250000)).toBe('12,50,000'));
  it('formats Indian crores', () => expect(indianNumber(12500000)).toBe('1,25,00,000'));
  it('formats zero', () => expect(indianNumber(0)).toBe('0'));
  it('formats negative amounts', () => expect(indianNumber(-123456)).toBe('-1,23,456'));
  it('filters calculator keywords', () =>
    expect(filterBlockTypes('financial', catalog).length).toBe(15));
  it('filters by partial block type', () =>
    expect(filterBlockTypes('emi', catalog).length).toBe(1));
  it('is case insensitive', () => expect(filterBlockTypes('SIP', catalog).length).toBe(1));
  it('trims query', () => expect(filterBlockTypes('  emi  ', catalog).length).toBe(1));
  it('returns all for blank query', () => expect(filterBlockTypes(' ', catalog).length).toBe(15));
  it('returns empty for unknown query', () =>
    expect(filterBlockTypes('zzzzz', catalog)).toHaveLength(0));
});
