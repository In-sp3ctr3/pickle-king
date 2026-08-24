# Session Recap Signature Experience

Status: ready
Pipeline version: 2
Research required: no
Motion required: no
Motion reason: the signature output is a static, deterministic receipt; normal
focus and pressed feedback are sufficient for the selection workflow.

## Product Story

Experience type: static

- Input: an operator selects completed Quick Matches from the local ledger.
- Transformation: Pickle King separates formats, calculates honest player and
  pair records, and paginates them into the approved receipt composition.
- Output: branded Post or Story PNG pages ready for explicit local sharing.
- User value demonstrated: an informal court session becomes a polished recap
  without re-entry, AI, or a false tournament claim.

## Direction

The existing editorial Match Ledger gains a temporary selection state. The
generated artifact is a light Canvas poster derived directly from the supplied
Receipts references, while the surrounding preview retains the current dark
dialog and explicit share/download behavior.

## Storyboard

| Stage    | Time      | Visual state                                 | QA signal             | Reduced motion |
| -------- | --------- | -------------------------------------------- | --------------------- | -------------- |
| Select   | immediate | Latest ledger day checked with editable rows | selected count status | same           |
| Preview  | generated | Cream receipt inside the existing modal      | local PNG visible     | same           |
| Continue | immediate | Format, output size, or receipt page changes | tab and page state    | same           |

## Implementation

- Selected rung: semantic DOM/CSS for selection plus native Canvas for the
  requested static PNG artifact.
- Why this rung is necessary: structured text remains accessible in the app,
  while Canvas guarantees exact social-image dimensions and offline export.
- Rejected simpler options: screenshots cannot provide a reliable browser event
  or clean export; server/AI generation would violate local-first privacy.
- Prototype required: no
- Desktop: ledger selection remains an editorial row list with a bounded action rail.
- Mobile: each row exposes one 48px checkbox target and stacked recap actions.
- `prefers-reduced-motion` behavior: no recap-specific motion is introduced.
- Static fallback: when multi-file sharing is unsupported, each visible page
  remains individually shareable or downloadable.
- Measurement: record first-page and complete-page-set encoding time during QA.

## Performance Budget

- No new runtime dependency, remote request, WebGL, or stored image.
- Build the visible page first. Encode remaining pages sequentially only after
  Share all pages is requested.
