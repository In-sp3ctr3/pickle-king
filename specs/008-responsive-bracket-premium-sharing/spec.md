# Responsive Bracket and Premium Sharing Repair

## Goal

Make tournament setup, the live bracket, archived results, and every exported
image trustworthy and polished on phones, iPads, and desktop screens.

## Requirements

- Long player names remain inside match nodes, run-of-show cards, dialogs, and
  exports without overlap.
- Completed matches say `Complete`; the championship node is compact,
  visually distinct, and keeps editing in its header.
- Draw setup offers plain-language Ranked and Random modes. An untouched Random
  draw can be rerolled; any started result locks the draw.
- Court controls remain contained at 390, 768, 820, 1024, 1180, and 1440 pixel
  viewport widths.
- Quick results, tournament recap, and stats export at 1080×1350 and
  1080×1920. The full bracket exports at 1600×1200.
- Every export uses the local text-free arena asset while dynamic names, scores,
  medals, bracket nodes, and results remain deterministic Canvas content.
- iPhone and iPad use one native Share / Save action. Desktop keeps explicit
  Share and Download actions.
- Completed tournaments can be reopened from local history without replacing
  an active tournament.

## Privacy

Player names, results, previews, and generated PNGs remain on device until the
operator invokes the browser share or download boundary.
