import { describe, expect, it } from 'vitest';
import {
  addBasic24HistoryItem,
  clearBasic24History,
  getBasic24History,
  type Basic24HistoryStorage,
} from '../src/basic24-history.js';
import type { ChallengeDigits } from '../src/basic24-ui.js';

function createFakeStorage(initialValue: string | null = null): Basic24HistoryStorage & {
  data: Map<string, string>;
} {
  const data = new Map<string, string>();

  if (initialValue !== null) {
    data.set('basic24.history.v1', initialValue);
  }

  return {
    data,
    getItem(key: string) {
      return data.has(key) ? (data.get(key) ?? null) : null;
    },
    setItem(key: string, value: string) {
      data.set(key, value);
    },
    removeItem(key: string) {
      data.delete(key);
    },
  };
}

const digits: ChallengeDigits = [2, 3, 6, 6];

describe('basic24 history storage', () => {
  it('adds newest history items first', () => {
    const storage = createFakeStorage();

    addBasic24HistoryItem(
      {
        digits,
        formula: '2*(3+6)',
        ok: true,
        value: 24,
        error: null,
        repeatCount: 1,
      },
      storage,
    );

    const history = addBasic24HistoryItem(
      {
        digits,
        formula: '2*(3+6)+6',
        ok: false,
        value: null,
        error: 'Formula equals 30, not 24.',
        repeatCount: 1,
      },
      storage,
    );

    expect(history).toHaveLength(2);
    expect(history[0]?.formula).toBe('2*(3+6)+6');
    expect(history[1]?.formula).toBe('2*(3+6)');
  });

  it('groups consecutive identical attempts into one record', () => {
    const storage = createFakeStorage();

    const firstHistory = addBasic24HistoryItem(
      {
        digits,
        formula: '2*(3+6)',
        ok: true,
        value: 24,
        error: null,
        repeatCount: 1,
      },
      storage,
    );

    const secondHistory = addBasic24HistoryItem(
      {
        digits,
        formula: '2*(3+6)',
        ok: true,
        value: 24,
        error: null,
        repeatCount: 1,
      },
      storage,
    );

    expect(firstHistory).toHaveLength(1);
    expect(secondHistory).toHaveLength(1);
    expect(secondHistory[0]?.repeatCount).toBe(2);
  });

  it('keeps separate records for the same formula with different digits', () => {
    const storage = createFakeStorage();

    addBasic24HistoryItem(
      {
        digits: [2, 3, 6, 6],
        formula: '2*(3+6)',
        ok: true,
        value: 24,
        error: null,
        repeatCount: 1,
      },
      storage,
    );

    const history = addBasic24HistoryItem(
      {
        digits: [2, 4, 6, 6],
        formula: '2*(3+6)',
        ok: false,
        value: null,
        error: 'Formula must use every given digit exactly once.',
        repeatCount: 1,
      },
      storage,
    );

    expect(history).toHaveLength(2);
    expect(history[0]?.repeatCount).toBe(1);
    expect(history[1]?.repeatCount).toBe(1);
  });

  it('keeps separate records for the same digits with different formulas', () => {
    const storage = createFakeStorage();

    addBasic24HistoryItem(
      {
        digits,
        formula: '2*(3+6)',
        ok: true,
        value: 24,
        error: null,
        repeatCount: 1,
      },
      storage,
    );

    const history = addBasic24HistoryItem(
      {
        digits,
        formula: '2*(3+6)+6',
        ok: false,
        value: null,
        error: 'Formula equals 30, not 24.',
        repeatCount: 1,
      },
      storage,
    );

    expect(history).toHaveLength(2);
    expect(history[0]?.formula).toBe('2*(3+6)+6');
    expect(history[1]?.formula).toBe('2*(3+6)');
  });

  it('does not merge repeats after an intervening different attempt', () => {
    const storage = createFakeStorage();

    addBasic24HistoryItem(
      {
        digits,
        formula: '2*(3+6)',
        ok: true,
        value: 24,
        error: null,
        repeatCount: 1,
      },
      storage,
    );

    addBasic24HistoryItem(
      {
        digits,
        formula: '2*(3+6)+6',
        ok: false,
        value: null,
        error: 'Formula equals 30, not 24.',
        repeatCount: 1,
      },
      storage,
    );

    const history = addBasic24HistoryItem(
      {
        digits,
        formula: '2*(3+6)',
        ok: true,
        value: 24,
        error: null,
        repeatCount: 1,
      },
      storage,
    );

    expect(history).toHaveLength(3);
    expect(history[0]?.formula).toBe('2*(3+6)');
    expect(history[0]?.repeatCount).toBe(1);
    expect(history[1]?.formula).toBe('2*(3+6)+6');
    expect(history[2]?.formula).toBe('2*(3+6)');
  });

  it('caps history at 20 items', () => {
    const storage = createFakeStorage();

    let history = [] as Awaited<ReturnType<typeof addBasic24HistoryItem>>;

    for (let index = 0; index < 21; index += 1) {
      history = addBasic24HistoryItem(
        {
          digits,
          formula: `formula-${index}`,
          ok: index % 2 === 0,
          value: index % 2 === 0 ? 24 : null,
          error: index % 2 === 0 ? null : 'Not quite',
          repeatCount: 1,
        },
        storage,
      );
    }

    expect(history).toHaveLength(20);
    expect(history[0]?.formula).toBe('formula-20');
    expect(history[19]?.formula).toBe('formula-1');
  });

  it('returns an empty array for invalid JSON', () => {
    const storage = createFakeStorage('{not valid json');

    expect(getBasic24History(storage)).toEqual([]);
  });

  it('reads old stored items without repeatCount as a single attempt', () => {
    const storage = createFakeStorage(
      JSON.stringify([
        {
          id: 'old-1',
          createdAt: '2024-01-01T00:00:00.000Z',
          digits: [2, 3, 6, 6],
          formula: '2*(3+6)',
          ok: true,
          value: 24,
          error: null,
        },
      ]),
    );

    expect(getBasic24History(storage)[0]?.repeatCount).toBe(1);
  });

  it('clears stored history', () => {
    const storage = createFakeStorage();

    addBasic24HistoryItem(
      {
        digits,
        formula: '2*(3+6)',
        ok: true,
        value: 24,
        error: null,
        repeatCount: 1,
      },
      storage,
    );

    clearBasic24History(storage);

    expect(storage.getItem('basic24.history.v1')).toBeNull();
    expect(getBasic24History(storage)).toEqual([]);
  });
});
