# Home Product Sequence

Status: ready  
Research required: yes  
Motion required: yes  
Motion reason: advancement and protected rest are the product mechanism.

## Product mechanism

- Input: a seeded list of friends and a fixed court booking.
- Transformation: opponents advance across a one-court, rest-aware bracket.
- Output: a crowned champion before the session deadline.

This sequence would stop making sense in an unrelated product because its court
queue, match connectors, score change, and crown are the actual tournament flow.

## Storyboard

| Beat | Visual state                                       | Trigger           | Timing     | Meaning           |
| ---- | -------------------------------------------------- | ----------------- | ---------- | ----------------- |
| 1    | four abbreviated players occupy quarterfinal lanes | page entry        | 0–250ms    | seeded field      |
| 2    | lime connector carries two winners forward         | after entry       | 250–650ms  | advancement       |
| 3    | clock gains a small rest-buffer chip               | after advancement | 650–850ms  | schedule fairness |
| 4    | crowned pickleball lands over champion lane        | final beat        | 850–1300ms | outcome           |

## Implementation

- Rung: DOM/CSS with Motion plus one generated raster mark.
- Custom code is necessary because the sequence maps to Pickle King’s exact data.
- Skiper Pro bracket code is rejected; the bracket is original.
- Idle animation does not loop. Offscreen sequences do not run.

## Responsive and accessibility

- Desktop: bracket sits beside the headline.
- Tablet: bracket becomes a full-width strip below actions.
- Mobile: three compact vertical beats; supporting detail is hidden.
- Semantic equivalent: “Seed players, protect rest, crown a winner.”
- Reduced motion: the final connected bracket renders immediately.
- The visual is decorative and hidden from the accessibility tree.

## Performance budget

- Motion package shared with product interactions.
- Generated mark under 80KB where practical.
- No canvas, WebGL, video, remote font, or runtime asset request.
