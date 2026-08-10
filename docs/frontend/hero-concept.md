# Home Mascot Hero

Status: ready
Pipeline version: 2
Research required: yes
Motion required: yes
Motion reason: the existing Pickle King mascot arrives as the product identity
and blinks without introducing a separate product-demo illustration.

## Product Story

Experience type: static

- Input: a friend group needs to settle who runs the court.
- Transformation: the crowned mascot arrives and comes alive with one
  restrained blink.
- Output: a clear choice to start a tournament or open a quick scorer.
- User value demonstrated: Pickle King turns friendly competition into a
  decisive, courtside-ready session.

## Direction

The hero uses the existing text-free Pickle King mark at large scale beside a
short, direct headline. The mascot lands with one bounded entrance and blinks
at an idle interval. The art is not placed inside a card, frame, glow, or
decorative hero panel. Filled, tactile actions sit directly beneath the copy.

The previous court-rotation composition, paint reveal, and night-court image
are rejected because the user explicitly rejected product-demo art in the
hero.

## Storyboard

| Stage   | Time       | Visual state                              | QA signal                     | Reduced motion |
| ------- | ---------- | ----------------------------------------- | ----------------------------- | -------------- |
| Enter   | 0–420ms    | Mascot rises and settles at full opacity  | `data-motion-state="enter"`   | static         |
| Awake   | 420–1050ms | Mascot holds while the blink loop is live | `data-motion-state="awake"`   | static         |
| Settled | 1050ms+    | Static readable hero with periodic blink  | `data-motion-state="settled"` | static         |

## Implementation

- Selected rung: semantic HTML, the supplied raster mark, and CSS animation.
- Why this rung is necessary: it animates the requested existing logo without
  adding canvas, WebGL, video, or another generated asset.
- Rejected simpler options: a static logo would not preserve the approved
  restrained mascot-arrival identity.
- Prototype required: no
- Desktop: copy and mascot share the viewport.
- Mobile: actions remain before the mascot in a single reading column.
- `prefers-reduced-motion` behavior: no entrance or blink.
- Static fallback: the mascot remains visible with state `static`.
- Measurement: `data-motion-state` exposes enter, awake, settled, and static
  states to the frontend harness.
- Existing asset: `public/brand/pickle-king-mark.png`.
- Blink: two positioned eyelids; no altered duplicate raster or generated
  sprite.

## Performance Budget

- One already-cached 512px PNG.
- No new animation runtime or dependency.
- One bounded entrance plus a low-frequency CSS blink.
