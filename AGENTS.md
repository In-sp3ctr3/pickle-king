# Pickle King Agent Rules

## Scope boundary

- This file contains Pickle King-only routing, commands, fixtures, dimensions,
  and risks. Keep those facts in this repository and its `specs/<feature>/`
  artifacts; do not copy them into global Codex instructions or skills.
- Inherit reusable engineering and QA methodology from the global Codex
  `AGENTS.md` and skills. Specialize it here only where this product needs a
  stricter or concrete gate.

Keep work feature-scoped. Use `specs/README.md` to select the active feature,
then read its `spec.md`, `plan.md`, `tasks.md`, and `verification.md` plus only
the implementation and tests on that path. Do not load unrelated specs for
background.

## Feature workspace contract

- `spec.md` owns requirements, non-goals, and acceptance criteria.
- `plan.md` owns the chosen approach, affected boundaries, risks, and order.
- `tasks.md` owns executable slices and the current handoff/next action.
- `verification.md` owns current-tree evidence mapped to acceptance criteria,
  plus skipped checks and remaining risks.
- `gates.md`, when present, is a summary and must agree with
  `verification.md`. Contradictory status is a failed gate.
- Route by exact file or section. Load generated evidence and stable reference
  material only when the current slice needs it.

## Delivery

- Work one bounded slice at a time. Record durable requirements and handoff
  state in `specs/<feature>/`; do not rely on chat history as project memory.
- Reproduce every reported regression with a failing executable check before
  repairing it. Keep the real production fixture as a permanent regression.
- Define the input partitions before implementation: minimum, typical,
  maximum, every representation-width transition, and the reported failure.
  A few happy-path examples are not a boundary matrix.
- Prefer deterministic outcome checks. File existence, command success, and
  screenshots without assertions are evidence collection, not validation.
- Use a fresh implementation/review context when a slice is complete or the
  task changes materially. The implementation agent does not approve its own
  subjective visual work.

## Share-image gate

- For changes under `src/features/share/`, read
  `specs/016-session-recap/spec.md` and run `npm run test:share-visual`
  against the production server.
- Exercise the generated PNG in a real browser at 1080x1350 and 1080x1920.
  Cover every treatment plus one- and two-digit scores, the accepted name
  limit, and any persisted legacy boundary affected by the change.
- Assert dimensions, content, safe geometry, and a reviewed visual baseline.
  Creating a PNG or sampling that some pixels exist cannot prove spacing,
  clipping, font consistency, or non-overlap.
- Do not update a visual baseline until a human or independent visual reviewer
  has inspected the rendered artifact at full resolution.

## Verification claims

- `passed` means the named command ran successfully against the current tree.
  Say `manual` or `not CI-enforced` when that is the truth.
- A QA record must map each acceptance criterion to an executable assertion or
  an exact reviewed artifact. Never infer “no findings” from unrelated green
  checks.
