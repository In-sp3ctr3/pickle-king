# Frontend Design QA

Status: passed
Last updated: 2026-07-31

## Environment

- Commit/source state:
  codex/fix/bracket-clarity-corrections@validated-working-tree-2026-07-31
- Browser: Playwright Chromium 1.62.1
- Base URL: http://127.0.0.1:3000 production Vinext server
- DPR: Playwright default at 1440×1000 and 390×844
- Stable-data/animation setup: distinct fixed ratings, cleared localStorage,
  blurred focus before capture, disabled screenshot animations, and isolated
  reduced-motion checks
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

| Iteration | Region         | Pixel signal            | Human finding                                              | Change                                                                            | Result |
| --------- | -------------- | ----------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------- | ------ |
| 1         | Typography     | glyph crowding          | condensed display face joined double-digit scores          | introduced Archivo Black with positive score tracking                             | passed |
| 2         | Home hero      | concept rejection       | product-demo imagery kept replacing the requested identity | made the existing crowned mascot the sole visual with a restrained blink          | passed |
| 3         | Navigation     | misplaced controls      | corner navigation lacked a reliable bracket-to-setup path  | added one solid centered island with explicit Back and Home                       | passed |
| 4         | Setup          | control imbalance       | generic controls and uneven timing fields felt unfinished  | added custom select, spring choices, field-local errors, and aligned rows         | passed |
| 5         | Bracket        | node-model mismatch     | players and actions occupied separate nodes                | rebuilt each node as a wide two-contender match converging on a trophy final      | passed |
| 6         | Queue state    | scheduling ambiguity    | every dependency-ready match appeared ready                | reserved lime and `Next` for the one-court eligible match; marked the rest queued | passed |
| 7         | Responsive QA  | missing target screens  | tablet and phone landscape behavior had not been proven    | added executable layout tests for all three target viewports                      | passed |
| 8         | Bracket repair | unclear six-player draw | `BYE` looked like an unregistered participant              | named automatic advances in setup/draw and removed the fake contender row         | passed |
| 9         | Result repair  | correction interruption | completed scores opened browser prompts                    | added compact in-node score editing with explicit tied-result winner selection    | passed |

Pixel difference is an iteration signal, not a universal pass threshold. The
intentional hero-scale and final-card repairs were visually reviewed and
promoted as the new frozen baselines. Source/render pairs are identical for the
home, setup, and bracket states.

## Findings

| ID     | Severity | Route/region   | Evidence                                 | Contract/user impact                                       | Owner    | Status |
| ------ | -------- | -------------- | ---------------------------------------- | ---------------------------------------------------------- | -------- | ------ |
| DQA-01 | P1       | home/hero      | desktop, mobile, and responsive captures | rejected static artwork remained visible                   | frontend | fixed  |
| DQA-02 | P1       | bracket/tree   | bracket desktop and mobile captures      | node anatomy did not match a tournament bracket            | frontend | fixed  |
| DQA-03 | P1       | scorer/type    | quick-live desktop and mobile captures   | condensed double digits reduced score legibility           | frontend | fixed  |
| DQA-04 | P2       | setup/controls | setup desktop and mobile captures        | native dropdown and vertical misalignment reduced polish   | frontend | fixed  |
| DQA-05 | P2       | app/navigation | setup, bracket, and results captures     | back path was absent or duplicated outside navigation      | frontend | fixed  |
| DQA-06 | P1       | bracket/byes   | six-player workflow and capture          | `BYE` appeared to be an unregistered player                | frontend | fixed  |
| DQA-07 | P1       | bracket/final  | desktop and mobile bracket captures      | final label displaced its waiting state and faceoff        | frontend | fixed  |
| DQA-08 | P2       | bracket/edit   | inline correction workflow and capture   | completed scores could not be edited in their bracket node | frontend | fixed  |

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

Reviewer: local adversarial frontend review
Reviewer result: passed
Reviewer evidence: docs/frontend/reviews/design-review.md

Result: passed

Rationale: the reduced mascot-led hero, solid navigation island, balanced
custom controls, field-local validation, lime run-of-show, explicit automatic
advances, centered trophy final, in-node corrections, scorer, dialogs, and
results meet the contract across the required orientations with no open
P0/P1/P2 findings.
