import { explainBasic24Formula, getAnyBasic24Solution } from './basic24.js';
import './styles.css';

type ChallengeDigits = readonly [number, number, number, number];
const RANDOM_CHALLENGE_MAX_ATTEMPTS = 200;
const FALLBACK_CHALLENGE: ChallengeDigits = [2, 4, 6, 8];

const app = document.querySelector<HTMLDivElement>('#app');

if (app === null) {
  throw new Error('App root element not found.');
}

app.innerHTML = `
  <main class="shell">
    <section class="hero">
      <p class="eyebrow">Basic 24 game</p>
      <h1>24 Game</h1>
      <p class="lead">
        Use all four digits exactly once with arithmetic and brackets to make 24.
      </p>
    </section>

    <section class="panel" aria-labelledby="instructions-title">
      <div class="panel-header">
        <div>
          <p class="panel-kicker">How to play</p>
          <h2 id="instructions-title">Instructions</h2>
        </div>
      </div>

      <ul class="instructions">
        <li>Use all 4 digits exactly once.</li>
        <li>Allowed operators: +, -, *, /</li>
        <li>Brackets are allowed.</li>
        <li>Target result is 24.</li>
      </ul>
    </section>

    <section class="panel challenge-panel" aria-labelledby="challenge-title">
      <div class="panel-header">
        <div>
          <p class="panel-kicker">Challenge</p>
          <h2 id="challenge-title">Current digits</h2>
        </div>
        <button class="ghost-button" type="button" data-random>Random Challenge</button>
      </div>

      <div class="digit-grid" data-digits aria-label="Current challenge digits"></div>
    </section>

    <section class="panel" aria-labelledby="formula-title">
      <div class="panel-header">
        <div>
          <p class="panel-kicker">Try a formula</p>
          <h2 id="formula-title">Enter your expression</h2>
        </div>
      </div>

      <form class="formula-form" data-form novalidate>
        <label class="formula-label" for="formula-input">Formula</label>
        <input
          id="formula-input"
          name="formula"
          type="text"
          inputmode="text"
          autocomplete="off"
          spellcheck="false"
          placeholder="8*6/(4/2)"
          aria-describedby="formula-hint"
          data-formula
        />
        <p class="hint" id="formula-hint">
          Example: 8*6/(4/2). Spaces are optional.
        </p>

        <div class="button-row">
          <button class="primary-button" type="submit">Validate</button>
          <button class="ghost-button" type="button" data-clear>Clear</button>
        </div>
      </form>
    </section>

    <section class="panel" aria-labelledby="result-title">
      <div class="panel-header">
        <div>
          <p class="panel-kicker">Result</p>
          <h2 id="result-title">Validation feedback</h2>
        </div>
      </div>

      <div class="result result--idle" data-result aria-live="polite" role="status">
        Enter a formula and validate it against the current digits.
      </div>
    </section>

    <section class="panel" aria-labelledby="steps-title">
      <div class="panel-header">
        <div>
          <p class="panel-kicker">Education</p>
          <h2 id="steps-title">Evaluation steps</h2>
        </div>
      </div>

      <ol class="steps" data-steps></ol>
    </section>
  </main>
`;

const digitsContainer = queryRequired<HTMLDivElement>(app, '[data-digits]');
const form = queryRequired<HTMLFormElement>(app, '[data-form]');
const formulaInput = queryRequired<HTMLInputElement>(app, '[data-formula]');
const resultElement = queryRequired<HTMLDivElement>(app, '[data-result]');
const stepsElement = queryRequired<HTMLOListElement>(app, '[data-steps]');
const randomButton = queryRequired<HTMLButtonElement>(app, '[data-random]');
const clearButton = queryRequired<HTMLButtonElement>(app, '[data-clear]');

let challengeDigits: ChallengeDigits = [1, 2, 3, 4];

function queryRequired<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);

  if (element === null) {
    throw new Error(`Missing required element: ${selector}`);
  }

  return element;
}

function createRandomDigits(): ChallengeDigits {
  return [
    randomDigit(),
    randomDigit(),
    randomDigit(),
    randomDigit(),
  ] as const;
}

function randomDigit(): number {
  return Math.floor(Math.random() * 9) + 1;
}

function renderDigits(digits: ChallengeDigits): void {
  digitsContainer.innerHTML = '';

  digits.forEach((digit, index) => {
    const box = document.createElement('div');
    box.className = 'digit-box';
    box.textContent = String(digit);
    box.setAttribute('aria-label', `Digit ${index + 1}: ${digit}`);
    digitsContainer.appendChild(box);
  });
}

function renderResult(state: 'idle' | 'success' | 'error', message: string): void {
  resultElement.className = `result result--${state}`;
  resultElement.textContent = message;
}

function renderSteps(steps: readonly { expression: string; value: number }[]): void {
  stepsElement.innerHTML = '';

  if (steps.length === 0) {
    const item = document.createElement('li');
    item.className = 'steps-empty';
    item.textContent = 'No evaluation steps to show yet.';
    stepsElement.appendChild(item);
    return;
  }

  for (const step of steps) {
    const item = document.createElement('li');
    item.textContent = step.expression;
    stepsElement.appendChild(item);
  }
}

function validateCurrentFormula(): void {
  const result = explainBasic24Formula({
    digits: challengeDigits,
    formula: formulaInput.value.trim(),
  });

  renderSteps(result.steps);

  if (result.ok) {
    renderResult('success', 'Correct! This makes 24.');
    return;
  }

  renderResult('error', `Not quite yet. ${result.error}`);
}

function clearFormula(): void {
  formulaInput.value = '';
  renderResult('idle', 'Enter a formula and validate it against the current digits.');
  renderSteps([]);
  formulaInput.focus();
}

function setChallengeDigits(digits: ChallengeDigits): void {
  challengeDigits = digits;
  renderDigits(challengeDigits);
}

function resetChallenge(): void {
  setChallengeDigits(createSolvableChallenge());
  clearFormula();
}

function createSolvableChallenge(): ChallengeDigits {
  for (let attempt = 0; attempt < RANDOM_CHALLENGE_MAX_ATTEMPTS; attempt += 1) {
    const digits = createRandomDigits();

    if (getAnyBasic24Solution(digits) !== null) {
      return digits;
    }
  }

  return FALLBACK_CHALLENGE;
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  validateCurrentFormula();
});

randomButton.addEventListener('click', () => {
  resetChallenge();
});

clearButton.addEventListener('click', () => {
  clearFormula();
});

formulaInput.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter') {
    return;
  }

  event.preventDefault();
  validateCurrentFormula();
});

setChallengeDigits(createSolvableChallenge());
renderResult('idle', 'Enter a formula and validate it against the current digits.');
renderSteps([]);
