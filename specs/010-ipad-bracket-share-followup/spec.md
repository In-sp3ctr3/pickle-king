# Feature Specification: iPad Bracket and Share Follow-up

## Goal

Repair the remaining iPad bracket hierarchy and simplify share/setup controls
without changing tournament persistence or scoring behavior.

## Requirements

- Share format controls use the concise labels `Post`, `Story / Reel`, and
  `Full draw`, remain side by side, and preserve explicit user choice.
- Tournament setup offers a visible Reset all action that clears the roster and
  restores default rules without deleting local history or name suggestions.
- New tournament names are limited to 24 characters. Run-of-show opponents use
  stacked rows around `vs`; bracket participant rows never break inside a name.
- User copy does not expose internal seeding terminology or the removed Upset
  watch strip.
- Every editable match places the same compact pencil in its header.
- The final keeps both scores aligned beside a centered trophy. Third place is
  centered directly below the final inside the same bracket canvas, without a
  connector or a separate page section.
- Portrait exports use a top-to-bottom, two-column tournament flow and a
  conventional silver–gold–bronze podium with the champion centered.
- Tournament-stat exports use compact editorial highlights instead of large,
  mostly empty cards.

## Non-goals

- Automatic share-format selection by device.
- Destination-specific Instagram controls.
- Persistence migration for previously saved 25–40 character names.
