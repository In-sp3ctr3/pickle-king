# Verification

Status: release candidate verified on 2026-08-04.

## Evidence

- `tests/playwright/match-card-balance.spec.ts` covers node containment,
  state-aware edit contrast, and current-final symmetry.
- `tests/playwright/ipad-bracket-share-followup.spec.ts` covers reset placement,
  iPad final/bronze geometry, and concise share controls.
- `src/features/share/bracket-share-portrait.test.ts` covers portrait tree height,
  round separation, final/bronze spacing, and safe-area podium placement.
- Visual evidence includes `output/playwright/match-card-next-balanced.png`,
  `output/playwright/final-card-current-balanced.png`, and current 8/16-player
  Story / Reel exports.

## Release gates

- `npm run check`: lint, strict TypeScript, the 300-line gate, 31 Vitest files
  with 142 tests, Vinext production build, and Serwist precache passed.
- Playwright: all 116 production-browser checks passed, including two new iPad
  node regressions and 8/16-player portrait export workflows.
- Frontend contract, evidence, asset, dead-control, responsive, accessibility,
  console, focus, reduced-motion, and visual comparison gates passed.
- `vinext check`: 100% compatible (6 supported, 0 partial, 0 issues).
- PWA artifacts passed and npm reported zero high or critical vulnerabilities.
- GitHub and Sites release verification remains pending.
