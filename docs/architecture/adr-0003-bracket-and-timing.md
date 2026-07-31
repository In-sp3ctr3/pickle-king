# ADR 0003: Seeded bracket and deadline timers

Status: accepted  
Date: 2026-07-30

## Decision

Use standard power-of-two seeded bracket positions, assign byes to high seeds,
and deterministically shuffle only equal ratings. Complete rounds before the
next round, schedule the bronze match before the final, and order other ready
matches by longest rest.

Tournament and Quick Match clocks are optional. In timed play, persist match
deadlines and paused milliseconds; never persist interval tick counts. In
untimed play, persist a null cap and create no artificial deadline. A side wins
after reaching the target with a two-point lead. At a timed deadline the leader
wins and a tie enters golden point.

## Consequences

Seeds are separated fairly, reload/sleep does not freeze time, and the schedule
is predictable on one court. Untimed sessions do not require fake booking data.
One target applies throughout a tournament to keep rounds competitively
consistent and scheduling comprehensible. Ratings remain an input rather than
a claim about post-tournament skill.

A bye is a real competitive benefit: its recipient plays one fewer match and
receives more rest. The benefit is deliberately assigned to the strongest
self-rated seeds, not sampled randomly. When players share the same rating, the
stored deterministic shuffle decides their relative seeds, so the result may
look random but remains reproducible. This is standard seeded-draw behavior,
but its fairness depends on the group trusting the self-ratings.
