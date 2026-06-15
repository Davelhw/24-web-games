import type { ChallengeDigits } from './basic24-ui.js';

export type Basic24HistoryItem = {
  id: string;
  createdAt: string;
  digits: ChallengeDigits;
  formula: string;
  ok: boolean;
  value: number | null;
  error: string | null;
};

export type Basic24HistoryStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const BASIC24_HISTORY_STORAGE_KEY = 'basic24.history.v1';
const MAX_HISTORY_ITEMS = 20;

let fallbackHistory: Basic24HistoryItem[] = [];

export function getBasic24History(storage: Basic24HistoryStorage | null = getHistoryStorage()): Basic24HistoryItem[] {
  const rawHistory = readHistory(storage);

  if (storage === null) {
    return [...fallbackHistory];
  }

  return rawHistory;
}

export function addBasic24HistoryItem(
  item: Omit<Basic24HistoryItem, 'id' | 'createdAt'>,
  storage: Basic24HistoryStorage | null = getHistoryStorage(),
): Basic24HistoryItem[] {
  const nextItem: Basic24HistoryItem = {
    ...item,
    id: createHistoryId(),
    createdAt: new Date().toISOString(),
  };

  const currentHistory = storage === null ? [...fallbackHistory] : readHistory(storage);
  const nextHistory = [nextItem, ...currentHistory].slice(0, MAX_HISTORY_ITEMS);

  if (storage === null) {
    fallbackHistory = nextHistory;
    return [...nextHistory];
  }

  writeHistory(storage, nextHistory);

  return nextHistory;
}

export function clearBasic24History(storage: Basic24HistoryStorage | null = getHistoryStorage()): void {
  fallbackHistory = [];

  if (storage === null) {
    return;
  }

  try {
    storage.removeItem(BASIC24_HISTORY_STORAGE_KEY);
  } catch {
    return;
  }
}

function readHistory(storage: Basic24HistoryStorage | null): Basic24HistoryItem[] {
  if (storage === null) {
    return [...fallbackHistory];
  }

  let rawValue: string | null = null;

  try {
    rawValue = storage.getItem(BASIC24_HISTORY_STORAGE_KEY);
  } catch {
    return [...fallbackHistory];
  }

  if (rawValue === null) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue);

    if (!Array.isArray(parsed)) {
      return [];
    }

    const items: Basic24HistoryItem[] = [];

    for (const entry of parsed) {
      const item = normalizeHistoryItem(entry);

      if (item !== null) {
        items.push(item);
      }
    }

    return items.slice(0, MAX_HISTORY_ITEMS);
  } catch {
    return [];
  }
}

function writeHistory(storage: Basic24HistoryStorage, items: readonly Basic24HistoryItem[]): void {
  try {
    storage.setItem(BASIC24_HISTORY_STORAGE_KEY, JSON.stringify(items));
  } catch {
    fallbackHistory = [...items];
  }
}

function normalizeHistoryItem(value: unknown): Basic24HistoryItem | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const candidate = value as Partial<Basic24HistoryItem>;

  if (
    typeof candidate.id !== 'string' ||
    typeof candidate.createdAt !== 'string' ||
    !isChallengeDigits(candidate.digits) ||
    typeof candidate.formula !== 'string' ||
    typeof candidate.ok !== 'boolean' ||
    (candidate.value !== null && typeof candidate.value !== 'number') ||
    (candidate.error !== null && typeof candidate.error !== 'string')
  ) {
    return null;
  }

  return {
    id: candidate.id,
    createdAt: candidate.createdAt,
    digits: candidate.digits,
    formula: candidate.formula,
    ok: candidate.ok,
    value: candidate.value,
    error: candidate.error,
  };
}

function isChallengeDigits(value: unknown): value is ChallengeDigits {
  return (
    Array.isArray(value) &&
    value.length === 4 &&
    value.every((digit) => Number.isInteger(digit) && digit >= 0 && digit <= 9)
  );
}

function getHistoryStorage(): Basic24HistoryStorage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function createHistoryId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
