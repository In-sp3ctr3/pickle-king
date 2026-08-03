# Implementation Plan

## Architecture

- Add a pure `src/history` domain with a versioned bounded `SessionHistoryV1`.
- Persist history under its own localStorage key and schema; do not modify the
  active snapshot version for unrelated records.
- Add optional exact participant names to the scorer schema for backward-
  compatible Quick Match archiving.
- Add pure tournament rename and rebuild helpers. Renames preserve player IDs;
  structural edits call the existing bracket builder and preserve the original
  deadline in application state.
- Record archives in the application reducer at the result-confirmation
  transition, where duplicate confirmation is already state-guarded.
- Generate share images with browser Canvas and pass a PNG `File` to Web Share,
  falling back to download when file sharing is unavailable.

## Development Mode

- TDD for history bounds/idempotency, persistence corruption, rename
  propagation, and structural rebuild invariants.
- ATDD for the courtside edit, remembered-name, history, and share workflows.
- Characterization coverage around existing confirmation and persistence before
  changing reducer state.
- No generic repository/service layer; storage and domain functions remain
  direct and cohesive.

## Delivery Phases

1. Domain and persistence tests, then minimal implementation.
2. Reducer integration and backward-compatible hydration.
3. Custom remembered-name combobox and history route.
4. Draw editor and destructive structural-change confirmation.
5. Celebration and share-card generation.
6. Responsive/accessibility/browser verification, PR, merge, and Sites publish.

## Risks and Mitigations

- **Unfair live insertion:** never preserve arbitrary results across a
  structural reseed; make the reset consequence explicit.
- **Duplicate history:** derive stable record IDs and guard reducer transitions.
- **Storage exhaustion:** bound archives and validate on every load/save.
- **Share compatibility:** feature-detect file sharing and keep download fallback.
- **Accidental disclosure:** share only after a user action; no automatic upload.
- **Canvas clipping:** test fixed card dimensions and long-name truncation.
