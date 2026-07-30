# Contributing

Thanks for helping make court nights run better.

## Before opening a change

1. Search existing issues and open a focused issue for substantial behavior.
2. Keep scope aligned with the v1 non-goals in the product specification.
3. Never add telemetry or network transmission of player data without an
   approved architecture and privacy change.

## Development

Use Node.js 22.13+ and the committed npm lockfile.

```bash
npm ci
npm run dev
```

Use a short branch name such as `feat/rest-aware-order`. Non-trivial domain
behavior should begin with a failing test. Keep hand-authored TypeScript/TSX
files below 300 logical lines and follow existing feature boundaries.

Before opening a pull request:

```bash
npm run check
npm run format:check
```

## Pull requests

- Explain the player/operator problem and the chosen change.
- Link the relevant specification task or issue.
- Include screenshots for visible changes at mobile and desktop widths.
- Record accessibility, offline, and persistence implications.
- Keep the PR small enough to review and use squash merge.

By contributing, you agree that your contribution is licensed under the MIT
License and to follow the Code of Conduct.
