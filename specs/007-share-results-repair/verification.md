# Verification

Status: passed

## Evidence

- Supplied portrait reference: 1122×1402, SHA-256
  `2503a333eac3bd1f2ccadff1a13173ca36be2d8ba840b7f86dc9c54a0187a458`.
- Same-content Jack 5–3 source/render/diff:
  `output/playwright/reference-comparisons/portrait-source-render-diff.png`.
- Result, recap, and stats: `output/playwright/adversarial-quick-share.png`,
  `adversarial-recap.png`, and `adversarial-stats.png` at 1080×1350.
- Brackets: `output/playwright/adversarial-bracket-4.png`,
  `adversarial-bracket-8-ci.png`, and `adversarial-bracket-16.png` at
  1600×1200.

## Checks

- `npm run check`: passed; 21 unit files and 110 tests, production build, and
  service-worker generation.
- Focused sharing/scorer/browser suite: 19 passed.
- Responsive suite: 18 passed.
- Product workflows: 10 passed; the offline case was verified against the
  production Vinext server.
- Frontend harness: 27 passed with console, keyboard, reduced-motion, Axe, and
  screenshot coverage.
- `vinext check`: 100% compatible, zero partial or unsupported findings.
- PWA artifact suite: 2 passed.
