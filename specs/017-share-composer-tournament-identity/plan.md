# Implementation Plan

## Approach

- Keep the existing Canvas renderers and file boundary. Add one dialog shell and
  one format control used by the three existing orchestration dialogs; do not
  create a renderer DSL or config-driven modal engine.
- Keep saved-result handoff state in `AppShell`. Capture the confirmed result
  with the same completion timestamp used by the existing reducer, then render
  the celebration only after the reducer transitions to its normal destination.
- Keep Quick thumbnail generation local to the Quick composer. Build the
  selected preview first, then request the two alternate active-ratio files
  sequentially through the existing preview cache.
- Restyle tournament renderers in place so entry points, archive data, formats,
  filenames, and share APIs remain compatible.

## Frontend Contract

- Mode: reference-derived product.
- Authority: the five supplied Quick Match/Receipts posters, the approved
  canonical lockup, and the current deterministic tournament data model.
- Signature experience: functional DOM/CSS composer with native Canvas output.
- Representation: semantic DOM/CSS, native scrolling, current Canvas helpers,
  local templates and fonts. No new dependency, Figma source, registry code,
  image generation, or backend.
- Breakpoints: stacked full-height composer below 820px; two-column composer at
  820px and wider. Phone landscape uses the two-column arrangement when space
  permits.

## Delivery Order

1. Lock specification, ADR, frontend contract, capability plan, direction
   receipt, and isolated functional prototype.
2. Add failing format/default, result-handoff, and composer workflow tests.
3. Implement the shared dialog shell and ratio control; migrate Quick/history,
   recap, and tournament orchestration without changing renderers.
4. Add actual Quick design thumbnails and selected-first generation.
5. Redesign Champion, Standings, and Full draw renderers within existing
   signatures.
6. Update route controls, offline assets, visual targets, and regression gates.
7. Run targeted checks, browser/visual review, full repository checks, and the
   current frontend release receipt.

## Rollback

The feature adds no persisted data. Reverting the composer, handoff state,
renderer styling, and new static templates restores the previous behavior
without migration or cleanup.
