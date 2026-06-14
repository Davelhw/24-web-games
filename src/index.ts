import { explainBasic24Formula } from './basic24.js';

const examples = [
  {
    label: 'Valid example',
    digits: [2, 4, 6, 8],
    formula: '8*6/(4/2)',
  },
  {
    label: 'Valid duplicate digit example',
    digits: [4, 4, 8, 8],
    formula: '8+8+4+4',
  },
  {
    label: 'Floating precision valid example',
    digits: [3, 3, 8, 8],
    formula: '8/(3-8/3)',
  },
  {
    label: 'Wrong result example',
    digits: [2, 4, 6, 8],
    formula: '8+6+4+2',
  },
  {
    label: 'Duplicate digit misuse example',
    digits: [1, 1, 2, 3],
    formula: '1+2+3+3',
  },
  {
    label: 'Invalid character example',
    digits: [2, 4, 6, 8],
    formula: '8^6+4+2',
  },
] as const;

for (const example of examples) {
  const result = explainBasic24Formula({
    digits: example.digits,
    formula: example.formula,
  });

  console.log(`\n=== ${example.label} ===`);
  console.log('Digits :', example.digits.join(', '));
  console.log('Formula:', example.formula);

  if (result.steps.length > 0) {
    console.log('Steps  :');

    for (const step of result.steps) {
      console.log(`  - ${step.expression}`);
    }
  } else {
    console.log('Steps  : none');
  }

  if (result.ok) {
    console.log('Result : valid');
    console.log('Value  :', result.value);
  } else {
    console.log('Result : invalid');
    console.log('Error  :', result.error);
  }
}
