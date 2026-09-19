# ADR 0009: Hosted platform, accounts, and claimable player identity

Status: proposed
Date: 2026-09-17
Supersedes: ADR-0001 (local-first, no backend) for cloud features. Guest
mode keeps ADR-0001 behaviour.

## Context

Pickle King must plan official tournaments, keep an internal rating, and
eventually mirror results to DUPR. All three need stable identity across
devices and events. Most participants at a Jamaican pickleball night will
not have an account, and the app must not lose their results.
Full reasoning, research, and the reviewed schema live in `PLAN.md`
(D1–D3, D9–D11, section 7).

## Decision

- Backend: Convex (data, functions, realtime). Auth: Clerk. The Next app
  stays on Cloudflare; Convex is reached from the browser.
- Domain logic in `src/tournament` and `src/match` stays pure TypeScript
  and runs unchanged inside Convex functions as the authoritative
  validator.
- One owning entity, `org`. Every user gets a personal org silently; clubs
  are opt-in orgs with owner/admin/director/scorer/member roles. Every
  event belongs to exactly one org. Invites carry a role fixed at
  creation; owner is transfer-only.
- A `player` row is one person's appearance in one org. Unclaimed rows
  (ghosts) are scoped to their org, never globally searchable, never on
  leaderboards outside that org. Claiming sets `userId`; it is a link,
  never a merge, and is reversible. Claims are organizer-issued (link plus
  organizer confirmation of the claimant's identity, or contact match).
  Unclaim after 48h or once rated needs the user's confirmation or a 7-day
  notice.
- Ratings, history, and leaderboards are computed per subject (user if
  linked, else player) from an append-only rating-event log keyed by the
  row that played.
- Account deletion anonymises rather than deletes: rating events are
  retained, linked rows revert to unnamed ghosts, sole-owned clubs are
  transferred or archived.
- Data minimisation: email, display name, self-rated skill required;
  gender and age bracket only when a division needs them; no birth date.
  13+ age gate. Privacy policy, ToS, consent, export, deletion shipped
  with Phase 1.

## Consequences

Reverses the "no accounts, no server" invariant in
`docs/security/security-requirements.md`; the threat model must be
re-issued before Phase 1 ships. Vendor dependency on Convex and Clerk,
both with self-host or exit paths noted in `PLAN.md` D1–D2. Registration
with Jamaica's OIC is required by the text of the Data Protection Act;
that is an operator decision recorded in `PLAN.md` D11.
