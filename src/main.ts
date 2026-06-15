import { explainBasic24Formula, getAnyBasic24Solution } from './basic24.js';
import { getUsedDigitIndexes, type ChallengeDigits } from './basic24-ui.js';
import './styles.css';

const RANDOM_CHALLENGE_MAX_ATTEMPTS = 200;
const FALLBACK_CHALLENGE: ChallengeDigits = [2, 4, 6, 8];
const FAILED_ATTEMPTS_TO_SHOW_SOLUTION = 3;

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
          <button class="ghost-button" type="button" data-show-solution hidden>Show Solution</button>
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

      <div class="solution" data-solution hidden></div>
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
const solutionElement = queryRequired<HTMLDivElement>(app, '[data-solution]');
const stepsElement = queryRequired<HTMLOListElement>(app, '[data-steps]');
const randomButton = queryRequired<HTMLButtonElement>(app, '[data-random]');
const clearButton = queryRequired<HTMLButtonElement>(app, '[data-clear]');
const showSolutionButton = queryRequired<HTMLButtonElement>(app, '[data-show-solution]');

let challengeDigits: ChallengeDigits = [1, 2, 3, 4];
let failedAttempts = 0;

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

function renderDigits(digits: ChallengeDigits, usedIndexes: Set<number>): void {
  digitsContainer.innerHTML = '';

  digits.forEach((digit, index) => {
    const box = document.createElement('div');
    const used = usedIndexes.has(index);

    box.className = used ? 'digit-box digit-box--used' : 'digit-box';
    box.textContent = String(digit);
    box.setAttribute('aria-label', `Digit ${index + 1}: ${digit} ${used ? 'used' : 'unused'}`);
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

function updateUsedDigitState(): void {
  renderDigits(challengeDigits, getUsedDigitIndexes(challengeDigits, formulaInput.value));
}

function hideSolutionReveal(): void {
  solutionElement.hidden = true;
  solutionElement.textContent = '';
}

function showSolutionReveal(message: string): void {
  solutionElement.hidden = false;
  solutionElement.textContent = message;
}

function updateShowSolutionButton(): void {
  showSolutionButton.hidden = failedAttempts < FAILED_ATTEMPTS_TO_SHOW_SOLUTION;
}

function validateCurrentFormula(): void {
  const formula = formulaInput.value.trim();
  const result = explainBasic24Formula({
    digits: challengeDigits,
    formula,
  });

  renderSteps(result.steps);

  if (result.ok) {
    renderResult('success', 'Correct! This makes 24.');
    return;
  }

  if (formula.length > 0) {
    failedAttempts += 1;
    updateShowSolutionButton();
  }

  renderResult('error', `Not quite yet. ${result.error}`);
}

function clearFormula(): void {
  formulaInput.value = '';
  failedAttempts = 0;
  updateShowSolutionButton();
  hideSolutionReveal();
  renderResult('idle', 'Enter a formula and validate it against the current digits.');
  renderSteps([]);
  updateUsedDigitState();
  formulaInput.focus();
}

function setChallengeDigits(digits: ChallengeDigits): void {
  challengeDigits = digits;
  updateUsedDigitState();
}

function resetChallenge(): void {
  setChallengeDigits(createSolvableChallenge());
  clearFormula();
}

function revealSolution(): void {
  const solution = getAnyBasic24Solution(challengeDigits);

  if (solution === null) {
    showSolutionReveal('No solution is available for this challenge.');
    renderResult('idle', 'No solution is available for this challenge.');
    renderSteps([]);
    return;
  }

  const explanation = explainBasic24Formula({
    digits: challengeDigits,
    formula: solution,
  });

  showSolutionReveal(`One solution: ${solution}`);
  renderSteps(explanation.steps);

  if (explanation.ok) {
    renderResult('success', 'Solution revealed.');
    return;
  }

  renderResult('error', `Solution lookup failed. ${explanation.error}`);
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

showSolutionButton.addEventListener('click', () => {
  revealSolution();
});

formulaInput.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter') {
    return;
  }

  event.preventDefault();
  validateCurrentFormula();
});

formulaInput.addEventListener('input', () => {
  updateUsedDigitState();
});

setChallengeDigits(createSolvableChallenge());
renderResult('idle', 'Enter a formula and validate it against the current digits.');
renderSteps([]);
updateShowSolutionButton();
hideSolutionReveal();
