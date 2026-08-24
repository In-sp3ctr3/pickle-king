# Implementation Plan

## Technical Approach

- Add a pure recap aggregate beside the existing history domain and cover it
  with Vitest before UI integration.
- Keep selection state inside the history feature and introduce a dedicated
  recap dialog because the existing single-image dialog cannot represent
  format tabs or multiple files cleanly.
- Reuse existing Canvas/font/brand and file primitives; add multi-file variants
  without changing existing single-file callers.
- Keep history persistence at version 2 and create no new route or dependency.

## Frontend Contract

- Mode: reference-derived product.
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
5. Render and compare Post, Story, and continuation-page outputs.
6. Run targeted and full repository/frontend gates, then record evidence.

## Rollback

The feature adds no persisted state. Reverting the new UI, calculation, and
share files restores the prior behavior without migration or data cleanup.
