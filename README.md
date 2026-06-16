# 24 Web Games

An educational 24 Game web app built with TypeScript. It validates formulas, explains evaluation steps, supports Basic and Advanced modes, and helps players practice arithmetic thinking.

## Live Demo

- https://24game.davelhw.com

## Repository

- https://github.com/Davelhw/24-web-games

## Features

- Basic Mode: `+`, `-`, `*`, `/`, brackets, implicit multiplication
- Advanced Mode: `^` power and indexed `√` root
- Formula validation against four digits
- Duplicate digit handling
- Step-by-step evaluation explanation
- Show Solution after 3 failed attempts
- Current digits can be tapped/clicked as input
- Operator keypad
- Attempt history with `localStorage`
- History solution modal
- Mobile-friendly UI

## Game Modes

### Basic Mode

- Use `+`, `-`, `*`, `/`
- Brackets allowed
- Implicit multiplication allowed, example: `2(3+6)`

### Advanced Mode

- Includes Basic Mode
- `^` means power
- indexed `√` means root
- `√` does not default to square root
- example: `2^3*1*3 = 24`
- example: `(9-7)√9*8 = 24`

## Local Development

```bash
npm install
npm run dev
```

## Quality Checks

```bash
npm run typecheck
npm run test:run
npm run build
```

## Deployment

Vite builds the production site to `dist/`.

This repository is currently deployed at https://24game.davelhw.com.

## Analytics

- Cloudflare HTTP Traffic is used for infrastructure-level visibility such as request volume, paths, status codes, cache behavior, and scanner traffic.
- Cloudflare Web Analytics is used for real browser page-view tracking on https://24game.davelhw.com.
- The analytics beacon only loads when `VITE_CLOUDFLARE_WEB_ANALYTICS_TOKEN` is set.
- If the env var is missing, no analytics script is injected.

### Future gameplay analytics

Gameplay event tracking is a future step only, after page-view analytics is confirmed working.

Planned events:

- `game_started`
- `answer_submitted`
- `answer_correct`
- `answer_wrong`
- `show_solution_clicked`
- `new_challenge_clicked`

## Contributing

Contributions are welcome.

Engineers may clone, fork, open issues, or submit pull requests.

Suggested contribution areas:

- UI/UX improvements
- solver improvements
- more educational explanations
- accessibility improvements
- test coverage

Keep changes simple and well-tested.

## License

MIT License.
