# ADR 0007: Competitive and Social knockout draws

Status: accepted
Date: 2026-08-03

## Context

Standard single-elimination seeding separates the strongest entrants, which
often places the strongest and weakest players together in the opening round.
That is competitively coherent but can make a mixed-skill friends night feel
punitive. A fully random draw does not solve the problem because it can produce
the same mismatch by chance.

USA Pickleball allows tournament directors to select a format appropriate to
the event and recognizes seeded knockout, round robin, and pool play. Its
guidance treats round robin as useful for smaller fields. Round robin would,
however, change Pickle King's match-count and timing model rather than repair
the existing knockout experience.

Sources:

- [USA Pickleball approved formats](https://usapickleball.org/sanctioning/formats/)
- [USA Pickleball official rules](https://usapickleball.org/rules/)

## Decision

Offer two explicit knockout draw styles:

- **Competitive** uses standard seeded placement, gives top seeds unavoidable
  byes, and prevents the top two from meeting before the final.
- **Social** pairs adjacent seeded ratings in the opening round and allocates
  unavoidable byes through the stored deterministic seed. It states that
  stronger players may meet earlier and does not claim competitive seeding.

Equal-rated ordering remains deterministic for both styles. A stored draw seed
recreates the exact draw. A new draw returns to the prefilled setup and creates
a new seed only when the bracket is rebuilt.

## Consequences

- Players choose the tradeoff instead of receiving an unexplained compromise.
- Social reduces expected opening skill gaps but does not make knockout equal
  participation.
- Competitive remains the default and preserves existing saved sessions.
- Pool play and round robin remain the future participation-first formats in
  ADR 0004.

## Verification

- Competitive top-seed and bye invariants remain unchanged.
- Social non-bye opening pairs are adjacent by rating/seed.
- Every entrant appears exactly once for 4 through 16 players.
- Both styles reproduce the same draw from the same seed.
