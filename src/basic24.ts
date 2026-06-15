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

export type Basic24EvaluationStep = {
  expression: string;
  value: number;
};

export type Basic24ExplanationResult =
  | {
      ok: true;
      value: number;
      usedDigits: number[];
      steps: Basic24EvaluationStep[];
      error: null;
    }
  | {
      ok: false;
      value: null;
      usedDigits: number[];
      steps: Basic24EvaluationStep[];
      error: string;
    };

type FormulaParseResult =
  | {
      ok: true;
      value: number;
      display: string;
      steps: Basic24EvaluationStep[];
    }
  | {
      ok: false;
      steps: Basic24EvaluationStep[];
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
  const result = explainBasic24Formula(input);

  if (!result.ok) {
    return {
      ok: false,
      value: null,
      usedDigits: result.usedDigits,
      error: result.error,
    };
  }

  return {
    ok: true,
    value: result.value,
    usedDigits: result.usedDigits,
    error: null,
  };
}

export function explainBasic24Formula(input: Basic24ValidationInput): Basic24ExplanationResult {
  const digitValidationError = validateDigits(input.digits);

  if (digitValidationError !== null) {
    return failWithSteps(digitValidationError);
  }

  const tokenResult = tokenize(input.formula);

  if (!tokenResult.ok) {
    return failWithSteps(tokenResult.error, tokenResult.usedDigits);
  }

  const usedDigitValidationError = validateUsedDigits(input.digits, tokenResult.usedDigits);

  if (usedDigitValidationError !== null) {
    return failWithSteps(usedDigitValidationError, tokenResult.usedDigits);
  }

  const parser = new FormulaParser(tokenResult.tokens);
  const parseResult = parser.parse();

  if (!parseResult.ok) {
    return failWithSteps(parseResult.error, tokenResult.usedDigits, parseResult.steps);
  }

  if (!isNearlyEqual(parseResult.value, 24)) {
    return {
      ok: false,
      value: null,
      usedDigits: tokenResult.usedDigits,
      steps: parseResult.steps,
      error: `Formula equals ${formatNumber(parseResult.value)}, not 24.`,
    };
  }

  return {
    ok: true,
    value: 24,
    usedDigits: tokenResult.usedDigits,
    steps: parseResult.steps,
    error: null,
  };
}

export function getAnyBasic24Solution(digits: readonly number[]): string | null {
  if (validateDigits(digits) !== null) {
    return null;
  }

  const items: SolverItem[] = digits.map((digit) => ({
    value: digit,
    expression: formatNumber(digit),
  }));

  return solveBasic24(items);
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

type SolverItem = {
  value: number;
  expression: string;
};

function solveBasic24(items: readonly SolverItem[]): string | null {
  if (items.length === 1) {
    return isNearlyEqual(items[0]?.value ?? Number.NaN, 24) ? (items[0]?.expression ?? null) : null;
  }

  for (let leftIndex = 0; leftIndex < items.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < items.length; rightIndex += 1) {
      const left = items[leftIndex];
      const right = items[rightIndex];

      if (left === undefined || right === undefined) {
        continue;
      }

      const remaining = items.filter((_, index) => index !== leftIndex && index !== rightIndex);
      const candidates = combineSolverItems(left, right);

      for (const candidate of candidates) {
        const solution = solveBasic24([...remaining, candidate]);

        if (solution !== null) {
          return solution;
        }
      }
    }
  }

  return null;
}

function combineSolverItems(left: SolverItem, right: SolverItem): SolverItem[] {
  const results: SolverItem[] = [
    {
      value: left.value + right.value,
      expression: `(${left.expression} + ${right.expression})`,
    },
    {
      value: left.value - right.value,
      expression: `(${left.expression} - ${right.expression})`,
    },
    {
      value: right.value - left.value,
      expression: `(${right.expression} - ${left.expression})`,
    },
    {
      value: left.value * right.value,
      expression: `(${left.expression} * ${right.expression})`,
    },
  ];

  if (!isNearlyEqual(right.value, 0)) {
    results.push({
      value: left.value / right.value,
      expression: `(${left.expression} / ${right.expression})`,
    });
  }

  if (!isNearlyEqual(left.value, 0)) {
    results.push({
      value: right.value / left.value,
      expression: `(${right.expression} / ${left.expression})`,
    });
  }

  return results;
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

  public parse(): FormulaParseResult {
    const result = this.parseExpression();

    if (!result.ok) {
      return result;
    }

    if (!this.isEnd()) {
      return {
        ok: false,
        steps: result.steps,
        error: 'Invalid formula syntax.',
      };
    }

    return result;
  }

  private parseExpression(): FormulaParseResult {
    let left = this.parseTerm();

    if (!left.ok) {
      return left;
    }

    while (this.matchOperator('+') || this.matchOperator('-')) {
      const operator = this.previous();

      if (operator?.type !== 'operator') {
        return {
          ok: false,
          steps: left.steps,
          error: 'Invalid formula syntax.',
        };
      }

      const right = this.parseTerm();

      if (!right.ok) {
        return {
          ...right,
          steps: [...left.steps, ...right.steps],
        };
      }

      const value: number =
        operator.value === '+' ? left.value + right.value : left.value - right.value;

      const step = createEvaluationStep(left.display, operator.value, right.display, value);

      left = {
        ok: true,
        value,
        display: formatNumber(value),
        steps: [...left.steps, ...right.steps, step],
      };
    }

    return left;
  }

  private parseTerm(): FormulaParseResult {
    let left = this.parseFactor();

    if (!left.ok) {
      return left;
    }

    while (this.matchOperator('*') || this.matchOperator('/')) {
      const operator = this.previous();

      if (operator?.type !== 'operator') {
        return {
          ok: false,
          steps: left.steps,
          error: 'Invalid formula syntax.',
        };
      }

      const right = this.parseFactor();

      if (!right.ok) {
        return {
          ...right,
          steps: [...left.steps, ...right.steps],
        };
      }

      if (operator.value === '*') {
        const value: number = left.value * right.value;

        const step = createEvaluationStep(left.display, operator.value, right.display, value);

        left = {
          ok: true,
          value,
          display: formatNumber(value),
          steps: [...left.steps, ...right.steps, step],
        };

        continue;
      }

      if (isNearlyEqual(right.value, 0)) {
        return {
          ok: false,
          steps: [...left.steps, ...right.steps],
          error: 'Division by zero is not allowed.',
        };
      }

      const value: number = left.value / right.value;

      const step = createEvaluationStep(left.display, operator.value, right.display, value);

      left = {
        ok: true,
        value,
        display: formatNumber(value),
        steps: [...left.steps, ...right.steps, step],
      };
    }

    return left;
  }

  private parseFactor(): FormulaParseResult {
    if (this.matchType('number')) {
      const token = this.previous();

      if (token?.type !== 'number') {
        return {
          ok: false,
          steps: [],
          error: 'Invalid formula syntax.',
        };
      }

      return {
        ok: true,
        value: token.value,
        display: formatNumber(token.value),
        steps: [],
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
          steps: expression.steps,
          error: 'Missing closing bracket.',
        };
      }

      return {
        ok: true,
        value: expression.value,
        display: formatNumber(expression.value),
        steps: expression.steps,
      };
    }

    return {
      ok: false,
      steps: [],
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

function createEvaluationStep(
  left: string,
  operator: '+' | '-' | '*' | '/',
  right: string,
  value: number,
): Basic24EvaluationStep {
  return {
    expression: `${left} ${operator} ${right} = ${formatNumber(value)}`,
    value,
  };
}

function failWithSteps(
  error: string,
  usedDigits: number[] = [],
  steps: Basic24EvaluationStep[] = [],
): Basic24ExplanationResult {
  return {
    ok: false,
    value: null,
    usedDigits,
    steps,
    error,
  };
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
