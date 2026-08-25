# Implementation Plan

## Technical Approach

- Add a pure recap aggregate beside the existing history domain and cover it
  with Vitest before UI integration.
- Keep selection state inside the history feature and introduce a dedicated
  recap dialog because the existing single-image dialog cannot represent
  format tabs or multiple files cleanly.
- Reuse existing Canvas/file primitives and add only build-time Sharp plus the
  three local export faces. Ten reference-derived templates preserve stable
  shaded artwork; all match facts remain deterministic Canvas text.
- Add one lazy treatment dimension to the existing single-image dialog rather
  than introducing a second Quick Match sharing workflow.
- Replace tournament renderer styling in place so existing share entry points
  and data contracts do not change.
- Keep history persistence at version 2 and create no new route, runtime
  rendering framework, or generic template engine.
- Raise the shared recap page size to twelve and add dedicated compact Post and
  Story templates for 9–12-row pages.
- Use a finite profile table for regular (1–6), dense (7–8), and compact
  (9–12) geometry. Center each rendered Player, W-L, and +/- bitmap between
  explicit rules instead of dividing every table by the twelve-row capacity.
- Draw recap subtitles and rows as measured Canvas text. Use native text
  metrics and `Intl.Segmenter` for balanced, grapheme-safe Quick winner lines.
- Reduce new player entry to 16 trimmed characters while retaining the existing
  40-character persistence ceiling.

## Frontend Contract

- Mode: audit and repair.
- Authority: supplied Aug 22 Singles and Doubles Receipts posters plus the
  existing Match Ledger and share-preview behavior.
- Static representation: semantic DOM/CSS for selection and native Canvas for
  deterministic PNG exports. No new animation or prototype is required.
- Required viewports: 390x844, 844x390, 820x1180, 1180x820, and 1440x1000.

## Delivery Order

1. Lock scope, architecture, frontend direction, and verification gates.
2. Implement tested recap aggregation and page grouping.
3. Implement tested multi-file sharing.
4. Integrate ledger selection and the recap dialog.
5. Lock the five authorities and generate ten deterministic Post/Story bases.
6. Replace recap and Quick approximation geometry with reference-locked art,
   measured dynamic text, and hard font readiness.
7. Render and compare matched-data Post, Story, continuation, and treatment outputs.
8. Run independent design review, browser QA, and full release gates.
9. Calibrate 12-player Post/Story pages and 16-character Quick winner fixtures,
   then regenerate the release evidence.

## Rollback

The feature adds no persisted state. Reverting the new UI, calculation, and
share files restores the prior behavior without migration or data cleanup.
