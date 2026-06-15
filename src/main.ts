import { explainBasic24Formula, getAnyBasic24Solution } from './basic24.js';
import {
  addBasic24HistoryItem,
  clearBasic24History,
  getBasic24History,
  type Basic24HistoryItem,
} from './basic24-history.js';
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
        <li>After 3 failed attempts, you can reveal one solution.</li>
        <li>Use New Challenge to get another solvable set.</li>
      </ul>
    </section>

    <section class="panel challenge-panel" aria-labelledby="challenge-title">
      <div class="panel-header">
        <div>
          <p class="panel-kicker">Challenge</p>
          <h2 id="challenge-title">Current digits</h2>
        </div>
        <button class="ghost-button" type="button" data-new-challenge>New Challenge</button>
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
          <button class="ghost-button" type="button" data-show-solution>Show Solution (3)</button>
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

    <section class="panel" aria-labelledby="history-title">
      <div class="panel-header">
        <div>
          <p class="panel-kicker">History</p>
          <h2 id="history-title">Previous attempts</h2>
        </div>
        <button class="ghost-button danger-ghost" type="button" data-clear-history>
          Clear History
        </button>
      </div>

      <div class="history-list" data-history-list></div>
    </section>
  </main>
`;

const digitsContainer = queryRequired<HTMLDivElement>(app, '[data-digits]');
const form = queryRequired<HTMLFormElement>(app, '[data-form]');
const formulaInput = queryRequired<HTMLInputElement>(app, '[data-formula]');
const resultElement = queryRequired<HTMLDivElement>(app, '[data-result]');
const solutionElement = queryRequired<HTMLDivElement>(app, '[data-solution]');
const stepsElement = queryRequired<HTMLOListElement>(app, '[data-steps]');
const historyListElement = queryRequired<HTMLDivElement>(app, '[data-history-list]');
const newChallengeButton = queryRequired<HTMLButtonElement>(app, '[data-new-challenge]');
const clearButton = queryRequired<HTMLButtonElement>(app, '[data-clear]');
const clearHistoryButton = queryRequired<HTMLButtonElement>(app, '[data-clear-history]');
const showSolutionButton = queryRequired<HTMLButtonElement>(app, '[data-show-solution]');

let challengeDigits: ChallengeDigits = [1, 2, 3, 4];
let failedAttempts = 0;
let historyItems: Basic24HistoryItem[] = getBasic24History();
let currentChallengeSolved = false;

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

function renderHistory(items: readonly Basic24HistoryItem[]): void {
  historyListElement.innerHTML = '';

  if (items.length === 0) {
    const emptyState = document.createElement('p');
    emptyState.className = 'history-empty';
    emptyState.textContent = 'No attempts yet.';
    historyListElement.appendChild(emptyState);
    return;
  }

  for (const item of items) {
    const row = document.createElement('article');
    row.className = 'history-item';

    const details = document.createElement('div');
    details.className = 'history-details';

    const topLine = document.createElement('div');
    topLine.className = 'history-topline';

    const digits = document.createElement('p');
    digits.className = 'history-digits';
    digits.textContent = item.digits.join(' ');
    digits.setAttribute('aria-label', `Digits: ${item.digits.join(' ')}`);

    const status = document.createElement('span');
    status.className = item.ok ? 'history-status history-status--success' : 'history-status history-status--error';
    status.textContent = item.ok ? 'Correct' : 'Not quite';

    topLine.append(digits, status);

    const formula = document.createElement('p');
    formula.className = 'history-formula';
    formula.textContent = item.formula;

    const timestamp = document.createElement('p');
    timestamp.className = 'history-time';
    timestamp.textContent = new Date(item.createdAt).toLocaleString();

    details.append(topLine, formula, timestamp);

    if (!item.ok && item.error !== null) {
      const error = document.createElement('p');
      error.className = 'history-error';
      error.textContent = item.error;
      details.append(error);
    }

    const actions = document.createElement('div');
    actions.className = 'history-actions';

    const viewSolutionButton = document.createElement('button');
    viewSolutionButton.className = 'ghost-button history-action-button';
    viewSolutionButton.type = 'button';
    viewSolutionButton.textContent = 'View Solution';
    viewSolutionButton.addEventListener('click', () => {
      revealSolutionForDigits(item.digits, 'Showing one solution from history.');
    });

    actions.append(viewSolutionButton);
    row.append(details, actions);
    historyListElement.appendChild(row);
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
  const remainingAttempts = Math.max(FAILED_ATTEMPTS_TO_SHOW_SOLUTION - failedAttempts, 0);

  if (remainingAttempts > 0) {
    showSolutionButton.textContent = `Show Solution (${remainingAttempts})`;
    showSolutionButton.disabled = true;
    return;
  }

  showSolutionButton.textContent = 'Show Solution';
  showSolutionButton.disabled = false;
}

function updateHistoryState(): void {
  renderHistory(historyItems);
}

function saveHistoryAttempt(result: ReturnType<typeof explainBasic24Formula>, formula: string): void {
  if (formula.length === 0) {
    return;
  }

  historyItems = addBasic24HistoryItem({
    digits: challengeDigits,
    formula,
    ok: result.ok,
    value: result.ok ? result.value : null,
    error: result.ok ? null : result.error,
  });

  updateHistoryState();
}

function revealSolutionForDigits(digits: ChallengeDigits, statusMessage: string): void {
  const solution = getAnyBasic24Solution(digits);

  if (solution === null) {
    showSolutionReveal('No solution is available for this history item.');
    renderResult('idle', 'No solution is available for this history item.');
    renderSteps([]);
    return;
  }

  const explanation = explainBasic24Formula({
    digits,
    formula: solution,
  });

  showSolutionReveal(`One solution: ${solution}`);
  renderSteps(explanation.steps);

  if (explanation.ok) {
    renderResult('success', statusMessage);
    return;
  }

  renderResult('error', `Solution lookup failed. ${explanation.error}`);
}

function validateCurrentFormula(): void {
  const formula = formulaInput.value.trim();
  const result = explainBasic24Formula({
    digits: challengeDigits,
    formula,
  });

  renderSteps(result.steps);

  if (result.ok) {
    currentChallengeSolved = true;
    failedAttempts = 0;
    hideSolutionReveal();
    updateShowSolutionButton();
    renderResult('success', 'Correct! This makes 24.');
    saveHistoryAttempt(result, formula);
    return;
  }

  if (formula.length > 0) {
    currentChallengeSolved = false;
    failedAttempts += 1;
  }

  updateShowSolutionButton();
  renderResult('error', `Not quite yet. ${result.error}`);
  saveHistoryAttempt(result, formula);
}

function clearFormula(): void {
  formulaInput.value = '';
  failedAttempts = 0;
  currentChallengeSolved = false;
  updateShowSolutionButton();
  hideSolutionReveal();
  renderResult('idle', 'Enter a formula and validate it against the current digits.');
  renderSteps([]);
  updateUsedDigitState();
  formulaInput.focus();
}

function setChallengeDigits(digits: ChallengeDigits): void {
  challengeDigits = digits;
  currentChallengeSolved = false;
  updateUsedDigitState();
}

function revealSolution(): void {
  revealSolutionForDigits(challengeDigits, 'Solution revealed.');
}

function startNewChallenge(): void {
  setChallengeDigits(createSolvableChallenge());
  clearFormula();
}

function handleNewChallengeClick(): void {
  const formula = formulaInput.value.trim();

  if (formula.length > 0 && !currentChallengeSolved) {
    const shouldStartNewChallenge = window.confirm(
      'Start a new challenge? Your current attempt is not solved yet.',
    );

    if (!shouldStartNewChallenge) {
      return;
    }
  }

  startNewChallenge();
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

newChallengeButton.addEventListener('click', () => {
  handleNewChallengeClick();
});

clearButton.addEventListener('click', () => {
  clearFormula();
});

clearHistoryButton.addEventListener('click', () => {
  clearBasic24History();
  historyItems = [];
  updateHistoryState();
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
updateHistoryState();
