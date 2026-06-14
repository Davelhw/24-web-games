import { validateBasic24Formula } from './basic24.js';

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
  {
    label: 'another valid example',
    digits: [2, 4, 6, 8],
    formula: '8*6/(4/2)',
  },
] as const;

for (const example of examples) {
  const result = validateBasic24Formula({
    digits: example.digits,
    formula: example.formula,
  });

  console.log(`\n${example.label}`);
  console.log('Digits :', example.digits.join(', '));
  console.log('Formula:', example.formula);
  console.log('Result :', result);
}
