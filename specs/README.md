# Feature workspace router

Select one workspace by the product surface being changed. Read that
workspace's `spec.md`, `plan.md`, `tasks.md`, and `verification.md`; do not use
older adjacent workspaces as background unless the selected workspace links to
them.

The full folder name is the identifier. Numeric prefixes preserve creation
order but are not unique (`015-serve-tracker` and
`015-small-field-round-robin` are separate workspaces).

| Product surface                                | Workspace                                                                                  |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Original offline tournament PWA                | [001-offline-tournament-pwa](./001-offline-tournament-pwa/spec.md)                         |
| Session continuity and sharing                 | [002-session-continuity-sharing](./002-session-continuity-sharing/spec.md)                 |
| Late entry challenge                           | [003-late-entry-challenge](./003-late-entry-challenge/spec.md)                             |
| Victory sharing and scorer polish              | [004-victory-sharing-scorer-polish](./004-victory-sharing-scorer-polish/spec.md)           |
| Tournament controls and sharing                | [005-tournament-control-sharing](./005-tournament-control-sharing/spec.md)                 |
| Result preview and desktop download            | [006-result-preview-download](./006-result-preview-download/spec.md)                       |
| Share/results repair                           | [007-share-results-repair](./007-share-results-repair/spec.md)                             |
| Responsive bracket and premium sharing         | [008-responsive-bracket-premium-sharing](./008-responsive-bracket-premium-sharing/spec.md) |
| Share flow and iPad polish                     | [009-share-flow-ipad-polish](./009-share-flow-ipad-polish/spec.md)                         |
| iPad bracket/share follow-up                   | [010-ipad-bracket-share-followup](./010-ipad-bracket-share-followup/spec.md)               |
| Bracket balance and Story tree                 | [011-bracket-balance-story-tree](./011-bracket-balance-story-tree/spec.md)                 |
| Node layout, rename, and labels                | [012-node-layout-rename-labels](./012-node-layout-rename-labels/spec.md)                   |
| Bracket card state and portrait tree           | [013-bracket-card-state-tree-repair](./013-bracket-card-state-tree-repair/spec.md)         |
| Four-player round robin and finals             | [014-round-robin-finals](./014-round-robin-finals/spec.md)                                 |
| Serve tracker                                  | [015-serve-tracker](./015-serve-tracker/spec.md)                                           |
| Small-field round robin and finals             | [015-small-field-round-robin](./015-small-field-round-robin/spec.md)                       |
| Session recap and share images                 | [016-session-recap](./016-session-recap/spec.md)                                           |
| Premium share composer and tournament identity | [017-share-composer-tournament-identity](./017-share-composer-tournament-identity/spec.md) |

Each workspace uses the same handoff:

`spec.md` (what) → `plan.md` (how) → `tasks.md` (next) →
`verification.md` (proof)

Executable checks and reviewed artifacts are the authority. A completed file,
checked box, screenshot, or nonempty output directory is not proof by itself.
