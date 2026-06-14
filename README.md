# 24 Web Games

A TypeScript project for building educational web-based number games.

## Current Feature

### Basic Mode 24 Game Validator

Validates whether a formula:

- Uses exactly four given digits
- Uses every digit exactly once
- Correctly handles duplicate digits
- Allows only:
  - `+`
  - `-`
  - `*`
  - `/`
  - brackets `()`
  - spaces
- Evaluates to `24`

Example:

```ts
import { validateBasic24Formula } from './src/basic24.js';

const result = validateBasic24Formula({
  digits: [2, 4, 6, 8],
  formula: '8*6/(4/2)',
});

console.log(result);
```

````

Expected result:

```ts
{
  ok: true,
  value: 24,
  usedDigits: [8, 6, 4, 2],
  error: null
}
```

## Tech Stack

- TypeScript
- Vitest
- tsx
- Node.js

## Setup

```bash
npm install
```

## Development

Run the development entry file:

```bash
npm run dev
```

## Type Check

```bash
npm run typecheck
```

## Test

Run tests in watch mode:

```bash
npm test
```

Run tests once:

```bash
npm run test:run
```

## Project Structure

```txt
src/
  basic24.ts
  index.ts

test/
  basic24.test.ts
```

## Notes

This project is currently focused on the pure TypeScript game engine first.

UI and advanced educational formula explanation features will be added later.
````
