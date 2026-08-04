# Verification

Status: release candidate verified on 2026-08-04.

## Evidence

- Unit checks cover share labels and portrait bracket bounds.
- `tests/playwright/ipad-bracket-share-followup.spec.ts` covers Reset all,
  stacked participants, final/third-place placement, edit controls, share labels,
  and removed internal ranking language.
- Generated evidence includes `output/playwright/ipad-completed-bracket-followup.png`,
  Post/Story bracket PNGs, and Post/Story stats PNGs.

## Release gates

- `npm run check`: 31 test files / 137 tests, lint, strict TypeScript,
  300-line enforcement, and the production build passed.
- Playwright: all 114 production browser checks passed.
- Frontend contract, evidence, asset, dead-control, responsive, accessibility,
  console, focus, and reduced-motion gates passed.
- `vinext check`: 100% compatible (6 supported, 0 partial, 0 issues).
- PWA artifacts and production offline reopen passed; npm reported zero high or
  critical vulnerabilities.
- GitHub and Sites retain the exact merge and deployment provenance.
