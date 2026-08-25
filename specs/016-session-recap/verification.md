# Verification Record

Status: complete

The owner-approved 2026-08-25 extension raises each recap page to twelve rows,
lightens and centers the table typography, standardizes the broken-rule
subtitle, protects the Doubles masthead edge, and lowers new player entry to 16
characters with measured two-line Quick winner fitting. The prior evidence
below is supplemented by fresh 8/12/13-player and 16-character-name evidence.

The owner's 2026-08-24 annotated comparisons reopened the export gate for
typography, spacing, mascot placement, factual Quick Match headings, and footer
rhythm. Five matched-data source/render/difference triptychs, full-resolution
Post/Story renders, and independent frontend QA/design review now close
DQA-83 through DQA-86 with no remaining P0/P1/P2 finding.

## Passing Evidence

- `npm test`: 54 files and 293 tests passed.
- `tests/playwright/session-recap.spec.ts`: 10 browser workflows passed,
  including latest-day selection, cancellation, exact Post/Story dimensions,
  pagination, deterministic multi-file names, unsupported sharing, encoding
  failure, Escape, and Axe.
- Responsive selection and preview coverage passed at 390×844, 844×390,
  820×1180, 1180×820, and 1440×1000.
- `npm run lint`, `npm run typecheck`, `npm run format:check`,
  `npm run test:pwa`, `npm run build`, and `npm audit --audit-level=high`
  passed. The audit reported zero vulnerabilities.
- The full frontend harness passed 72 of 72 cases serially and produced 48
  render captures plus 48 combined comparison artifacts. Direction,
  static-prototype, and release receipts passed.
- Adversarial code review and Ponytail simplicity review have no open feature
  P0/P1/P2 finding.

## 2026-08-25 Extension Evidence

- Strict pagination passes for 12, 13, 24, and 25 players; Post and Story use
  identical page counts and every continuation retains the compact skeleton.
- Fresh 1080×1350 and 1080×1920 exports prove 8-row dense, 12-row compact, and
  13-player two-page states. Independently measured row/rule imbalance is at
  most 2px and the Doubles masthead remains within protected edges.
- The finite raster grid passes regular 5/6-row, dense 8-row, compact 12-row,
  and continuation profiles in both formats: each Player, W-L, and +/- lane is
  independently centered, minimum total divider clearance is 13px, and no
  profile derives its pitch from the twelve-row capacity.
- Regular and dense Doubles templates use the complete owner-supplied title
  crop. Pixel-component scans prove the final S and every letter bottom remain
  intact, retain protected outer margins, leave no detached fragments outside
  the title band, and keep the final-S flat-edge plateau below 12% of its
  height.
- New entry accepts 16 trimmed characters and rejects 17 across Quick Match,
  tournament setup, and editing. A persisted 40-character history fixture
  remains loadable and shareable.
- `Jean-Baptiste M.` renders in full in Poster, Frame, and Receipt without
  moving the fixed mascot, WINS, score, opponent, or canonical footer lanes.
- First-page encoding measured 174ms; sequential completion of the two-page set
  measured 143ms more, for 317ms total. Story PNGs measured 669KB and 592KB.
- The previous line-count exceptions were cleared with behavior-preserving
  test/helper splits; no feature behavior was added to those bracket files.
- No schema migration, route, dependency, saved recap object, or share API was
  introduced. No deployment or publication was performed.
