# Bracket viewport prototype

Status: passed

- Integrated artifact: `src/features/bracket/bracket-viewport.tsx`
- Representation: semantic DOM/CSS transform with native Pointer Events; no
  bitmap canvas, WebGL, new package, or copied registry source.
- Dynamic fit: uses measured viewport and board dimensions, including a 24px
  inset, and clamps every scale to the computed fit value through 200%.
- Overview safety: the bracket opens centered and interactive at 100%. Fit is
  opt-in, and match controls are inert whenever its scale falls below 100%.
- Direct manipulation: two captured pointers retain the board coordinate under
  the moving pinch midpoint. A six-pixel drag threshold preserves taps, and
  pointer up/cancel releases capture and clears panning state.
- Alternatives: visible Fit, Reset, zoom-out, and zoom-in controls plus F, 0,
  +/−, and arrow-key equivalents. The current percentage remains visible
  without announcing every pinch update.
- Reduced motion: transforms update directly with no transition or animation.

## Runnable evidence

`npm test -- --run src/features/bracket/bracket-viewport.test.tsx`

The five focused checks cover complete-board fit, finite anchored bounds,
initial 100% centering, read-only overview, 200% clamping, pinch midpoint
anchoring, drag threshold, pointer-cancel/lost-capture cleanup, stale-click
cleanup, modifier-wheel input, and keyboard alternatives.

Decision: passed for integration into the existing `BracketTree` viewport.
