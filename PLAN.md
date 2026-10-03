# Pickle King platform revamp — architecture brief (draft 1)

Status: draft for discussion, 2026-09-16. Nothing here is implemented.
North star: accounts + identity, official-grade tournament planning, internal
rating, DUPR sync. Budget: ~1,000 registered users, low concurrency, one live
tournament at a time (~10 courts scoring simultaneously).

## 1. Where the app is today (audit)

| Area                                               | Current state                                                                                                                                                                                                                                              | Gap vs north star                                                                                                 |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Hosting                                            | Next.js via vinext on Cloudflare Workers. `worker/index.ts` is the stock starter; no bindings, no server logic. ADR-0002 forbids server APIs.                                                                                                              | Needs a backend. Reverses ADR-0001/0002 → new ADR + threat model required (threat-model.md says so explicitly).   |
| Identity                                           | Free-text names. `Player.rating` is a self-reported `SkillLevel` string ("2.5"…"5.5+"). No IDs beyond client-generated.                                                                                                                                    | No user, profile, or stable player identity.                                                                      |
| Tournament engine (`src/tournament/`, ~3.6k lines) | Single-elim 4–16 players with bronze, round-robin → finals for small fields, ranked/random draws, late entry. Pure, deterministic (seeded PRNG), well tested. `MatchSide.memberIds` allows 1–2 but bracket builder only ever assigns 1 → **singles only**. | Doubles teams, divisions, double elimination, pool play → bracket, multi-court scheduling, registration/check-in. |
| Scoring engine (`src/match/`, ~1.1k lines)         | Reducer with rally snapshots (`rallyHistory`), serve tracker, court position, timed/untimed, corrections. Works fully offline.                                                                                                                             | Keep as-is. Needs a way to publish results/rallies to a server.                                                   |
| Persistence (`src/persistence/`)                   | Two localStorage keys, versioned Zod schemas, bounded history (50 QM / 10 tournaments).                                                                                                                                                                    | Becomes the offline cache/outbox, not the source of truth for cloud data.                                         |
| Rating                                             | None. Skill string used only for seeding.                                                                                                                                                                                                                  | Internal rating system + DUPR mirror.                                                                             |

The good news: domain logic is already isolated as pure TypeScript with no
React or storage dependencies. That is the single most valuable property for
this revamp. The same modules can run in the browser (offline scoring) and in
server functions (authoritative validation) unchanged.

## 2. Decisions to make (with recommendation)

### D1. Backend platform

| Option                          | Realtime                                  | Auth                                           | Offline story                                            | Lock-in                                                 | DIY glue                                                                    |
| ------------------------------- | ----------------------------------------- | ---------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------- |
| **Convex** (recommended)        | Native reactive queries; nothing to build | Clerk/WorkOS first-party; Convex Auth in-house | Client caches queries; writes need online (fine, see D4) | Medium; open-source, self-host possible but single-node | Lowest. Functions are TS → import `src/tournament` and `src/match` directly |
| Cloudflare D1 + Durable Objects | DO websockets, one DO per tournament      | Better Auth on D1, hand-wired                  | Same                                                     | Lowest (already on CF)                                  | Highest: assemble auth, realtime, migrations yourself                       |
| Supabase                        | Postgres changes over websocket           | Most mature managed auth                       | Same                                                     | Medium (Postgres portable)                              | Medium; SQL + RLS, TS domain code can't run in DB                           |

Recommendation: **Convex + Clerk**. At 1k users everything fits the free
tiers (Convex: 1M calls/mo, 0.5 GB; Clerk: 10k MAU). Convex functions are
TypeScript, so the existing pure engines become the server-side validators
with zero rewrite. Realtime bracket/scoreboard updates are free. Scaling
ceiling is far beyond 1k users; if Jamaica's scene explodes you pay Convex,
you don't re-architect. The Next app stays on Cloudflare; Convex is reached
over HTTP/websocket from the browser, not from the Worker.

### D2. Authentication

Decided: **Clerk** (managed). Email/password with breach checks, email
verification codes, magic link, password reset, optional Google/Apple
sign-in, session rotation, rate limiting, bot protection, MFA available.
SOC 2 Type 2, public DPA. One Clerk account holds many applications, each
with its own free tier (10k MAU), so the existing account is fine.
Downsides accepted: US-only data residency, third-party dependency on the
login path, and paid tiers if we ever pass 10k monthly active users.
Convex Auth was rejected because it puts credential-handling code in this
repo with a solo maintainer and has no security track record comparable to
Clerk.

Authorization lives in Convex functions: every mutation checks the caller's
identity against org and event roles (see D9). No trust in client-sent user IDs.

### D3. Identity model — the "my three friends won't sign up" problem

Decided: **claimable player profiles**, which is exactly what DUPR does.
DUPR auto-creates an "unclaimed" profile when a director submits a match for
someone without an account; the person later uses "Claim Your Account" and
must match on email. TeamSnap does the same for roster invites. Scoreholio
keeps email-less guests as unlinked records. So this is the industry norm,
not an experiment.

Research also found the failure mode: DUPR keeps unclaimed profiles forever
and has a manual support process for merging duplicates created by name
variants across tournaments. We avoid that with three rules:

1. **Ghosts are scoped to the org that created them** (see D9). They never
   appear in global search. Two orgs typing "Jadan" produce two ghosts, and
   that is fine; deduplication happens at claim time, by the person who
   knows which ones are theirs.
2. **Claim requires the organizer to pick the recipient, and then to
   confirm who showed up.** Creating a ghost asks for a name only.
   - **Claim link.** The organizer shows a QR or sends a single-use, 7-day
     link to the person they know. The link alone does **not** finalize:
     the claimant signs in, the invite records their Clerk name and email,
     and the organizer sees "Jadan Jones (jadan@…) wants to claim 'Jadan'"
     with one-tap confirm. A forwarded or screenshotted link therefore
     cannot hijack a profile; the worst case is a confirm prompt the
     organizer declines.
   - **Contact match.** If the organizer recorded an email or phone on the
     ghost and the claimant's Clerk-verified contact matches, the confirm
     step is skipped.
   - The claim mutation fails if the row is already claimed (same
     serialisable-mutation guarantee as the scoring claim). Both attempts
     are audited.
     There is **no** self-serve "that's me" request and no name search
     across orgs.
     2b. **Unclaim is protected in both directions.** Within 48h of a claim, or
     while the row has no rating events, the issuing organizer or the user
     can unclaim instantly. After that, an organizer-initiated unclaim needs
     the linked user's confirmation, or a 7-day notice with undo; a
     user-initiated unclaim is immediate. Every unclaim is audited and no new
     claim can attach during the notice window.
3. **Zero-match ghosts are purged after 90 days.** Ghosts with match
   history are kept indefinitely because deleting them would corrupt other
   players' rating history.

**Claim is a link, not a merge.** A `players` row is "one person's
appearance in one org". Claiming sets `players.userId`; nothing is moved.
One person may own several player rows (their own personal-org row plus a
ghost in each club that typed their name). Ratings, history and the
leaderboard are computed per **subject**, where subject = `userId` if
linked, else the `playerId`. Consequences:

- Unclaim is unsetting one field and recomputing the subject's rating from
  the event log (see 2b for who may do it and when). Nothing irreversible
  exists.
- Subject is computed at read time from `players.userId`; rating events
  store the `playerId` that played, never a subject, so claim and unclaim
  rewrite no history.
- Self-assessed skill and its lock live on the **subject**: on `users` for
  accounts, on the ghost row only while unclaimed. Once any linked row is
  locked, the account is locked. A fresh ghost cannot be used to re-enter a
  self-rated division at a lower level.
- Unclaimed ghosts never appear on leaderboards outside the org that
  created them, and inside it only to members. Nobody's name shows up
  publicly because an organizer typed it.
- No merge code, no tombstones, no repointing of match rows.
- A leaderboard row is one subject; a person with three linked ghost rows
  appears once.

Sign-up is never required to be entered in a tournament. It is required to
see your own history and rating, to self-report scores, and for DUPR sync.

### D4. Offline scoring

Storage split for Convex: the match document holds games, result, and
signatures only. Rally snapshots go to a `rallyLogs` table in chunks, and
a tiny `liveScores` document per match carries the current score for
spectator subscriptions. This keeps durable rally history, the realtime
score projection, and the match document separate without fixing when rally
chunks are transmitted.

Keep the scorer fully offline-capable. The scoring device is authoritative
for a match while it is in progress; the server is authoritative once a
result is submitted. Submission sends the final score plus `rallyHistory`
(already captured) so the server can replay/validate. Local persistence
becomes an **outbox**: unsent results retry when online. No CRDT, no
multi-device co-editing of a live match. If two scorers submit for the same
match, the second is rejected and surfaced to the organizer. The drain
re-checks the match's current status and result before applying; a match
voided or corrected while the device was offline yields `superseded`.

Scheduled jobs (Convex crons): DUPR outbox drain, zero-match ghost purge
(90d), scoring-claim expiry (3h), unsigned-result nudge and
staff-override eligibility (24h), DUPR outbox purge of `ineligible` items
(90d).

### D5. Internal rating

Glicko-2 (Glickman 2013), separate singles and doubles ratings. Rating
period = one match, the Lichess model: each result is processed as its own
period with system constant τ = 0.5 and the deviation inflated by
inactivity time before each update. This is a documented, widely used
adaptation for sparse online play and avoids the degenerate volatility
behaviour of naive per-game updates by bounding τ. Context weight is
applied as a multiplier on the match's contribution inside the period sum
(tournament 1.0, league 0.75, casual 0.5, conflicted 0.25), which is the
standard "weighted Glicko" generalisation; forfeits contribute 0. Doubles
use the composite-opponent technique: each player updates against a
pseudo-opponent whose μ is the mean of the opposing pair and whose φ is the
root-mean-square of their deviations, so a provisional partner widens the
uncertainty rather than being ignored. Recompute-from-log processes rating
events in `matches.finalAt` order, so an out-of-order correction produces
the same result as if it had never been wrong. Onboarding follows DUPR and Playtomic:
a new player picks a self-assessed level once at sign-up (or the organizer
picks it for a ghost). It seeds the Glicko-2 rating with high deviation, is
shown as "provisional" until ~10 rated matches, and is **not editable after
the first rated match**. Before that it can be changed. A reliability
indicator (derived from deviation) is shown next to the rating so a number
built on two matches doesn't look authoritative. Weight results by
context (tournament > league/lobby > casual), mirroring DUPR. Store rating
changes as an append-only `ratingEvents` log so the whole ladder is
recomputable from the match log if the formula changes. Display on the
2.0–8.0 scale so it feels familiar next to DUPR.

### D6. DUPR integration

Reality check from research (two passes, public sources only):

- DUPR Clubs are **free**. A club can upload matches manually/CSV and those
  count as club-verified (no player confirmation, higher weight).
- API access is granted per club through an application and an account
  manager. **No public pricing exists anywhere**: not on dupr.com, the help
  centre, GitHub, partner docs, or forums. Partners (Scoreholio, Swish,
  Playbypoint, Pickleheads) describe the integration as free to their
  users; what DUPR charges them, if anything, sits behind the Club
  Partnership Agreement. Your inference (they charge players for DUPR+ at
  $3.99/mo, so they probably charge partners) is plausible but unconfirmed.
- Two integration shapes exist: **club-scoped** (a Club ID in the software,
  results flow to the club) and **player-linked** (player signs into DUPR
  from inside the partner app, as Playbypoint and PB Vision do). Protocol is
  not documented publicly.
- No public evidence that the API can edit or void a submitted match; the
  club dashboard can reassign matches manually. Treat DUPR submissions as
  append-only and only send a match once it is `final` and past a
  correction window (e.g. 24h).

Sequencing decided: the schema, outbox, eligibility rules and adapter
interface are built with the internal rating; the actual HTTP connection is
wired only after the internal rating is proven and a DUPR Club exists.
Design around an adapter:

- `player.duprId` optional on profile. Players link it themselves.
- Matches are eligible for DUPR only when every participant has a `duprId`
  and the match is `final` (see D7).
- A `duprOutbox` table with idempotency keys; a scheduled Convex action
  drains it. Failures are retried and visible to the organizer.
- Everything DUPR-specific sits behind one adapter module so the unknown API
  shape doesn't leak into the schema.

Action for you: register the club and email DUPR about partner access now.
It's the longest lead-time item and it's not code.

### D7. Score entry, live scoring, and trust

The problem you raised: once results attach to real profiles and ratings,
"who is holding the phone" matters. Eight spectators must not be able to
post eight versions of a match. The design separates **running the scorer**
(anyone, always, works offline) from **posting the result** (gated).

**Rule 0: manual score entry is the primary path.** In official events
players call the score aloud and enter the final score at the desk or on
their phone. That is what every comparable product does and what most
matches here will do. So every ready match has an "enter score" action for
eligible users that produces a `recorded` submission directly. The live
scorer is **an input method for that same submission**, not a separate
system and not a source of trust. Whatever produced the numbers, the
result enters the identical state machine in Rule 3.

**Rule 1: the live scorer is a tool, posting is a permission.** Anyone can
open the scorer and track any match for their own use, offline, exactly as
today. Nothing they do reaches the server unless they hold the scoring
claim on that match (Rule 2). Its only extras over manual entry are the
rally log attached to the submission and, when online, a live scoreboard.

**Rule 2: one scoring claim per match, server-enforced, and it expires.**
When a match is `ready` (both teams resolved), an eligible user taps
"score this match". The server records
`matches.scorerUserId` and `scorerClaimedAt`. A second eligible user sees
"being scored by Jadan" and can only watch. Eligible means: event staff
(director, scorer, admin, owner of the owning org) **or a participant in
that specific match**. A random spectator is never eligible. Claims expire after 3 hours
(`scorerClaimExpiresAt`); staff can revoke sooner; and **staff manual
entry is always allowed regardless of any claim**, taking the claim over.
So a dead phone, a sulking loser holding the claim, or a spectator's stale
device can delay a match but never block it. A stale submission from a
superseded holder lands in the outbox's terminal `superseded` state and is
shown to them, not silently dropped.

**Rule 3: every result is co-signed, whoever recorded it.** This is how
sanctioned events already work: the scoresheet is signed by both teams
before it reaches the desk, and PickleballTournaments.com's player entry is
"winner enters, loser confirms". One state machine for every match:

| State      | Meaning                                                                                                                                                                                            | Who moves it                                       |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `recorded` | Claim holder submitted games and winner. Scorer can no longer edit.                                                                                                                                | claim holder                                       |
| `signed`   | One linked player from each side agreed on a screen showing the score large. Submitter's side is signed by submitting. A side with no linked player is signed by staff at the desk, as with paper. | linked participants, or staff for ghost-only sides |
| `final`    | All required signatures present. Bracket advances, rating moves, DUPR item queued.                                                                                                                 | automatic                                          |
| `disputed` | A side refused to sign. Nothing downstream happens.                                                                                                                                                | any signer; staff resolves                         |

Staff-scored matches still need both sides to sign; they simply start from
a more trusted recorder. `recorded` and `disputed` results count for
nothing. Signature semantics, made explicit:

- Each signature is typed: `submit` (recorder's own side, auto), `tap`
  (a linked player on that side), `staff-override`, or `conflicted`.
- A recorder who is not on either side (desk staff) auto-signs nothing;
  both sides tap.
- **Conflict of interest:** a user who is a participant in the match may
  never sign for the opposing side, staff-override it, or resolve its
  dispute. In club events the match waits for a non-participant staff or
  linked opponent. In personal-org lobbies (host plays too, opponents are
  ghosts) the host may sign with kind `conflicted`; the match is flagged,
  rated at weight 0.25, and never eligible for DUPR.
- **Timeout:** any side unsigned after 24h (configurable) may be signed by
  non-participant staff with kind `staff-override` and an audit row. This
  applies to sides with an unreachable linked player, not only ghost-only
  sides.
- A signature proves a session, not a person, the same as scoring (Rule
  1). Accepted limitation, documented; a PIN re-auth on sign is a later
  option if abuse appears.
- Disputes record a resolution `{byUserId, reason, at}` on the match even
  when there is no rally log.

**Rule 4: live broadcast is a bonus, not a dependency.** The scorer always
retains local `rallyHistory`. When connected, `liveScores` can carry the
current score so the bracket screen and spectators see it. Durable server
snapshots belong in chunked `rallyLogs`; whether those chunks are sent during
play or materialized from the final/offline submission is deferred to later
implementation work. Either way the end result is one submission through the
same gate.

**Rule 5: the phone cannot lie about the roster.** The server already knows
the two sides of a scheduled match. A submission carries only match id,
scores, winner, and rally log; the server rejects any submission whose
winner is inconsistent with the scores or whose scorer holds no claim.

Casual lobbies use the same rules with the lobby host as staff. A friends'
night where the host scores every game produces `final` results in their
personal org; a game scored by a participant needs the other side's tap.

**Corrections after `final` are loud, not quiet.** Rulebook 12.P gives the
director authority to correct errors, so the power exists at every real
event; the design makes it visible: staff only, a reason is required, the
match returns to `recorded` and must be re-signed by both sides, the match
history shows "corrected" with before and after permanently, and the
mutation refuses if any downstream match has started until the director
voids it. Ratings recompute from the log. A silent edit erodes trust; a
re-signed edit with a name on it is a crossed-out score with initials.

**Per-match access:** read = anyone with event access (or the public for
public events); write score = claim holder; sign = a linked player on each
side; correct = staff. All enforced server-side per match.

### D8. Tournament engine v2 (official-grade, rulebook-backed)

Source of truth: USA Pickleball Official Rulebook 2025, Section 12
("Sanctioned Tournament Policies"). Where the rulebook is silent, the
default is marked **(product decision)** and is a per-division setting.

Everything below is configurable per division at creation time: discipline,
format, scoring option, team cap, eligibility, courts. No format is
hard-wired.

**Formats (Rulebook §12.C):**

| Format                                            | Rule            | Engine behaviour                                                                                                                                                                                                                                                                                                   |
| ------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Single elimination, no consolation                | 12.C.2          | Exists today. One guaranteed match.                                                                                                                                                                                                                                                                                |
| Single elimination with consolation               | 12.C.1          | Losers from every round drop into a consolation bracket for bronze; consolation winner does **not** face the winners' champion.                                                                                                                                                                                    |
| Double elimination                                | 12.C.3          | Loser drops to consolation; one loss there eliminates. Consolation winner plays winners' champion for gold. If the consolation side wins that match, a **second tiebreaker game to 15, win by 2** decides gold. Consolation final loser = bronze. Rally scoring is not permitted for doubles double-elim (12.B.1). |
| Round robin                                       | 12.C.4          | Standings by matches won. Tiebreak order: (b) head-to-head wins among tied, (c) total point differential, (d) head-to-head point differential, (e) point differential against next-highest team. Forfeits/withdrawals excluded from standings but recorded for rating (12.C.4.a).                                  |
| Pool play → medal bracket                         | 12.C.5          | Two or more pools, each a round robin, qualifiers seeded into a single- or double-elim playoff. Pool size and advancement count are TD discretion; default 4-team pools, top 2 advance, cross-pool seeding by pool finish then total point differential **(product decision)**.                                    |
| Round robin → medal bracket (no pools)            | 12.C.6          | Existing "round-robin-finals" generalised.                                                                                                                                                                                                                                                                         |
| King of the court, ladder, rotating-partner mixer | not in rulebook | Social formats, kept as they are today (product decision).                                                                                                                                                                                                                                                         |

**Game scoring options (§12.B):** best 2 of 3 to 11, best 3 of 5 to 11,
one game to 15, one game to 21, all win by 2. Round robin may use one game
to 11 when the bracket has six or more teams. Weather/time fallback: games
to 7 (12.B.1.a). Rally scoring is a provisional TD option for round robins,
team play, and singles double-elim only. The existing `MatchConfig` gains
`gamesToWin`, `pointsPerGame`, `winBy`, `scoringSystem: side-out | rally`,
and the double-elim tiebreaker game is its own `Match.kind`.

**Forfeit and retirement scores (§12.F–12.I):** stored numerically in
`games` with `outcome` set (forfeit = 11-0 per game to the required count);
the rulebook's display strings are derived. Forfeits count for standings
placement but contribute 0 to rating.

**Divisions and eligibility (§12.A, §12.L):**

- Disciplines: men's/women's singles, men's/women's doubles, mixed doubles
  (one male + one female, 12.A.2), open gender/age (12.A.3).
- **Team skill level = the higher-rated partner (12.L.1).** Team age level =
  the lower-aged partner. Players may play down in age. Juniors may play up
  into 19+ with TD permission (12.L.2).
- Skill bands (2.5, 3.0, 3.5, …, 5.5+), age tiers (19+, 35+, 50+, 60+, 65+,
  70+), rating-range divisions (e.g. DUPR 3.0–3.49) and combined-team caps
  (e.g. "under 7.0") are **not** rulebook text; they are conventions that
  vary by event. So a division carries an `eligibility` object rather than
  a fixed enum:
  `{ gender?: men|women|mixed|open, minAge?, maxAge?, minRating?, maxRating?,
maxCombinedRating?, ratingSource: self|pickleKing|dupr }`.
  The engine evaluates eligibility with the 12.L.1 higher-partner rule
  unless `maxCombinedRating` is set. Violations are warnings the director
  can override with an audit row, because TDs do allow play-ups.

**Seeding (§12.D):** the rulebook only requires "a draw and seeding
committee ... fair draw". Industry practice, which the current engine
already implements: rank by rating, standard slot placement (1 v 16, 8 v 9),
byes to top seeds. Tie within a rating band is broken by the deterministic
seeded shuffle that exists today. Same-club avoidance in round 1 is not a
rule; offer it as an optional toggle later, not now.

**Scheduling:** the rulebook has procedural rules only (notice of changes
12.E, court changes 12.N, no overlapping same-day events for a player
12.K). Rest minimums, durations and court assignment are TD conventions.
Engine defaults **(product decisions, all configurable)**: minimum rest 10
minutes between a player's matches, estimated durations per scoring option
seeded from history once it exists, courts assigned from a priority queue
where a match is ready when both sides are known and rested. Output is an
ordered queue per court the director can drag-reorder; the engine only
refuses arrangements that double-book a player.

**Algorithms and their references:**

- Round robin: circle method (n even → n−1 rounds; n odd → n rounds with a
  rotating bye). Standard reference: Wikipedia "Round-robin tournament",
  scheduling section.
- Single-elim non-power-of-two: round up to the next power of two, byes to
  top seeds in round 1. Existing implementation (`seeding.ts`,
  `allocateByes`).
- Double-elim consolation topology (product decision, deterministic):
  winners bracket padded to the next power of two with byes to top seeds.
  Losers of winners round 1 form consolation round 1; losers of winners
  round r ≥ 2 drop into consolation round 2r−2, with the drop order
  reversed on alternate rounds so a team does not immediately replay the
  opponent that beat it. Consolation round 1 may contain byes where the
  corresponding winners match was a bye. Gold match: side A is always the
  winners-bracket champion, side B the consolation champion, so the
  §12.C.3 tiebreaker is spawned iff `winnerTeamId === teamBId` of the gold
  match; no lineage walking needed.
- Pool play remainder: pool sizes differ by at most one, teams snake-seeded
  across pools; cross-pool ranking uses point differential per game played
  so unequal pools compare fairly (product decision).
- Late entry and withdrawal after lock: the existing `LateEntryPlan`
  methods are ported to teams and divisions in Phase 3; this is real scope,
  not free.
- Capacity check at lock: estimated total match time vs courts and event
  window is shown as a warning, never a block.
- Eligibility with `ratingSource: pickle-king` uses μ and reports
  "provisional" when φ is above the reliability threshold; divisions carry
  `allowProvisional` (default true, warning shown).
- `Division.scoring` and `eligibility` lock when the division leaves
  `registration`; each match snapshots its scoring option at creation.

**Invariants, property-tested with fast-check (already a dependency):**
every team has exactly one path; no team plays twice in a round; byes only
in round 1 of the winners bracket; double-elim guarantees every team at
least two matches; round-robin schedule has each pair exactly once; a court
queue never double-books a player and honours the rest minimum; standings
tiebreak is a total order consistent with 12.C.4; the double-elim gold
match spawns a tiebreaker game if and only if the consolation side wins.

Field size cap goes from 16 to 64 teams per division. Share-image layouts
keep their own limits.

### D9. Organizations and roles

Decided after research and a council pass: **one owning entity, called an
org internally, with the word "club" shown only when the user wants it.**

- Every user gets a personal org on sign-up, silently. Casual "pickleball
  night" lobbies belong to it. The friend organizing Tuesday never sees the
  word club.
- A user can create a named club org (e.g. "Raving Bulls") and becomes its
  owner. They invite members and assign roles. A club org can hold the DUPR
  Club ID, which is what makes its submissions club-verified.
- Every event belongs to exactly one org. No dual code path for
  event-owned vs club-owned permissions, which is what killed the "optional
  club attached later" hybrid in review.
- Roles are per org, inherited by its events, with optional per-event
  overrides:

| Role                | Can                                                        |
| ------------------- | ---------------------------------------------------------- |
| owner               | everything, transfer ownership, delete org, DUPR settings  |
| admin               | create/edit events, manage members, correct results        |
| director            | run a specific event: draw, schedule, courts, corrections  |
| scorer              | live-score assigned courts, submit recorded results        |
| member              | register for events, self-report, see club leaderboard     |
| player (non-member) | joined one event via code; register/self-report there only |

Invites carry the role fixed by the issuer at creation; `owner` is never
grantable by invite, only by explicit transfer. An owner must transfer
before leaving; if an owner account is deleted without transfer, the
longest-tenured admin is promoted with an audit row, and a club with no
admin is archived read-only. Team registration enforces server-side that
every player is either a claimed account or a ghost of the event's own
org.

Any signed-in user can host because everyone owns a personal org. Gating
applies only to what counts as _club-verified_ (needs a club org with a
DUPR Club ID) and to a club's own events (needs a role there).

### D10. Guest mode

Keep the current no-account offline quick match and offline tournament
exactly as they are: data lives in browser localStorage, bounded as today,
survives until the user clears site data or resets in-app. Add one prompt
at the end of a match or tournament: "Sign in to save this to your
history." Signing in migrates the local snapshot into the user's personal
org as ghost players plus matches (they can then claim or invite). This is
the pattern PickleballScore.net uses and it converts without blocking play.

### D11. Data protection (not legal advice; engineering checklist)

Second-pass check against the Act's text (Data Protection Act 2020, ss.3,
14–18, 41, 42; Registration Regulations 2024):

- **s.15(1)** forbids processing personal data unless the controller is on
  the register. It has no volume, revenue, or hobby threshold. The only
  exemption route is a Ministerial order under s.15(2), and none has been
  made for small or non-commercial controllers.
- **s.41 "domestic purposes"** exempts an individual processing data for
  their _own_ personal, family, household or recreational affairs. A
  service collecting data from ~1,000 unrelated users does not fit that,
  even though the subject is recreational.
- The Second Schedule exemptions (references, JDF, honours, corporate
  finance) do not cover clubs or membership bodies.
- Fee for an individual: J$7,500 first year, then J$5,000 annually, renewal
  due 1 December. Particulars include estimated data subjects, processors
  and their location (Clerk, Convex, DUPR in the US), and lawful basis.
- Enforcement so far: no formal action found against any controller for
  failing to register since registration opened in June 2024. Penalty on
  the books for an individual: fine up to roughly US$13,000 or six months.

So the honest position is: **registration is required by the text, and
practical enforcement against a solo hobbyist has been nil to date.** That
makes it a risk decision, not a design decision. Whatever you choose, the
engineering side is the same and shrinks the exposure:

- **Collect the minimum.** Email (needed for login), display name, and
  self-rated skill are required. Gender is asked only when a player
  registers for a gendered or mixed division. Date of birth is replaced by
  an **age bracket** chosen only when registering for an age division; the
  app never stores a birth date. No location, no phone unless the player
  adds it for claim matching.
- Privacy policy naming Clerk, Convex and DUPR as processors, retention,
  and the OIC as the supervisory authority. Terms of Service. Consent
  checkbox at sign-up.
- Minimum age gate (13+). No junior divisions until a parent-consent flow
  exists.
- Public leaderboard visibility is a separate opt-in toggle.
- Self-service account deletion and data export. Deletion anonymises:
  the `users` row keeps an opaque id with email and name scrubbed; linked
  player rows revert to unclaimed with display name replaced by "Deleted
  player" (orgs may not retain the name); rating events are retained
  because other players' histories depend on them; sole-owned clubs need a
  transfer or are archived first; the personal org is archived.
- Signed DPAs with Clerk and Convex (both publish one) to satisfy the
  cross-border transfer rule.
- No cookie banner needed: Clerk session cookies are strictly necessary and
  there is no tracking.

Full GDPR is not triggered by incidental EU users under the EDPB targeting
test; the artifacts above cover it anyway.

## 3. Draft schema (Convex tables, condensed)

```
users            { clerkId, email, createdAt, consentAt, ageGateOk,
                   leaderboardOptIn, skillSelf, skillLockedAt?,
                   deletedAt? }                                      ← auth identity; anonymised, never hard-deleted
orgs             { name, kind: personal|club, ownerUserId, duprClubId?,
                   createdAt }
orgMembers       { orgId, userId, role: owner|admin|director|scorer|member }
players          { userId?, orgId, displayName, handle?, avatarUrl?,
                   gender?, ageBracket?, skillSelf: SkillLevel, skillLockedAt?,
                   duprId?, claimEmail?, claimedAt?, lastMatchAt? } ← orgId = creating org; claim sets userId
ratings          { subjectId: userId|playerId, discipline: singles|doubles,
                   rating, deviation, volatility, updatedAt }       ← current value (derived)
ratingEvents     { playerId, matchId, discipline, before, after, weight, at } ← subject resolved at read time
events           { orgId, createdByUserId, name, venue?, startsAt, status,
                   joinCode, joinCodeExpiresAt, visibility }
divisions        { eventId, name, discipline, format, scoring, eligibility,
                   teamCap, courts, status }
teams            { divisionId, playerIds[1..2], seed?, checkedIn, registeredBy }
pools            { divisionId, name, teamIds[] }
matches          { divisionId?, poolId?, lobbyId?, kind, round, ordinal,
                   sourceA, sourceB, teamAId?, teamBId?, court?,
                   scheduledAt?, status, games: [{a,b}], winnerTeamId,
                   outcome: played|forfeit|retired|withdrawn,
                   result: recorded|signed|final|disputed,
                   signatures: [{side, userId, kind, at}], corrections[], resolution?,
                   scorerUserId?, scorerClaimedAt?, scorerClaimExpiresAt?, ← one claim, 3h TTL
                   finalAt?,
                   submittedByUserId }
rallyLogs        { matchId, chunk, snapshots[] }                     ← heavy, separate
liveScores       { matchId, a, b, updatedAt }                        ← tiny, subscribed
eventRoles       { eventId, userId, role: director|scorer|player }  ← per-event overrides/joins
lobbies          { orgId, hostUserId, name, joinCode, format, status } ← casual mode, personal org
invites          { kind: claim|team|scorer|org, role?, token, targetId, expiresAt,
                   claimantUserId?, confirmedAt?, usedAt? }          ← role fixed at creation
duprOutbox       { matchId, idempotencyKey = matchId:finalAt, status:
                   queued|sent|failed|ineligible|correction-needed, attempts,
                   notBefore, lastError? }
auditLog         { actorUserId, action, targetTable, targetId, diff, at }
```

Every `matches` row for a completed match is immutable except through an
audited organizer correction. Ratings and standings are derived; the match
log is the source of truth.

## 4. User flows, walked against the schema

Typed drafts: `docs/architecture/platform-domain.draft.ts` (every table above
as a TypeScript type) and `platform-rules.draft.ts` (§12.L.1 team level,
§12.C.4 tiebreak order, §12.B.1 rally-scoring restriction, eligibility).
Both typecheck against the existing `src/tournament` and `src/match` types
and pass lint and the 300-line gate; the rules have an executable assertion
self-check.

**F1. Sign-up.** Clerk hosted UI → webhook creates `users` row (consentAt,
ageGateOk, leaderboardOptIn=false) → server creates personal `orgs` row
(kind personal) + `orgMembers` owner + a claimed `players` row in that org
with `skillSelf` from the one-time question. Nothing else is asked.

**F2. Casual night (host has an account, three friends don't).** Host
creates a `lobbies` row in their personal org, gets a join code. Types
three names → three ghost `players` in the host's org. Scores games with the
live scorer: host is org owner → holds the scoring claim → after required
co-signing, results are `final`, `weight: casual`. Rating events written for
all four. Later the
host taps "send claim link" on a ghost → `invites{kind: claim}` → WhatsApp.
Friend signs up (F1 creates their own personal org + player) → opens link →
server sets `players.userId` on the ghost and recomputes the friend's
subject rating from the union of rating events; `auditLog` row. Reversible
by unsetting the field.

**F3. Club tournament.** Owner creates club org "Raving Bulls", invites
staff (`invites{kind: org}` → `orgMembers` admin/director/scorer). Creates
`events` row, `divisions` per bracket (e.g. Men's Doubles 3.5: discipline
doubles, format double-elimination, scoring best 2 of 3 to 11, eligibility
{gender men, minRating 3.5, maxRating 4.0, ratingSource pickle-king}, teamCap
16). Shares join code. Players register: pick division, invite partner
(`invites{kind: team}`), server runs `checkEligibility` with §12.L.1;
violations are shown to director who may override (`eligibilityOverrideBy`

- audit). Director locks division → engine seeds (existing `seedPlayers`,
  now over teams) → generates winners + consolation matches with
  `MatchSource` chains, including the `gold` match and a latent
  `gold-tiebreaker` whose sources are the gold winner/loser and which is
  `void`ed unless the consolation side wins gold. Scheduler fills `court` and
  `scheduledAt` respecting `minRestMs`.

**F4. Live scoring at a court.** Scorer role opens the ready match, taps
"score this match" → mutation sets `scorerUserId` if null (Convex mutations
are serialisable, so two taps cannot both win). Scorer app runs the
existing reducer offline and retains local `rallyHistory`. Backend durable
rally snapshots belong in chunked `rallyLogs`, while `liveScores` carries
only the realtime spectator projection; later implementation work owns the
transfer cadence. The local outbox holds the finished match and on reconnect
submits `{matchId, games, winnerTeamId, rallyHistory}`. Server verifies caller
= `scorerUserId`, games consistent with `scoring`, winner consistent with
games → `result: recorded`. Each
side's linked player taps agree (or staff signs for a ghost-only side) →
`signed` → `final` → dependent matches resolve → rating events → DUPR
outbox item with `notBefore = now + 24h`.

**F5. Self-report.** Participant with a `players.userId` opens their ready
match, enters games → `recorded`, their side signed by submission. Other
side's linked player taps agree → `final`. Refuse → `disputed`, director
resolves with reason, audit row. Same machine as F4; only the recorder
differs.

**F6. Guest, no account.** Unchanged today's flows in localStorage. At the
end of a tournament: "Sign in to save". After F1, the local snapshot is
posted once into the personal org: the user picks "which name is you"
(mapped to their own player row, never a duplicate ghost), ghosts for the
other names, matches `final` with `weight: casual` and signatures of kind
`conflicted` where the user played.

## 4b. Paper stress tests (walked)

1. **12 names offline, bracket run with no signal, signal at the bar.**
   Outbox holds every completed match keyed by matchId. Drain in bracket
   order (round, ordinal) so `MatchSource` resolution never sees a child
   before its parent. Server dedupes on matchId. Result: 12 ghosts,
   11 final matches, ratings computed, share images unaffected because
   they read local state. Failure to watch: partial drain, then app closed.
   Outbox items are individually idempotent, so a re-drain is safe.
2. **One of the 12 claims via link a week later.** `players.userId` set.
   The leaderboard subject for that ghost becomes the user; the row moves,
   nothing is copied. Wrong person scanned the QR? Organizer taps unclaim,
   the field is unset and the rating recomputed. No data was moved, so
   nothing is lost.
3. **Two orgs both have a ghost "Jadan"; real Jadan claims both.** Two
   links to one user. The subject rating is recomputed from the _union_ of
   rating events in chronological order, never by adding two Glicko
   states. This is why `ratingEvents` is the source of truth and `ratings`
   is derived. One leaderboard row because the leaderboard groups by
   subject.
4. **Two devices score court 3.** Second "score this match" tap fails
   because `scorerUserId` is set; UI shows who holds it. If the first
   phone dies, a director revokes and the second claims. A stale
   submission from the first phone after revoke is rejected because
   caller ≠ `scorerUserId`. Nothing double-counts.
5. **Lobby self-report, one player leaves before signing.** Match sits
   `recorded`. After 24h the host is nudged; host is staff of their
   personal org so can sign for that side or void, with an audit row. No
   rating movement until then.
   5b. **Wrong score co-signed by both sides.** Director corrects with a
   reason; the match drops back to `recorded` and both sides sign again;
   history shows the correction permanently. If the winner flipped and the
   next round has started, the correction is refused until the director
   voids downstream, so a bracket can never silently diverge from its
   results.
6. **DUPR-linked player plays a ghost.** Outbox item created with status
   `ineligible` and reason, visible to the director; flips to `queued` if
   the ghost is later claimed by someone with a `duprId` before the item
   is purged. Internal rating unaffected.
7. **Join code leaked.** Codes are ≥ 8 chars from a 32-symbol alphabet,
   expire (`joinCodeExpiresAt`), rotate on demand. Joining yields
   `eventRoles{player}` only. Registration into a division still passes
   eligibility and the director can lock registration. Worst case is spam
   registrations the director deletes.
8. **Director corrects a final score two days later.** As 5b: staff only,
   reason required, re-signed by both sides, visible forever. Ratings
   recompute from the log. If the DUPR item was already `sent`, a
   `correction-needed` flag is raised for manual handling because edit
   support is unconfirmed (D6); this is why `notBefore` is 24h.
9. **64-team double elimination on 8 courts.** 63 winners matches, 62
   consolation matches, gold, latent tiebreaker: 127 rows. Scheduler is a
   priority queue over ready matches; property tests assert no player
   double-booked and rest honoured. Convex reads for the bracket screen are
   one indexed query by divisionId; 127 rows is trivial.
10. **Rating recompute after a formula change.** Replay `ratingEvents`
    inputs (matches in order, weights) through the new function into a
    shadow table, compare, swap. Possible only because forfeits are
    excluded from rating (`outcome`), non-final matches never produced
    events, and every event stores its inputs.
11. **Participant hands their phone to a friend to score.** The account is
    the participant's, so the match is participant-recorded and the other
    side must sign. Whose thumb tapped is irrelevant to the trust model.
12. **Staff and a participant both open the scorer.** First tap holds the
    claim; staff can take it over. The other device's scorer is local only
    and can submit nothing, so two conflicting scores never reach the
    server.

## 5. Phasing

| Phase | Delivers                                                                                                                 | Unblocks                  |
| ----- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------- |
| 0     | ADR-0009 (backend), ADR-0010 (identity), updated threat model, this schema finalized, stress tests above walked          | Everything                |
| 1     | Clerk + Convex wired; profiles; ghost players; quick matches saved to cloud; existing offline flows unchanged for guests | Identity                  |
| 2     | Glicko-2 ratings + leaderboard + rating history on profile                                                               | Internal rating           |
| 3     | Engine v2: teams, divisions, double elim, pool → bracket, court scheduler, registration by join code, check-in           | Your friend's tournament  |
| 4     | Live scoring sync + realtime spectator bracket; self-report + confirm for lobbies                                        | Casual online mode        |
| 5     | DUPR adapter + outbox                                                                                                    | Blocked on partner access |

No deadline. Phase 3 builds every §12.C format; nothing is cut.

## 6. Resolved and open questions

Resolved 2026-09-16: everything tournament-shaped is configurable per
division (D8); self-report allowed (D7); Clerk (D2); claimable profiles with
org scoping and purge rule (D3); any user can host via personal org, clubs
are opt-in (D9); guest mode stays with a sign-in-to-save prompt (D10);
gender collected only when a division needs it (D11).

Open:

- DUPR partner terms: unknown until the club is registered and DUPR replies.
- OIC registration deadline, DPO requirement, minor consent age: verify
  with the OIC directly.
- Whether Jamaican tournaments want double elimination or pool → bracket
  first; both get built, order affects nothing architecturally.

## 7. Adversarial review register (2026-09-17)

Two independent reviewers attacked the brief and types after the product
owner caught the "that's me" hole. Every finding and its resolution:

| #      | Finding                                                             | Resolution (where)                                                                                                 |
| ------ | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| I1     | Claim link is a bare bearer token; forwarded link hijacks a profile | Link no longer finalises; organizer confirms the claimant's Clerk identity, or contact match skips confirm (D3 §2) |
| I2     | Organizer can silently unclaim an established user and re-issue     | 48h/zero-events grace, then user confirmation or 7-day notice with undo; audited (D3 §2b)                          |
| I3     | Claim race unguarded                                                | Mutation fails if already claimed; both attempts audited (D3 §2)                                                   |
| I4     | Invite has no role; accept could take role from client              | `role` fixed at creation; owner never by invite (D9, schema)                                                       |
| I5     | Ghost from org A can be entered in org B's event                    | Server invariant on team registration (D9)                                                                         |
| I6     | Self-rating lock per row, bypass via fresh ghost                    | Lock lives on the subject; fresh ghost inherits lock once linked (D3)                                              |
| I7     | Ghost names appear on leaderboards without consent                  | Ghosts hidden outside creating org; members-only inside (D3)                                                       |
| I8     | Account deletion cascade undefined                                  | Anonymise user, revert rows to unnamed ghosts, retain rating events, transfer/archive clubs (D11)                  |
| I9     | No owner succession                                                 | Transfer before leaving; auto-promote longest-tenured admin; archive if none (D9)                                  |
| I10    | Guest import duplicates the host as a ghost                         | "Which name is you" step maps to self row (F6)                                                                     |
| I11    | Type/prose mismatches (trust field, subjectId, roles, junior)       | Types rewritten; `junior` removed until consent flow exists                                                        |
| T1–2   | Claim holder disappears or sulks; match blocked forever             | 3h claim TTL; staff manual entry always allowed and takes over (D7 §2)                                             |
| T3     | Claim on unresolved match                                           | Claim only when `ready` (D7 §2)                                                                                    |
| T4     | Stale outbox submission silently vanishes                           | Terminal `superseded` state shown to the scorer (D4)                                                               |
| T5     | Staff who is playing signs for opponents                            | Conflict-of-interest rule; lobbies flagged `conflicted` at weight 0.25, never DUPR (D7 §3)                         |
| T6     | Signature proves session not person                                 | Documented accepted limitation, same as scoring (D7 §3)                                                            |
| T7     | "Submitter's side auto-signed" undefined for desk staff             | Typed signatures; desk staff auto-signs nothing (D7 §3)                                                            |
| T8     | Unreachable linked player blocks club match forever                 | Staff override after 24h for any side, audited (D7 §3)                                                             |
| T9     | Dispute resolution has no record                                    | `resolution` on match (D7 §3, schema)                                                                              |
| T10    | Outbox applies to voided/corrected match                            | Drain re-checks state (D4)                                                                                         |
| T11    | Scoring option edited mid-tournament                                | Locked once division leaves registration; per-match snapshot (D8)                                                  |
| T12–14 | Glicko-2 period, weight, composite opponent unspecified             | Lichess per-match period, τ 0.5, weighted contribution, RMS composite φ (D5)                                       |
| T15    | `subjectId` on rating events misleading                             | Removed; subject resolved at read time (D3, schema)                                                                |
| T16    | Gold tiebreaker lineage hand-waved                                  | Gold side A = winners champ, side B = consolation champ; tiebreaker iff B wins (D8)                                |
| T17    | Consolation drop-down undefined                                     | Deterministic 2r−2 mapping with alternating reversal (D8)                                                          |
| T18    | Pool remainder                                                      | Sizes differ by ≤1, snake seeding, per-game differential (D8)                                                      |
| T19    | Forfeit strings vs numeric games                                    | Numeric with `outcome`; strings derived (D8)                                                                       |
| T20    | teamCap vs courtCount                                               | Capacity warning at lock (D8)                                                                                      |
| T21    | Eligibility ignores provisional                                     | φ reported; `allowProvisional` (D8)                                                                                |
| T22    | Late entry not ported                                               | Explicit Phase 3 scope (D8)                                                                                        |
| T23–25 | DUPR outbox status/purge/idempotency gaps                           | `correction-needed` status, 90d purge, key = matchId:finalAt (schema)                                              |
| T26–27 | rallyHistory size and subscription fan-out                          | `rallyLogs` chunks + `liveScores` doc (D4)                                                                         |
| T28    | Crons unspecified                                                   | Listed in D4                                                                                                       |
