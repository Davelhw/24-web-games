import { describe, expect, it } from 'vitest';
import { getUsedDigitIndexes } from '../src/basic24-ui.js';

describe('getUsedDigitIndexes', () => {
  it('marks duplicate digits in order and ignores non-digit characters', () => {
    const digits = [2, 3, 6, 6] as const;

    expect(getUsedDigitIndexes(digits, '2*(3+6)')).toEqual(new Set([0, 1, 2]));
    expect(getUsedDigitIndexes(digits, '2*(3+6)+6')).toEqual(new Set([0, 1, 2, 3]));
    expect(getUsedDigitIndexes(digits, '2*(3+6)   ')).toEqual(new Set([0, 1, 2]));
  });

  it('treats multi-digit formula numbers as individual digits', () => {
    const digits = [1, 1, 2, 3] as const;

    expect(getUsedDigitIndexes(digits, '1+1+2+20')).toEqual(new Set([0, 1, 2]));
  });
});
