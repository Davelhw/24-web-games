import { describe, expect, it } from 'vitest';
import {
  explainAdvanced24Formula,
  explainBasic24Formula,
  getAnyBasic24Solution,
  validateAdvanced24Formula,
  validateBasic24Formula,
} from '../src/basic24.js';

describe('validateBasic24Formula', () => {
  it('accepts a valid formula that equals 24', () => {
    const result = validateBasic24Formula({
      digits: [2, 4, 6, 8],
      formula: '8*6/(4/2)',
    });

    expect(result).toEqual({
      ok: true,
      value: 24,
      usedDigits: [8, 6, 4, 2],
      error: null,
    });
  });

  it('accepts formulas with spaces', () => {
    const result = validateBasic24Formula({
      digits: [2, 4, 6, 8],
      formula: '8 * 6 / (4 / 2)',
    });

    expect(result.ok).toBe(true);
  });

  it('accepts implicit multiplication between a number and brackets', () => {
    const result = validateBasic24Formula({
      digits: [4, 4, 4, 4],
      formula: '4(4)+4+4',
    });

    expect(result).toEqual({
      ok: true,
      value: 24,
      usedDigits: [4, 4, 4, 4],
      error: null,
    });
  });

  it('accepts implicit multiplication between brackets and a number', () => {
    const result = validateBasic24Formula({
      digits: [2, 3, 6, 6],
      formula: '2(3+6)+6',
    });

    expect(result).toEqual({
      ok: true,
      value: 24,
      usedDigits: [2, 3, 6, 6],
      error: null,
    });
  });

  it('parses adjacent bracketed expressions as multiplication', () => {
    const result = validateBasic24Formula({
      digits: [1, 2, 3, 4],
      formula: '(1+2)(3+4)',
    });

    expect(result).toEqual({
      ok: false,
      value: null,
      usedDigits: [1, 2, 3, 4],
      error: 'Formula equals 21, not 24.',
    });
  });

  it('rejects formulas that do not equal 24', () => {
    const result = validateBasic24Formula({
      digits: [2, 4, 6, 8],
      formula: '8+6+4+2',
    });

    expect(result).toEqual({
      ok: false,
      value: null,
      usedDigits: [8, 6, 4, 2],
      error: 'Formula equals 20, not 24.',
    });
  });

  it('requires exactly four input digits', () => {
    const result = validateBasic24Formula({
      digits: [2, 4, 6],
      formula: '2+4+6',
    });

    expect(result).toEqual({
      ok: false,
      value: null,
      usedDigits: [],
      error: 'Exactly four digits are required.',
    });
  });

  it('rejects non-digit input numbers', () => {
    const result = validateBasic24Formula({
      digits: [2, 4, 6, 10],
      formula: '2+4+6+10',
    });

    expect(result).toEqual({
      ok: false,
      value: null,
      usedDigits: [],
      error: 'Digits must be integers from 0 to 9.',
    });
  });

  it('rejects multi-digit numbers in formula', () => {
    const result = validateBasic24Formula({
      digits: [1, 1, 2, 3],
      formula: '1+1+2+20',
    });

    expect(result).toEqual({
      ok: false,
      value: null,
      usedDigits: [1, 1, 2, 2, 0],
      error: 'Formula must use every given digit exactly once.',
    });
  });

  it('handles duplicate digits by count, not just existence', () => {
    const result = validateBasic24Formula({
      digits: [1, 1, 2, 3],
      formula: '1+2+3+3',
    });

    expect(result).toEqual({
      ok: false,
      value: null,
      usedDigits: [1, 2, 3, 3],
      error: 'Formula must use every given digit exactly once.',
    });
  });

  it('accepts valid duplicate digit usage and normalizes floating result to 24', () => {
    const result = validateBasic24Formula({
      digits: [3, 3, 8, 8],
      formula: '8/(3-8/3)',
    });

    expect(result).toEqual({
      ok: true,
      value: 24,
      usedDigits: [8, 3, 8, 3],
      error: null,
    });
  });

  it('rejects invalid characters', () => {
    const result = validateBasic24Formula({
      digits: [2, 4, 6, 8],
      formula: '8^6+4+2',
    });

    expect(result).toEqual({
      ok: false,
      value: null,
      usedDigits: [8],
      error: 'Invalid character "^". Only digits, +, -, *, /, brackets, and spaces are allowed.',
    });
  });

  it('rejects root character in basic mode', () => {
    const result = validateBasic24Formula({
      digits: [2, 4, 6, 8],
      formula: '2√9*8',
    });

    expect(result).toEqual({
      ok: false,
      value: null,
      usedDigits: [2, 9, 8],
      error: 'Invalid character "√". Only digits, +, -, *, /, brackets, and spaces are allowed.',
    });
  });

  it('rejects invalid syntax', () => {
    const result = validateBasic24Formula({
      digits: [2, 4, 6, 8],
      formula: '8**6+4+2',
    });

    expect(result).toEqual({
      ok: false,
      value: null,
      usedDigits: [8, 6, 4, 2],
      error: 'Invalid formula syntax.',
    });
  });

  it('rejects missing closing brackets', () => {
    const result = validateBasic24Formula({
      digits: [2, 4, 6, 8],
      formula: '(8*6/(4/2)',
    });

    expect(result).toEqual({
      ok: false,
      value: null,
      usedDigits: [8, 6, 4, 2],
      error: 'Missing closing bracket.',
    });
  });

  it('rejects division by zero', () => {
    const result = validateBasic24Formula({
      digits: [0, 4, 4, 8],
      formula: '8/(4-4)+0',
    });

    expect(result).toEqual({
      ok: false,
      value: null,
      usedDigits: [8, 4, 4, 0],
      error: 'Division by zero is not allowed.',
    });
  });

  it('rejects empty formulas', () => {
    const result = validateBasic24Formula({
      digits: [2, 4, 6, 8],
      formula: '   ',
    });

    expect(result).toEqual({
      ok: false,
      value: null,
      usedDigits: [],
      error: 'Formula is required.',
    });
  });
});

it('returns educational evaluation steps for a valid formula', () => {
  const result = explainBasic24Formula({
    digits: [2, 4, 6, 8],
    formula: '8*6/(4/2)',
  });

  expect(result).toEqual({
    ok: true,
    value: 24,
    usedDigits: [8, 6, 4, 2],
    steps: [
      {
        expression: '8 * 6 = 48',
        value: 48,
      },
      {
        expression: '4 / 2 = 2',
        value: 2,
      },
      {
        expression: '48 / 2 = 24',
        value: 24,
      },
    ],
    error: null,
  });
});

it('returns educational evaluation steps for implicit multiplication', () => {
  const result = explainBasic24Formula({
    digits: [4, 4, 4, 4],
    formula: '4(4)+4+4',
  });

  expect(result).toEqual({
    ok: true,
    value: 24,
    usedDigits: [4, 4, 4, 4],
    steps: [
      {
        expression: '4 * 4 = 16',
        value: 16,
      },
      {
        expression: '16 + 4 = 20',
        value: 20,
      },
      {
        expression: '20 + 4 = 24',
        value: 24,
      },
    ],
    error: null,
  });
});

it('keeps validation result shape unchanged', () => {
  const result = validateBasic24Formula({
    digits: [2, 4, 6, 8],
    formula: '8*6/(4/2)',
  });

  expect(result).toEqual({
    ok: true,
    value: 24,
    usedDigits: [8, 6, 4, 2],
    error: null,
  });
});

describe('validateAdvancedBasic24Formula', () => {
  it('accepts power in advanced mode', () => {
    const result = validateAdvanced24Formula({
      digits: [2, 3, 1, 3],
      formula: '2^3*1*3',
    });

    expect(result).toEqual({
      ok: true,
      value: 24,
      usedDigits: [2, 3, 1, 3],
      error: null,
    });
  });

  it('accepts indexed root in advanced mode', () => {
    const result = validateAdvanced24Formula({
      digits: [9, 7, 9, 8],
      formula: '(9-7)√9*8',
    });

    expect(result).toEqual({
      ok: true,
      value: 24,
      usedDigits: [9, 7, 9, 8],
      error: null,
    });
  });

  it('accepts a root expression chain in advanced mode', () => {
    const result = validateAdvanced24Formula({
      digits: [3, 8, 3, 4],
      formula: '3√8*3*4',
    });

    expect(result).toEqual({
      ok: true,
      value: 24,
      usedDigits: [3, 8, 3, 4],
      error: null,
    });
  });

  it('rejects root without an index in advanced mode', () => {
    const result = validateAdvanced24Formula({
      digits: [9, 7, 9, 8],
      formula: '√9*8*(9-7)',
    });

    expect(result.ok).toBe(false);
  });

  it('rejects power and root in basic mode even when advanced mode accepts them', () => {
    const powerResult = validateBasic24Formula({
      digits: [2, 3, 1, 3],
      formula: '2^3*1*3',
    });

    const rootResult = validateBasic24Formula({
      digits: [9, 7, 9, 8],
      formula: '(9-7)√9*8',
    });

    expect(powerResult.ok).toBe(false);
    expect(rootResult.ok).toBe(false);
  });
});

describe('explainAdvanced24Formula', () => {
  it('returns educational evaluation steps for advanced power and root operations', () => {
    const result = explainAdvanced24Formula({
      digits: [9, 7, 9, 8],
      formula: '(9-7)√9*8',
    });

    expect(result).toEqual({
      ok: true,
      value: 24,
      usedDigits: [9, 7, 9, 8],
      steps: [
        {
          expression: '9 - 7 = 2',
          value: 2,
        },
        {
          expression: '2 √ 9 = 3',
          value: 3,
        },
        {
          expression: '3 * 8 = 24',
          value: 24,
        },
      ],
      error: null,
    });
  });
});

describe('getAnyBasic24Solution', () => {
  it('finds a solution for a solvable digit set', () => {
    const formula = getAnyBasic24Solution([6, 1, 3, 4]);

    expect(formula).not.toBeNull();

    if (formula === null) {
      throw new Error('Expected a formula for [6, 1, 3, 4].');
    }

    expect(validateBasic24Formula({
      digits: [6, 1, 3, 4],
      formula,
    }).ok).toBe(true);
  });

  it('finds a solution for a duplicate-digit solvable set', () => {
    const formula = getAnyBasic24Solution([3, 3, 8, 8]);

    expect(formula).not.toBeNull();

    if (formula === null) {
      throw new Error('Expected a formula for [3, 3, 8, 8].');
    }

    expect(validateBasic24Formula({
      digits: [3, 3, 8, 8],
      formula,
    }).ok).toBe(true);
  });

  it('returns null for an unsolvable digit set', () => {
    expect(getAnyBasic24Solution([1, 1, 1, 1])).toBeNull();
  });
});
