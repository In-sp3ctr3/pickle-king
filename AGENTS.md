# Project instructions

- Use the committed npm lockfile and Node.js 22.13+.
- Keep framework code in `app/` thin; product code belongs in feature modules.
- Domain modules must not import React or browser APIs.
- Feature modules may depend on `src/tournament`, `src/persistence`, and
  `src/shared`; domain modules must not depend on features.
- Keep every hand-authored TypeScript/TSX file below 300 logical lines.
- Add tests for non-trivial domain and persistence behavior.
- Do not add analytics, accounts, remote fonts, or player-data transmission.
- Run `npm run check` and `npm run format:check` before merging.
