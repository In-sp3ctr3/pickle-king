# Bracket Card State and Portrait Tree Repair

## Goal

Restore balanced, state-specific tournament nodes and replace the portrait
export's crossing rail network with a conventional dependency-readable tree.

## Requirements

- A recommended or startable match uses a three-part header: round at left,
  queue state centered, and edit at right.
- Its play action aligns with the midpoint of the two participant rows.
- The visible outer inset is balanced on every card edge; the header must not
  create a larger top gap than the remaining edges.
- Waiting and queued nodes do not reserve a play-action column. Their round and
  status sit at opposite header edges and their participant rows use the full
  card width.
- Complete and live nodes reserve only the controls actually rendered.
- Post and Story / Reel exports use a conventional mirrored bracket tree. Each
  pair of source matches joins once and only into its declared dependent match.
- Unrelated dependency paths do not cross, overlap, merge, or enter another
  match card.
- The final, third-place match, podium, background, and champion identity keep
  their existing visual treatment.

## Non-goals

- Changing tournament scheduling, scoring, seeding, or persistence.
- Redesigning the final node in the interactive bracket.
- Redesigning the champion card or arena asset.
