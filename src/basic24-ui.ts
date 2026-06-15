export type ChallengeDigits = readonly [number, number, number, number];

export function getUsedDigitIndexes(digits: ChallengeDigits, formula: string): Set<number> {
  const remainingCounts = Array.from({ length: 10 }, () => 0);

  for (const char of formula.match(/[0-9]/g) ?? []) {
    const digit = Number(char);
    remainingCounts[digit] = (remainingCounts[digit] ?? 0) + 1;
  }

  const usedIndexes = new Set<number>();

  digits.forEach((digit, index) => {
    if ((remainingCounts[digit] ?? 0) <= 0) {
      return;
    }

    usedIndexes.add(index);
    remainingCounts[digit] = (remainingCounts[digit] ?? 0) - 1;
  });

  return usedIndexes;
}
