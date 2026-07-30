# Frontend Design QA

Status: blocked
Last updated:

## Environment

- Commit/source state:
- Browser:
- Base URL:
- DPR:
- Stable-data/animation setup:

## Evidence

| Route/state | Viewport | Source capture | Render capture | Combined comparison | Interaction run | Axe result |
| ----------- | -------- | -------------- | -------------- | ------------------- | --------------- | ---------- |

## Iteration History

| Iteration | Region | Pixel signal | Human finding | Change | Result |
| --------- | ------ | ------------ | ------------- | ------ | ------ |

Pixel difference is an iteration signal, not a universal pass threshold.

## Findings

| ID  | Severity | Route/region | Evidence | Contract/user impact | Owner | Status |
| --- | -------- | ------------ | -------- | -------------------- | ----- | ------ |

Severity:

- P0: unusable, crash, missing primary content/action, security or data-loss risk
- P1: major identity, layout, responsive, interaction, or accessibility failure
- P2: visible fidelity/UX defect that materially weakens polish or comprehension
- P3: minor cosmetic deviation

## Harness Results

- [ ] Route and interaction coverage passed.
- [ ] Dead-control audit passed.
- [ ] Raw-asset policy passed or exceptions are documented.
- [ ] Desktop and mobile screenshots captured.
- [ ] Console checks passed.
- [ ] Keyboard/focus checks passed.
- [ ] Reduced-motion behavior passed.
- [ ] Automated Axe checks passed.
- [ ] Every P0/P1/P2 finding is closed.

## Final Decision

Reviewer: `design_reviewer`
Reviewer result: `passed` or `blocked`
Reviewer evidence: `docs/frontend/reviews/design-review.md`

Result: `passed` or `blocked`

Rationale:

For a passed result, replace the placeholder with `Result: passed`, provide at least one complete evidence row, and leave no open P0/P1/P2 finding.
