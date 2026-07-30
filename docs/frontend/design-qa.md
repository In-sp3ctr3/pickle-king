# Frontend Design QA

Status: passed
Last updated: 2026-07-30

## Environment

- Commit/source state: codex/feat/pwa-polish@c1bfc51323ae9e8f447449a352c446499fc6567c + dirty snapshot e4a8b7dd17691335bc5a9cc8ee79f0db543799849bfbed455deda06f9b392d3d
- Browser: Playwright Chromium 1.62.1
- Base URL: http://127.0.0.1:3000 production Vinext server
- DPR: Playwright default at 1440×1000 and 390×844
- Stable-data/animation setup: distinct fixed ratings, cleared localStorage,
  blurred focus before capture, awaited hero settled state, and reduced-motion
  checks isolated from animated captures

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

| Iteration | Region        | Pixel signal           | Human finding                                                  | Change                                                                | Result |
| --------- | ------------- | ---------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------- | ------ |
| 1         | Home hero     | reference mismatch     | rectangular/static artwork felt pasted on                      | staged multi-mask paint impact and text reveal                        | passed |
| 2         | Setup shell   | excessive framing      | divider bars and repeated outlines flattened hierarchy         | removed rules; added numbered editorial sections and tonal court slab | passed |
| 3         | Bracket       | geometry mismatch      | round cards did not read as one connected draw                 | centered double-sided tree with functional convergence lines          | passed |
| 4         | Result review | interaction regression | score edits repeatedly reopened confirmation                   | dedicated edit state and one review action                            | passed |
| 5         | Final QA      | targeted visual review | Quick Match mentioned a bracket; mobile stats headers collided | contextual copy and compact semantic headers                          | passed |

Pixel difference is an iteration signal, not a universal pass threshold. The
final deterministic source/render pairs are byte-identical.

## Findings

| ID     | Severity | Route/region         | Evidence                                 | Contract/user impact                          | Owner    | Status |
| ------ | -------- | -------------------- | ---------------------------------------- | --------------------------------------------- | -------- | ------ |
| DQA-01 | P2       | quick-result/dialog  | quick-result desktop and mobile captures | standalone flow mentioned nonexistent bracket | frontend | fixed  |
| DQA-02 | P2       | results/mobile table | results mobile capture                   | Against and Diff labels collided              | frontend | fixed  |

## Harness Results

- [x] Route and interaction coverage passed.
- [x] Dead-control audit passed.
- [x] Raw-asset policy passed or exceptions are documented.
- [x] Desktop and mobile screenshots captured.
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

Rationale: the generated hero, editorial setup hierarchy, restored lime
run-of-show, centered connected bracket, scorer, dialogs, and results all meet
the contract across the required viewports with no open P0/P1/P2 findings.
