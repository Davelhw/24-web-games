import { explainBasic24Formula } from './basic24.js';
import './styles.css';

type ChallengeDigits = readonly [number, number, number, number];

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
        Use the four digits exactly once with <strong>+</strong>, <strong>-</strong>,
        <strong>*</strong>, <strong>/</strong>, and brackets to make 24.
      </p>
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
          data-formula
        />

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

      <p class="result result--idle" data-result>
        Enter a formula and validate it against the current digits.
      </p>
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
const resultElement = queryRequired<HTMLParagraphElement>(app, '[data-result]');
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
  const formula = formulaInput.value.trim();
  const result = explainBasic24Formula({
    digits: challengeDigits,
    formula,
  });

  renderSteps(result.steps);

  if (result.ok) {
    renderResult('success', `Correct. ${formula} makes 24 with these digits.`);
    return;
  }

  renderResult('error', result.error);
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
  setChallengeDigits(createRandomDigits());
  clearFormula();
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

setChallengeDigits(createRandomDigits());
renderResult('idle', 'Enter a formula and validate it against the current digits.');
renderSteps([]);

