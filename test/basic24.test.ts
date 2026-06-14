import { describe, expect, it } from 'vitest';
import { validateBasic24Formula } from '../src/basic24.js';

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
