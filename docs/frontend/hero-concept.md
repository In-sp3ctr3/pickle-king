# Premium Share Composer Signature Experience

Status: ready
Pipeline version: 2
Research required: yes
Motion required: no
Motion reason: selection, preview replacement, and sticky actions communicate
state without authored animation; native scrolling and existing pressed/focus
feedback are sufficient.

## Product Story

Experience type: functional

- Input: a confirmed result, selected recap, or completed tournament.
- Transformation: the operator selects an honest output ratio and an applicable
  visual artifact while viewing the exact locally generated PNG.
- Output: a Story, Post, or Full draw file handed to native Share or explicit
  Save without another data write.
- User value demonstrated: saving the sporting result and styling its social
  artifact are clear, reversible decisions rather than one crowded dialog.

## Storyboard

| Stage     | Trigger               | Visible state                              | User action              | Fallback                       |
| --------- | --------------------- | ------------------------------------------ | ------------------------ | ------------------------------ |
| Review    | match ends            | score truth, Edit, Confirm                 | confirm the saved result | edit returns to scorer         |
| Celebrate | persistence completes | Result saved summary                       | share or continue        | dismiss keeps saved data       |
| Compose   | Share result          | Story preview, ratio, visual rail, actions | select, share, or save   | error retains available action |

## State Model

| State   | Entry                               | Content                                  | Exit                          | Failure behavior                   |
| ------- | ----------------------------------- | ---------------------------------------- | ----------------------------- | ---------------------------------- |
| review  | scorer awaits confirmation          | result truth only                        | Edit or Confirm               | no persistence on Edit             |
| saved   | reducer completes                   | immutable result summary                 | Continue or Share result      | dismiss never rolls back           |
| loading | composer opens or selection changes | skeleton in exact preview frame          | matching file resolves        | inline error and Save/close remain |
| ready   | active file resolves                | preview, ratios, choices, sticky actions | Share, Save, close, or select | cancellation returns to ready      |

## Representation

- Selected rung: semantic DOM/CSS for the composer and native Canvas for exact
  deterministic PNGs.
- Why this rung is necessary: the controls must remain semantic and accessible,
  while Canvas is already the verified offline boundary for exact social-image
  dimensions and typography.
- Rejected simpler options: retaining the separate dialogs repeats the same
  hierarchy and focus defects; a text-only selector hides the visual choice.
- Rejected simpler rung: keeping three separate dialogs repeats focus,
  responsive, and action hierarchy defects.
- Rejected higher rungs: no gesture library, carousel package, Figma source,
  image generation, video, WebGL, or destination SDK is needed.
- Prototype required: yes
- Prototype route/artifact: isolated responsive HTML composer using current
  exact Quick result files; no production route.
- Prototype acceptance criteria: Story selected, exact preview dominant,
  labelled visual rail, visible adjacent choice, and sticky Share/Save actions.
- Prototype evidence: docs/frontend/evidence/share-composer-prototype.png
- Approved by: product owner through the 2026-08-26 implementation plan; local
  artifact inspection confirms the agreed hierarchy.
- Prototype decision: passed
- Desktop: two-column modal at 820px and wider with the preview left and the
  controls/action rail right.
- Mobile: full-height stacked dialog with native horizontal scroll-snap visual
  choices and sticky bottom actions.
- `prefers-reduced-motion` behavior: immediate state replacement; no auto-rotation or inertial
  scripted carousel.
- Static fallback: labeled buttons remain the primary selector; native scrolling
  is optional assistance rather than required input.
- Measurement: capture responsive geometry, preview-generation latency, exact
  PNG dimensions, and object-URL cleanup in the production browser suite.

## Performance Budget

- Selected full preview: <=600ms cold and <=250ms from decoded local assets on
  the production browser fixture.
- Alternative Quick thumbnails build sequentially after the selected preview.
- No new runtime dependency or remote request. Object URLs are revoked when a
  choice, ratio, or composer is discarded.
