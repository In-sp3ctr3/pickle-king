# Share Flow and iPad Polish

## Goal

Make result sharing truthful and immediate, make brackets readable on iPad,
and provide complete portrait and landscape tournament exports.

## Requirements

- Native share completion uses neutral `Done`; explicit downloads use `Saved`.
- Result previews never show stale artwork and use Post (4:5) or Story / Reel
  (9:16) dimensions before opening the operating-system share sheet.
- Confirmed Quick Matches are recorded once and return directly to setup.
- Participant labels remain on one line, shrink within a readable range, and
  ellipsize only when necessary.
- The final node is compact, symmetric, and free of decorative ribbons or
  waiting-score placeholders.
- Completed brackets and the home screen provide a direct route back to results.
- Brackets export as 1600x1200 Full draw, 1080x1350 Post, and 1080x1920
  Story / Reel images with every match present.
- Tournament stats use computed editorial highlights instead of a closest-match
  facts table.

## Privacy

All previews are generated locally. Player names and scores leave the device
only after the operator invokes native sharing or downloads a file.
