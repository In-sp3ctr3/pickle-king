# Frontend Design QA

Status: passed
Last updated: 2026-07-30

## Environment

- Commit/source state: codex/fix/frontend-repair@validated-working-tree-2026-07-30
- Browser: Playwright Chromium 1.62.1
- Base URL: http://127.0.0.1:3000 production Vinext server
- DPR: Playwright default at 1440×1000 and 390×844
- Stable-data/animation setup: distinct fixed ratings, cleared localStorage,
  blurred focus before capture, awaited the kinetic court state, and
  reduced-motion checks isolated from animated captures
- Responsive verification: 1180×820 iPad landscape, 820×1180 iPad portrait,
  and 844×390 phone landscape

## Evidence

| Route/state  | Viewport | Source capture                                         | Render capture                                          | Combined comparison                                        | Interaction run | Axe result |
| ------------ | -------- | ------------------------------------------------------ | ------------------------------------------------------- | ---------------------------------------------------------- | --------------- | ---------- |
| home         | desktop  | docs/frontend/evidence/home-desktop-source.png         | test-results/frontend-captures/home-desktop.png         | test-results/frontend-comparisons/home-desktop.png         | passed          | passed     |
| home         | mobile   | docs/frontend/evidence/home-mobile-source.png          | test-results/frontend-captures/home-mobile.png          | test-results/frontend-comparisons/home-mobile.png          | passed          | passed     |
| setup        | desktop  | docs/frontend/evidence/setup-desktop-source.png        | test-results/frontend-captures/setup-desktop.png        | test-results/frontend-comparisons/setup-desktop.png        | passed          | passed     |
| setup        | mobile   | docs/frontend/evidence/setup-mobile-source.png         | test-results/frontend-captures/setup-mobile.png         | test-results/frontend-comparisons/setup-mobile.png         | passed          | passed     |
| bracket      | desktop  | docs/frontend/evidence/bracket-desktop-source.png      | test-results/frontend-captures/bracket-desktop.png      | test-results/frontend-comparisons/bracket-desktop.png      | passed          | passed     |
| bracket      | mobile   | docs/frontend/evidence/bracket-mobile-source.png       | test-results/frontend-captures/bracket-mobile.png       | test-results/frontend-comparisons/bracket-mobile.png       | passed          | passed     |
| quick-setup  | desktop  | docs/frontend/evidence/quick-setup-desktop-source.png  | test-results/frontend-captures/quick-setup-desktop.png  | test-results/frontend-comparisons/quick-setup-desktop.png  | passed          | passed     |
| quick-setup  | mobile   | docs/frontend/evidence/quick-setup-mobile-source.png   | test-results/frontend-captures/quick-setup-mobile.png   | test-results/frontend-comparisons/quick-setup-mobile.png   | passed          | passed     |
| quick-live   | desktop  | docs/frontend/evidence/quick-live-desktop-source.png   | test-results/frontend-captures/quick-live-desktop.png   | test-results/frontend-comparisons/quick-live-desktop.png   | passed          | passed     |
| quick-live   | mobile   | docs/frontend/evidence/quick-live-mobile-source.png    | test-results/frontend-captures/quick-live-mobile.png    | test-results/frontend-comparisons/quick-live-mobile.png    | passed          | passed     |
| quick-result | desktop  | docs/frontend/evidence/quick-result-desktop-source.png | test-results/frontend-captures/quick-result-desktop.png | test-results/frontend-comparisons/quick-result-desktop.png | passed          | passed     |
| quick-result | mobile   | docs/frontend/evidence/quick-result-mobile-source.png  | test-results/frontend-captures/quick-result-mobile.png  | test-results/frontend-comparisons/quick-result-mobile.png  | passed          | passed     |
| results      | desktop  | docs/frontend/evidence/results-desktop-source.png      | test-results/frontend-captures/results-desktop.png      | test-results/frontend-comparisons/results-desktop.png      | passed          | passed     |
| results      | mobile   | docs/frontend/evidence/results-mobile-source.png       | test-results/frontend-captures/results-mobile.png       | test-results/frontend-comparisons/results-mobile.png       | passed          | passed     |

## Iteration History

| Iteration | Region        | Pixel signal           | Human finding                                                | Change                                                                | Result |
| --------- | ------------- | ---------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------- | ------ |
| 1         | Typography    | glyph crowding         | condensed display face joined double-digit scores            | replaced display usage with Manrope and non-negative tracking         | passed |
| 2         | Home hero     | concept rejection      | static image and paint mask did not explain the product      | replaced both with a kinetic DOM court/rest rotation                  | passed |
| 3         | Navigation    | misplaced controls     | corner navigation lacked a reliable bracket-to-setup path    | added one centered floating island with explicit Back and Home        | passed |
| 4         | Setup         | control imbalance      | native rating popup and uneven timing fields felt unfinished | added Radix popup, animated choices, steppers, and aligned field rows | passed |
| 5         | Bracket       | node-model mismatch    | players and actions occupied separate nodes                  | rebuilt each node as a two-contender match converging on center final | passed |
| 6         | Responsive QA | missing target screens | tablet and phone landscape behavior had not been proven      | added executable layout tests for all three target viewports          | passed |

Pixel difference is an iteration signal, not a universal pass threshold. The
final deterministic source/render pairs are byte-identical.

## Findings

| ID     | Severity | Route/region   | Evidence                                 | Contract/user impact                                     | Owner    | Status |
| ------ | -------- | -------------- | ---------------------------------------- | -------------------------------------------------------- | -------- | ------ |
| DQA-01 | P1       | home/hero      | desktop, mobile, and responsive captures | rejected static artwork remained visible                 | frontend | fixed  |
| DQA-02 | P1       | bracket/tree   | bracket desktop and mobile captures      | node anatomy did not match a tournament bracket          | frontend | fixed  |
| DQA-03 | P1       | scorer/type    | quick-live desktop and mobile captures   | condensed double digits reduced score legibility         | frontend | fixed  |
| DQA-04 | P2       | setup/controls | setup desktop and mobile captures        | native dropdown and vertical misalignment reduced polish | frontend | fixed  |
| DQA-05 | P2       | app/navigation | setup, bracket, and results captures     | back path was absent or duplicated outside navigation    | frontend | fixed  |

## Harness Results

- [x] Route and interaction coverage passed.
- [x] Dead-control audit passed.
- [x] Raw-asset policy passed or exceptions are documented.
- [x] Desktop and mobile screenshots captured.
- [x] iPad portrait, iPad landscape, and phone landscape layouts passed.
- [x] Console checks passed.
- [x] Keyboard/focus checks passed.
- [x] Reduced-motion behavior passed.
- [x] Automated Axe checks passed.
- [x] Every P0/P1/P2 finding is closed.

## Final Decision

Reviewer: design_reviewer
Reviewer result: passed
Reviewer evidence: docs/frontend/reviews/design-review.md

Result: passed

Rationale: the kinetic court hero, centered navigation island, balanced custom
controls, lime run-of-show, two-contender bracket nodes, scorer, dialogs, and
results meet the contract across the required orientations with no open
P0/P1/P2 findings.
