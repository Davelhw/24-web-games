export type Basic24ValidationInput = {
  digits: readonly number[];
  formula: string;
};

export type Basic24ValidationResult =
  | {
      ok: true;
      value: number;
      usedDigits: number[];
      error: null;
    }
  | {
      ok: false;
      value: null;
      usedDigits: number[];
      error: string;
    };

type Token =
  | {
      type: 'number';
      value: number;
    }
  | {
      type: 'operator';
      value: '+' | '-' | '*' | '/';
    }
  | {
      type: 'leftParen';
      value: '(';
    }
  | {
      type: 'rightParen';
      value: ')';
    };

const EPSILON = 1e-10;

export function validateBasic24Formula(input: Basic24ValidationInput): Basic24ValidationResult {
  const digitValidationError = validateDigits(input.digits);

  if (digitValidationError !== null) {
    return fail(digitValidationError);
  }

  const tokenResult = tokenize(input.formula);

  if (!tokenResult.ok) {
    return fail(tokenResult.error, tokenResult.usedDigits);
  }

  const usedDigitValidationError = validateUsedDigits(input.digits, tokenResult.usedDigits);

  if (usedDigitValidationError !== null) {
    return fail(usedDigitValidationError, tokenResult.usedDigits);
  }

  const parser = new FormulaParser(tokenResult.tokens);
  const parseResult = parser.parse();

  if (!parseResult.ok) {
    return fail(parseResult.error, tokenResult.usedDigits);
  }

  if (!isNearlyEqual(parseResult.value, 24)) {
    return {
      ok: false,
      value: null,
      usedDigits: tokenResult.usedDigits,
      error: `Formula equals ${formatNumber(parseResult.value)}, not 24.`,
    };
  }

  return {
    ok: true,
    value: 24,
    usedDigits: tokenResult.usedDigits,
    error: null,
  };
}

function validateDigits(digits: readonly number[]): string | null {
  if (digits.length !== 4) {
    return 'Exactly four digits are required.';
  }

  for (const digit of digits) {
    if (!Number.isInteger(digit) || digit < 0 || digit > 9) {
      return 'Digits must be integers from 0 to 9.';
    }
  }

  return null;
}

function tokenize(formula: string):
  | {
      ok: true;
      tokens: Token[];
      usedDigits: number[];
    }
  | {
      ok: false;
      usedDigits: number[];
      error: string;
    } {
  const tokens: Token[] = [];
  const usedDigits: number[] = [];

  let index = 0;

  while (index < formula.length) {
    const char = formula[index];

    if (char === undefined) {
      break;
    }

    if (/\s/.test(char)) {
      index += 1;
      continue;
    }

    if (isDigitChar(char)) {
      const digit = Number(char);

      tokens.push({
        type: 'number',
        value: digit,
      });

      usedDigits.push(digit);
      index += 1;
      continue;
    }

    if (isOperatorChar(char)) {
      tokens.push({
        type: 'operator',
        value: char,
      });

      index += 1;
      continue;
    }

    if (char === '(') {
      tokens.push({
        type: 'leftParen',
        value: char,
      });

      index += 1;
      continue;
    }

    if (char === ')') {
      tokens.push({
        type: 'rightParen',
        value: char,
      });

      index += 1;
      continue;
    }

    return {
      ok: false,
      usedDigits,
      error: `Invalid character "${char}". Only digits, +, -, *, /, brackets, and spaces are allowed.`,
    };
  }

  if (tokens.length === 0) {
    return {
      ok: false,
      usedDigits,
      error: 'Formula is required.',
    };
  }

  return {
    ok: true,
    tokens,
    usedDigits,
  };
}

function validateUsedDigits(
  expectedDigits: readonly number[],
  usedDigits: readonly number[],
): string | null {
  if (usedDigits.length !== expectedDigits.length) {
    return 'Formula must use every given digit exactly once.';
  }

  const expectedCounts = countDigits(expectedDigits);
  const usedCounts = countDigits(usedDigits);

  for (let digit = 0; digit <= 9; digit += 1) {
    if ((expectedCounts[digit] ?? 0) !== (usedCounts[digit] ?? 0)) {
      return 'Formula must use every given digit exactly once.';
    }
  }

  return null;
}

function countDigits(digits: readonly number[]): number[] {
  const counts = Array.from({ length: 10 }, () => 0);

  for (const digit of digits) {
    counts[digit] = (counts[digit] ?? 0) + 1;
  }

  return counts;
}

class FormulaParser {
  private currentIndex = 0;

  public constructor(private readonly tokens: readonly Token[]) {}

  public parse():
    | {
        ok: true;
        value: number;
      }
    | {
        ok: false;
        error: string;
      } {
    const result = this.parseExpression();

    if (!result.ok) {
      return result;
    }

    if (!this.isEnd()) {
      return {
        ok: false,
        error: 'Invalid formula syntax.',
      };
    }

    return result;
  }

  private parseExpression():
    | {
        ok: true;
        value: number;
      }
    | {
        ok: false;
        error: string;
      } {
    let left = this.parseTerm();

    if (!left.ok) {
      return left;
    }

    while (this.matchOperator('+') || this.matchOperator('-')) {
      const operator = this.previous();

      if (operator?.type !== 'operator') {
        return {
          ok: false,
          error: 'Invalid formula syntax.',
        };
      }

      const right = this.parseTerm();

      if (!right.ok) {
        return right;
      }

      if (operator.value === '+') {
        left = {
          ok: true,
          value: left.value + right.value,
        };
      } else {
        left = {
          ok: true,
          value: left.value - right.value,
        };
      }
    }

    return left;
  }

  private parseTerm():
    | {
        ok: true;
        value: number;
      }
    | {
        ok: false;
        error: string;
      } {
    let left = this.parseFactor();

    if (!left.ok) {
      return left;
    }

    while (this.matchOperator('*') || this.matchOperator('/')) {
      const operator = this.previous();

      if (operator?.type !== 'operator') {
        return {
          ok: false,
          error: 'Invalid formula syntax.',
        };
      }

      const right = this.parseFactor();

      if (!right.ok) {
        return right;
      }

      if (operator.value === '*') {
        left = {
          ok: true,
          value: left.value * right.value,
        };
      } else {
        if (isNearlyEqual(right.value, 0)) {
          return {
            ok: false,
            error: 'Division by zero is not allowed.',
          };
        }

        left = {
          ok: true,
          value: left.value / right.value,
        };
      }
    }

    return left;
  }

  private parseFactor():
    | {
        ok: true;
        value: number;
      }
    | {
        ok: false;
        error: string;
      } {
    if (this.matchType('number')) {
      const token = this.previous();

      if (token?.type !== 'number') {
        return {
          ok: false,
          error: 'Invalid formula syntax.',
        };
      }

      return {
        ok: true,
        value: token.value,
      };
    }

    if (this.matchType('leftParen')) {
      const expression = this.parseExpression();

      if (!expression.ok) {
        return expression;
      }

      if (!this.matchType('rightParen')) {
        return {
          ok: false,
          error: 'Missing closing bracket.',
        };
      }

      return expression;
    }

    return {
      ok: false,
      error: 'Invalid formula syntax.',
    };
  }

  private matchOperator(operator: '+' | '-' | '*' | '/'): boolean {
    const token = this.peek();

    if (token?.type !== 'operator' || token.value !== operator) {
      return false;
    }

    this.currentIndex += 1;
    return true;
  }

  private matchType(type: Token['type']): boolean {
    const token = this.peek();

    if (token?.type !== type) {
      return false;
    }

    this.currentIndex += 1;
    return true;
  }

  private previous(): Token | undefined {
    return this.tokens[this.currentIndex - 1];
  }

  private peek(): Token | undefined {
    return this.tokens[this.currentIndex];
  }

  private isEnd(): boolean {
    return this.currentIndex >= this.tokens.length;
  }
}

function isDigitChar(char: string): boolean {
  return /^[0-9]$/.test(char);
}

function isOperatorChar(char: string): char is '+' | '-' | '*' | '/' {
  return char === '+' || char === '-' || char === '*' || char === '/';
}

function isNearlyEqual(left: number, right: number): boolean {
  return Math.abs(left - right) < EPSILON;
}

function formatNumber(value: number): string {
  if (Number.isInteger(value)) {
    return String(value);
  }

  return Number(value.toFixed(10)).toString();
}

function fail(error: string, usedDigits: number[] = []): Basic24ValidationResult {
  return {
    ok: false,
    value: null,
    usedDigits,
    error,
  };
}
