# Implementation Plan

1. Add a pure victory-context formatter and acceptance tests.
2. Build a responsive result celebration with the existing mascot and an
   accessible canvas-confetti boundary.
3. Split canvas drawing into cohesive common, quick-result, and bracket modules;
   make builders asynchronous so the local mark is guaranteed to render.
4. Replace fixed scorer heights with a viewport-bound grid and add the idle
   Start match overlay.
5. Move draw utilities into the Full draw heading and preserve their selectors.
6. Update frontend contracts, evidence, notices, and browser coverage.
