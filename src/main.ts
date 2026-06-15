import {
  explainAdvanced24Formula,
  explainBasic24Formula,
  getAnyAdvanced24Solution,
  getAnyBasic24Solution,
  type Basic24Mode,
} from './basic24.js';
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

      <ul class="instructions" data-instructions></ul>
    </section>

    <section class="panel challenge-panel" aria-labelledby="challenge-title">
      <div class="panel-header">
        <div>
          <p class="panel-kicker">Challenge</p>
          <h2 id="challenge-title">Current digits</h2>
        </div>
        <button class="ghost-button" type="button" data-new-challenge disabled>New Challenge</button>
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

        <div class="mode-row">
          <span class="formula-label">Mode</span>
          <div class="mode-switch" role="group" aria-label="Mode">
            <button class="mode-switch-button" type="button" data-mode-basic>Basic</button>
            <button class="mode-switch-button" type="button" data-mode-advanced>Advanced</button>
          </div>
        </div>

        <div class="keypad-group">
          <span class="formula-label">Operators</span>
          <div class="operator-keypad keypad" data-operator-keypad aria-label="Formula keypad"></div>
        </div>

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

    <dialog class="history-modal" data-history-modal aria-labelledby="history-modal-title" role="dialog" aria-modal="true">
      <div class="history-modal__content">
        <div class="panel-header history-modal__header">
          <div>
            <p class="panel-kicker">History</p>
            <h2 id="history-modal-title">History solution</h2>
          </div>
          <button class="ghost-button" type="button" data-history-modal-close>Close</button>
        </div>

        <div class="history-modal__details">
          <p class="history-modal__line" data-history-modal-digits></p>
          <p class="history-modal__line" data-history-modal-formula></p>
          <p class="history-modal__status" data-history-modal-status></p>
          <p class="history-modal__mode" data-history-modal-mode></p>
          <p class="history-modal__line" data-history-modal-solution></p>
        </div>

        <div class="history-modal__steps">
          <h3 class="history-modal__steps-title">Evaluation steps</h3>
          <ol class="steps" data-history-modal-steps></ol>
        </div>
      </div>
    </dialog>
  </main>
`;

const digitsContainer = queryRequired<HTMLDivElement>(app, '[data-digits]');
const form = queryRequired<HTMLFormElement>(app, '[data-form]');
const formulaInput = queryRequired<HTMLInputElement>(app, '[data-formula]');
const instructionsElement = queryRequired<HTMLUListElement>(app, '[data-instructions]');
const modeBasicButton = queryRequired<HTMLButtonElement>(app, '[data-mode-basic]');
const modeAdvancedButton = queryRequired<HTMLButtonElement>(app, '[data-mode-advanced]');
const operatorKeypadElement = queryRequired<HTMLDivElement>(app, '[data-operator-keypad]');
const resultElement = queryRequired<HTMLDivElement>(app, '[data-result]');
const solutionElement = queryRequired<HTMLDivElement>(app, '[data-solution]');
const stepsElement = queryRequired<HTMLOListElement>(app, '[data-steps]');
const historyListElement = queryRequired<HTMLDivElement>(app, '[data-history-list]');
const historyModal = queryRequired<HTMLDialogElement>(app, '[data-history-modal]');
const historyModalCloseButton = queryRequired<HTMLButtonElement>(app, '[data-history-modal-close]');
const historyModalDigits = queryRequired<HTMLParagraphElement>(app, '[data-history-modal-digits]');
const historyModalFormula = queryRequired<HTMLParagraphElement>(app, '[data-history-modal-formula]');
const historyModalStatus = queryRequired<HTMLParagraphElement>(app, '[data-history-modal-status]');
const historyModalMode = queryRequired<HTMLParagraphElement>(app, '[data-history-modal-mode]');
const historyModalSolution = queryRequired<HTMLParagraphElement>(app, '[data-history-modal-solution]');
const historyModalSteps = queryRequired<HTMLOListElement>(app, '[data-history-modal-steps]');
const newChallengeButton = queryRequired<HTMLButtonElement>(app, '[data-new-challenge]');
const clearButton = queryRequired<HTMLButtonElement>(app, '[data-clear]');
const clearHistoryButton = queryRequired<HTMLButtonElement>(app, '[data-clear-history]');
const showSolutionButton = queryRequired<HTMLButtonElement>(app, '[data-show-solution]');

let challengeDigits: ChallengeDigits = [1, 2, 3, 4];
let failedAttempts = 0;
let historyItems: Basic24HistoryItem[] = getBasic24History();
let currentChallengeSolved = false;
const KEYPAD_OPERATORS = ['+', '-', '*', '/', '(', ')', '^', '√'] as const;
const BASIC_MODE_STORAGE_KEY = 'basic24.mode.v1';
let currentMode: Basic24Mode = getSavedMode();

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

function getSavedMode(): Basic24Mode {
  try {
    const value = globalThis.localStorage?.getItem(BASIC_MODE_STORAGE_KEY);

    if (value === 'advanced' || value === 'basic') {
      return value;
    }
  } catch {
    return 'basic';
  }

  return 'basic';
}

function saveMode(mode: Basic24Mode): void {
  try {
    globalThis.localStorage?.setItem(BASIC_MODE_STORAGE_KEY, mode);
  } catch {
    return;
  }
}

function isAdvancedOperator(symbol: string): boolean {
  return symbol === '^' || symbol === '√';
}

function renderDigits(digits: ChallengeDigits, usedIndexes: Set<number>): void {
  digitsContainer.innerHTML = '';

  digits.forEach((digit, index) => {
    const used = usedIndexes.has(index);
    const box = document.createElement('button');

    box.className = used ? 'digit-box digit-box--used' : 'digit-box';
    box.type = 'button';
    box.textContent = String(digit);
    box.disabled = used;
    box.setAttribute('aria-label', `Digit ${digit} ${used ? 'used' : 'unused'}${used ? '' : ', insert digit'}`);

    if (!used) {
      box.addEventListener('click', () => {
        insertTextAtCursor(String(digit));
      });
    }

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

    const statusWrap = document.createElement('div');
    statusWrap.className = 'history-status-wrap';

    const status = document.createElement('span');
    status.className = item.ok ? 'history-status history-status--success' : 'history-status history-status--error';
    status.textContent = item.ok ? 'Correct' : 'Not quite';

    statusWrap.append(status);

    if (item.repeatCount > 1) {
      const repeatCount = document.createElement('span');
      repeatCount.className = 'history-repeat-count';
      repeatCount.textContent = `×${item.repeatCount}`;
      statusWrap.append(repeatCount);
    }

    const modeBadge = document.createElement('span');
    modeBadge.className = 'history-mode-badge';
    modeBadge.textContent = item.mode === 'advanced' ? 'Advanced' : 'Basic';
    statusWrap.append(modeBadge);

    topLine.append(digits, statusWrap);

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
      openHistorySolutionModal(item);
    });

    actions.append(viewSolutionButton);
    row.append(details, actions);
    historyListElement.appendChild(row);
  }
}

function renderInstructions(mode: Basic24Mode): void {
  instructionsElement.innerHTML = '';

  const lines =
    mode === 'advanced'
      ? [
          'Use all 4 digits exactly once.',
          'Advanced operators: ^ and indexed √.',
          '√ requires a root index. Example: (9-7)√9*8.',
          'Brackets are allowed.',
          'Target result is 24.',
          'Solve the current challenge to unlock New Challenge.',
        ]
      : [
          'Use all 4 digits exactly once.',
          'Allowed operators: +, -, *, /',
          'Brackets are allowed.',
          'Target result is 24.',
          'After 3 failed attempts, you can reveal one solution.',
          'Solve the current challenge to unlock New Challenge.',
        ];

  for (const line of lines) {
    const item = document.createElement('li');
    item.textContent = line;
    instructionsElement.appendChild(item);
  }
}

function renderOperatorKeypad(mode: Basic24Mode): void {
  operatorKeypadElement.innerHTML = '';

  for (const symbol of KEYPAD_OPERATORS) {
    const button = document.createElement('button');
    button.className = 'ghost-button keypad-button operator-keypad-button';
    button.type = 'button';
    button.textContent = symbol;
    button.setAttribute('aria-label', `Insert ${symbol}`);

    if (symbol === '^') {
      button.title = mode === 'advanced'
        ? 'Power operator, available in Advanced Mode'
        : 'Switch to Advanced Mode to use this operator.';
    } else if (symbol === '√') {
      button.title = mode === 'advanced'
        ? 'Indexed root operator, available in Advanced Mode'
        : 'Switch to Advanced Mode to use this operator.';
    } else {
      button.removeAttribute('title');
    }

    if (mode === 'basic' && isAdvancedOperator(symbol)) {
      button.disabled = true;
    } else {
      button.addEventListener('click', () => {
        insertTextAtCursor(symbol);
      });
    }

    operatorKeypadElement.appendChild(button);
  }
}

function updateFormulaInteractionState(): void {
  renderDigits(challengeDigits, getUsedDigitIndexes(challengeDigits, formulaInput.value));
}

function handleFormulaInputChanged(): void {
  if (currentChallengeSolved) {
    currentChallengeSolved = false;
    updateNewChallengeButton();
  }

  updateFormulaInteractionState();
}

function insertTextAtCursor(text: string): void {
  const start = formulaInput.selectionStart ?? formulaInput.value.length;
  const end = formulaInput.selectionEnd ?? formulaInput.value.length;
  const nextValue = `${formulaInput.value.slice(0, start)}${text}${formulaInput.value.slice(end)}`;
  const nextCursor = start + text.length;

  formulaInput.value = nextValue;
  formulaInput.focus();
  formulaInput.setSelectionRange(nextCursor, nextCursor);
  handleFormulaInputChanged();
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

  showSolutionButton.title = '';

  if (remainingAttempts > 0) {
    showSolutionButton.textContent = `Show Solution (${remainingAttempts})`;
    showSolutionButton.disabled = true;
    return;
  }

  showSolutionButton.textContent = 'Show Solution';
  showSolutionButton.disabled = false;
}

function updateNewChallengeButton(): void {
  newChallengeButton.disabled = !currentChallengeSolved;
}

function updateModeUI(): void {
  renderInstructions(currentMode);
  renderOperatorKeypad(currentMode);
  modeBasicButton.classList.toggle('mode-switch-button--active', currentMode === 'basic');
  modeAdvancedButton.classList.toggle('mode-switch-button--active', currentMode === 'advanced');
  modeBasicButton.setAttribute('aria-pressed', String(currentMode === 'basic'));
  modeAdvancedButton.setAttribute('aria-pressed', String(currentMode === 'advanced'));
  updateShowSolutionButton();
}

function setMode(mode: Basic24Mode): void {
  if (currentMode === mode) {
    return;
  }

  currentMode = mode;
  saveMode(mode);
  currentChallengeSolved = false;
  failedAttempts = 0;
  hideSolutionReveal();
  renderResult('idle', 'Enter a formula and validate it against the current digits.');
  renderSteps([]);
  updateNewChallengeButton();
  updateModeUI();
  updateFormulaInteractionState();
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
    mode: currentMode,
  });

  updateHistoryState();
}

function explainFormulaForMode(
  mode: Basic24Mode,
  digits: ChallengeDigits,
  formula: string,
): ReturnType<typeof explainBasic24Formula> {
  return mode === 'advanced'
    ? explainAdvanced24Formula({
        digits,
        formula,
      })
    : explainBasic24Formula({
        digits,
        formula,
      });
}

function getAnySolutionForMode(mode: Basic24Mode, digits: ChallengeDigits): string | null {
  return mode === 'advanced' ? getAnyAdvanced24Solution(digits) : getAnyBasic24Solution(digits);
}

function renderEvaluationSteps(target: HTMLOListElement, steps: readonly { expression: string; value: number }[]): void {
  target.innerHTML = '';

  if (steps.length === 0) {
    const item = document.createElement('li');
    item.className = 'steps-empty';
    item.textContent = 'No evaluation steps to show yet.';
    target.appendChild(item);
    return;
  }

  for (const step of steps) {
    const item = document.createElement('li');
    item.textContent = step.expression;
    target.appendChild(item);
  }
}

function closeHistorySolutionModal(): void {
  if (historyModal.open) {
    historyModal.close();
  }
}

function openHistorySolutionModal(item: Basic24HistoryItem): void {
  historyModalDigits.textContent = `Digits: ${item.digits.join(' ')}`;
  historyModalFormula.textContent = `Formula: ${item.formula}`;
  historyModalStatus.textContent = `Status: ${item.ok ? 'Correct' : 'Not quite'}`;
  historyModalMode.textContent = `Mode: ${item.mode === 'advanced' ? 'Advanced' : 'Basic'}`;
  historyModalSolution.textContent = '';
  renderEvaluationSteps(historyModalSteps, []);

  const solution = getAnySolutionForMode(item.mode, item.digits);

  if (solution === null) {
    historyModalSolution.textContent = 'No solution is available for this history item.';
    if (historyModal.open) {
      historyModal.close();
    }
    historyModal.showModal();
    return;
  }

  const explanation = explainFormulaForMode(item.mode, item.digits, solution);

  historyModalSolution.textContent = `One solution: ${solution}`;
  renderEvaluationSteps(historyModalSteps, explanation.steps);
  if (historyModal.open) {
    historyModal.close();
  }
  historyModal.showModal();
}

function revealCurrentChallengeSolution(): void {
  const solution = getAnySolutionForMode(currentMode, challengeDigits);

  if (solution === null) {
    showSolutionReveal('No solution is available for this challenge.');
    renderResult('idle', 'No solution is available for this challenge.');
    renderSteps([]);
    return;
  }

  const explanation = explainFormulaForMode(currentMode, challengeDigits, solution);

  showSolutionReveal(`One solution: ${solution}`);
  renderSteps(explanation.steps);

  if (explanation.ok) {
    renderResult('success', 'Solution revealed.');
    return;
  }

  renderResult('error', `Solution lookup failed. ${explanation.error}`);
}

function validateCurrentFormula(): void {
  const formula = formulaInput.value.trim();
  const result = explainFormulaForMode(currentMode, challengeDigits, formula);

  renderSteps(result.steps);

  if (result.ok) {
    currentChallengeSolved = true;
    failedAttempts = 0;
    hideSolutionReveal();
    updateShowSolutionButton();
    updateNewChallengeButton();
    renderResult('success', 'Correct! This makes 24.');
    saveHistoryAttempt(result, formula);
    return;
  }

  if (formula.length > 0) {
    currentChallengeSolved = false;
    failedAttempts += 1;
  }

  updateShowSolutionButton();
  updateNewChallengeButton();
  renderResult('error', `Not quite yet. ${result.error}`);
  saveHistoryAttempt(result, formula);
}

function clearFormula(): void {
  formulaInput.value = '';
  failedAttempts = 0;
  currentChallengeSolved = false;
  updateShowSolutionButton();
  updateNewChallengeButton();
  hideSolutionReveal();
  renderResult('idle', 'Enter a formula and validate it against the current digits.');
  renderSteps([]);
  updateFormulaInteractionState();
  formulaInput.focus();
}

function setChallengeDigits(digits: ChallengeDigits): void {
  challengeDigits = digits;
  currentChallengeSolved = false;
  updateFormulaInteractionState();
  updateNewChallengeButton();
}

function revealSolution(): void {
  revealCurrentChallengeSolution();
}

function startNewChallenge(): void {
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

newChallengeButton.addEventListener('click', () => {
  if (!currentChallengeSolved) {
    return;
  }

  startNewChallenge();
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

historyModalCloseButton.addEventListener('click', () => {
  closeHistorySolutionModal();
});

historyModal.addEventListener('click', (event) => {
  if (event.target === historyModal) {
    closeHistorySolutionModal();
  }
});

historyModal.addEventListener('cancel', (event) => {
  event.preventDefault();
  closeHistorySolutionModal();
});

formulaInput.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter') {
    return;
  }

  event.preventDefault();
  validateCurrentFormula();
});

formulaInput.addEventListener('input', () => {
  handleFormulaInputChanged();
});

modeBasicButton.addEventListener('click', () => {
  setMode('basic');
});

modeAdvancedButton.addEventListener('click', () => {
  setMode('advanced');
});

updateModeUI();
setChallengeDigits(createSolvableChallenge());
renderResult('idle', 'Enter a formula and validate it against the current digits.');
renderSteps([]);
updateNewChallengeButton();
hideSolutionReveal();
updateFormulaInteractionState();
updateHistoryState();
