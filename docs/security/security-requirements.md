# Security Requirements

## Applicability

Requirements labeled **current** apply to today's offline-first guest runtime.
Requirements labeled **hosted target** apply when the approved Clerk and Convex
platform is implemented. Their presence here is not evidence that the control
exists or has passed testing. A later implementation ticket must enforce each
requirement at the named layer and supply negative-path evidence before release.

Guest scoring and tournaments must remain usable without an account.

## Authentication and sessions — hosted target

- Clerk must authenticate users. Pickle King must not implement or store user
  passwords.
- Convex must accept identity only from its verified Clerk integration using
  the configured issuer/audience and current session state. Missing, expired,
  revoked, or wrong-issuer identity must fail closed.
- Pickle King must map one verified Clerk identity to one active user record.
  A `deletedAt` user must be denied protected queries, mutations and actions.
- Browser code and service workers must not persist or cache bearer tokens or
  protected API responses outside the provider's supported session mechanism.
  Logout must clear sensitive local session/outbox state without deleting the
  user's separate guest history unless the user explicitly requests it.
- Provider authentication, recovery, MFA and abuse protections must be
  configured and verified during the Clerk implementation ticket; they must
  not be described as Pickle King server authorization.

## Authorization and least privilege — hosted target

- Every protected Convex query, mutation and action must derive the actor from
  the verified session and resolve org membership, event role, roster/player
  relationship, scorer claim and record ownership from server state.
- No mutation may trust a client-supplied `userId`, org/event role, player or
  scorer identity, owner flag, invite role, or equivalent authority claim.
- Queries must apply the same resource-level authorization as mutations and
  return explicit least-data projections. Knowing an ID must not grant access.
- Every event must belong to exactly one org. Server code must prevent reads,
  writes, player registration and ghost use across org boundaries.
- `owner` must be transfer-only. Invites must never grant it. Org/event roles
  must provide only their architecture-defined capabilities.
- Opposing sides of a match must resolve to distinct subjects. One authenticated
  user must not satisfy both signature sides or use a staff role against an
  opposing side in a match they participate in.

## Invite, join and claim transitions — hosted target

- Invite, join and claim values must be high entropy, stored only as scoped
  digests, and bound to kind, issuer, target, fixed role, expiry, revocation and
  single-use state. Raw values must be returned only at creation and excluded
  from logs, audit diffs, analytics, errors and persisted URLs.
- A GET request or link preview must never consume a bearer value. An
  authenticated server mutation must validate and atomically consume it.
- Join codes must be at least eight characters from the approved 32-symbol
  alphabet, expire, rotate on demand, and grant only the event `player` role.
  Registration and eligibility checks still apply after joining.
- Claim links must record the authenticated Clerk account but must not finalize
  a claim. The organizer, not Clerk, confirms the claimant's real-world
  identity; a server-derived match against a normalized Clerk-verified contact
  may skip that confirmation.
- Contact matching must not trust a client-supplied email/phone and must reveal
  only the minimum verified contact information needed by the organizer.
- Claim and unclaim transitions must be serialised, auditable and race-safe.
  A claim must fail if already claimed or in an unclaim notice window. Protected
  unclaim timing/notice rules from D3 must be enforced server-side.

## Webhooks and scheduled jobs — hosted target

- Clerk webhook handling must verify signature and timestamp and validate the
  configured source before any state mutation. It must deduplicate on provider
  event ID and safely handle replay and stale/out-of-order delivery.
- Provisioning must be idempotent. A rejected webhook must change no product
  state and must produce redacted, actionable operational evidence.
- Scheduled jobs must be internal-only, bounded, idempotent and retry-safe.
  Each item must re-read current state and authorization-relevant relationships
  before mutation. Privileged changes and terminal failures must be audited.

## Server-only configuration and external services — hosted target

- Convex deployment/configuration credentials, Clerk webhook secrets and the
  future DUPR credential must exist only in the relevant provider/CI secret
  store. They must not enter source, client-prefixed variables, browser bundles,
  logs, test fixtures, share images or build artifacts.
- Public Clerk/Convex client configuration must be explicitly documented as
  public and grant no server authority.
- Secret access must use least privilege. Suspected exposure requires removal
  from reachable artifacts/logs and credential rotation through the provider.
- DUPR-specific behavior must stay behind the approved adapter/outbox boundary.
  The server-only credential must never be callable or retrievable by clients.

## Personal data and public projections — hosted target

- Required sign-up data is limited to email, display name, consent/age-gate
  state and one-time self-rated skill. Date of birth must not be collected.
  Location must not be collected by default. Gender or age bracket may be
  collected only when a division requires it.
- The 13+ age gate and affirmative privacy-policy/terms consent must be recorded
  before Pickle King creates the hosted user row and personal org. An under-13
  attempt must create neither product record. Consent evidence must include the
  acceptance time and remain auditable without placing policy text in audit
  diffs.
- `leaderboardOptIn` must default to false. Public leaderboard output must omit
  accounts without opt-in.
- Unclaimed players must remain scoped to the creating org, must not be globally
  searchable or public, and may be named only to authorized org members.
- Public/event projections must omit ghost names where the audience rule does
  not permit them, claim contacts, email, bearer material, audit internals,
  internal signatures and non-opted-in leaderboard identities.
- Hosted processors in the United States are an acknowledged architecture
  characteristic. This requirement makes no new legal/OIC conclusion; SPE-98
  and SPE-99 remain open.
- The hosted platform must provide authorized self-service export and deletion.
  Export must return only the requester's data and authorized org data without
  leaking other subjects' private fields.
- Zero-match ghosts must purge after 90 days. Ghosts with match history must be
  retained/anonymized as required for result/rating integrity. Ineligible DUPR
  outbox items must purge after 90 days; audit retention must be separately
  bounded and justified before implementation release.
- Operational readiness for hosted personal data must record the approved
  processor agreements for Clerk and Convex before production use. This is a
  process gate, not a claim that the agreements are already executed.

## Deletion and referential integrity — hosted target

- Account deletion must be an authorized server workflow, not a client-side
  cascade. Once deletion begins, protected actions for that user must fail
  closed.
- The workflow must revoke Clerk sessions/identity linkage, memberships, event
  roles, outstanding invites/claims and queued external work; scrub email,
  display name, claim contacts and DUPR identifiers; replace linked player names
  with an anonymous value; and archive the personal org.
- Rating events, results and audit references needed for other users' integrity
  must retain opaque identifiers, not direct personal data. Sole-owned clubs
  must be transferred to the longest-tenured eligible admin or archived
  read-only with an audit record.
- The future schema must permit scrubbing fields currently required by the
  design draft, including `clerkId` and `email`; documentation must not claim
  anonymization is implemented until that schema and workflow are tested.

## Result, signing and rating integrity — hosted target

- A scoring claim may be created only for a currently `ready` match by event
  staff or a participant in that match. It expires after three hours; staff may
  revoke/take over, and authorized staff manual entry may supersede it.
- Each claim must have a server-issued generation/revision. Offline submissions
  must bind to that value. Submission must atomically verify actor, generation,
  expiry, current match/roster/result state, scoring snapshot and idempotency.
  Revocation/takeover must invalidate older generations; stale work must become
  visibly `superseded`, never silently disappear or apply.
- `rallyHistory` is local submission evidence, chunked `rallyLogs` are durable
  server data, and `liveScores` is only a spectator projection. None grants
  authority or replaces server score/result validation.
- Results must follow `recorded -> signed -> final`, or `disputed`. Only `final`
  may advance a bracket, create rating events or queue a DUPR item.
- Signatures must be side-specific and authorized from current roster/role
  state. A participant must not sign or staff-override the opposing side or
  resolve their own dispute. Conflicted personal-org signatures must be marked,
  use weight 0.25 and be ineligible for DUPR.
- A Pickle King signature proves that an authenticated session performed the
  signing action; it does not prove the physical identity of the human holding
  the device. This is an accepted limitation.
- Corrections must be staff-only, require a reason, preserve before/after
  history, return the match to `recorded`, require both sides to sign again,
  and block winner-changing corrections after downstream play until explicit
  voiding. Ratings must recompute from the append-only event log.
- Guest imports must be structurally replayed/validated but treated as
  unauthenticated evidence. Their approved low-weight/conflicted internal-rating
  effect is an accepted manipulation risk and they must never be DUPR-eligible.

## Auditability — hosted target

- Security-relevant transitions must write append-only, access-controlled audit
  records with actor, action, target, time and the minimum useful change.
- Audit data must cover claim/unclaim attempts, role/ownership changes, scoring
  claim takeover, signatures/overrides, disputes/corrections, deletion and
  privileged scheduled/external actions.
- Audit records must not contain raw bearer values, credentials, full claim
  contacts or unnecessary personal data. Audit read access must itself be
  authorized and reviewable.

## Guest/local protections — current and retained

- Active-session and recent-history records must use separate versioned schemas.
  Invalid persisted data must enter a recoverable reset path rather than being
  silently accepted or discarded.
- User-generated names/content must be trimmed, length-limited, domain-validated
  and rendered only as React/Canvas text, never interpreted as HTML.
- History must remain bounded to 50 Quick Matches and 10 completed tournaments.
- Share images must be rendered locally, previewed and exported only by explicit
  user action. Native sharing is feature-detected; fallback is local download.
- Service-worker activation must not interrupt an active match. Timers must
  recover from sleep/lifecycle changes using absolute deadlines.
- The product must provide explicit local history/session clearing and explain
  shared-device exposure. It cannot protect data from someone controlling the
  same unlocked browser profile.

## Supply chain and delivery — current and hosted target

- CI permissions must default to read-only and elevate only per job. Production
  credentials must not be available to untrusted pull-request code.
- The lockfile, dependency review, CodeQL, secret scanning/push protection,
  repository quality gates and exact-commit hosted CI evidence must remain
  release controls.
- No new analytics, remote fonts or runtime CDN assets may be introduced without
  an explicit privacy/security review and updated data-flow evidence.
- Material changes to a trust boundary, protected transition, personal-data
  field, public projection, external integration or secret require an updated
  threat model and negative-path test plan before release.
