# Feature Specification: Tournament control and sharing

## Goal

Make mixed-skill knockout nights kinder to recreational players, make every
on-court action obvious, and make completed tournaments replayable and worth
sharing without weakening bracket integrity.

## Product decisions

1. Draw style is explicit:
   - **Competitive** uses standard seeded placement and protects top seeds.
   - **Social** pairs the closest available ratings in opening matches and
     distributes unavoidable byes deterministically. It is not presented as a
     competitively seeded draw.
2. The recommended match remains visually primary. Any ready match in the
   earliest unfinished round may start; later rounds remain locked.
3. A bracket-node name edit renames the stable player identity everywhere. It
   never substitutes a different participant into recorded history.
4. Completed tournaments can replay the same deterministic draw or return to a
   prefilled setup with a new draw seed. Both paths clear results.
5. Results are read-only. Score correction belongs to the bracket.
6. Tournament sharing is a focused choice between champion/podium, player
   statistics, and the full draw rather than one unreadable composite.

## Requirements

1. Scoring keeps the large tap target and adds explicit `+1 point` and
   `Undo −1` controls for both sides.
2. The scorer, result review, and score image name meaningful tournament stages:
   Semifinal, Third place, and Final. Earlier rounds retain the generic match
   label.
3. Score-event history supports accurate undo and records a comeback only when
   the eventual winner trailed by at least three points.
4. The final node uses a compact centered faceoff composition with one trophy
   and no unexplained whitespace.
5. Podium places show gold, silver, and bronze medals and a one-shot celebration.
6. Champion headline and supporting copy are deterministic and selected by
   priority: comeback, undefeated run, upset, then a seeded copy pool.
7. Share success, cancellation, and failure feedback clears automatically.
8. No user-facing prose uses em dashes.

## Deferred

- Round-robin and pool-play tournament formats.
- Structural participant substitution inside a completed node.
- Remote tournament history, accounts, or cross-device sharing.

## Non-functional constraints

- Existing version-1 snapshots migrate through schema defaults.
- Player data and generated images remain on device.
- Hand-authored TypeScript and TSX files remain below 300 logical lines.
- Tablet landscape and portrait remain primary verification targets.
