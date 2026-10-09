# Security Test Plan

## Evidence status

The guest/local checks below exercise the current runtime. The hosted-platform
checks are **required future implementation tests** for the Clerk/Convex work;
they are not present or passing merely because this plan or repository
verification passes. Authorization/isolation tests must call the real Convex
function boundary with distinct identities and persisted relationships rather
than mocking a boolean role decision.

## Current guest/local executable coverage

### Persistence and lifecycle

- Reject malformed, unknown-version and structurally invalid active/history
  records through the production schemas.
- Preserve the active snapshot when resetting corrupt history, and vice versa.
- Prove record IDs prevent duplicate confirmation writes and retention bounds
  prune the oldest records.
- Exercise minimum, typical and maximum persisted inputs plus every schema
  version/migration boundary used in production fixtures.
- Exercise stale-service-worker update behavior during an active match and
  timer recovery after device sleep/lifecycle changes.

### Input, rendering and explicit disclosure

- Reject empty, duplicate, overlong and markup-like player names at the domain
  boundary; render every user-controlled value through React/Canvas text, never
  an HTML injection path.
- Keep share generation behind a direct user action and verify cancellation and
  local-download fallback do not transmit data.
- Verify history/session clearing removes only the selected local store and that
  shared-device exposure remains explained to the user.

### Supply chain and repository

- Run `./scripts/verify --full` for the canonical repository checks, rendered
  HTML/PWA assertions and production-server share gate.
- Run the locked dependency audit at high severity separately; a successful
  application verification command does not imply the dependency audit ran.
- Run CodeQL, dependency review and secret scanning/push protection in GitHub
  where available, bound to the exact candidate commit.
- Verify dependencies, generated output, environment files, credentials and
  agent metadata are not tracked or included in public artifacts.
- Inspect the built client/service worker for server-secret values and ensure it
  does not cache bearer tokens or protected hosted API responses once those
  surfaces exist.

## Required hosted-platform implementation tests

### Authentication and authorization

- At the real server boundary, reject unauthenticated, expired/revoked,
  wrong-issuer/audience and deleted-user requests.
- Prove a verified Clerk identity maps to the intended active user and that a
  client-supplied `userId`, org/event role, player/scorer identity or owner flag
  cannot change the authorization decision.
- Build an authorization matrix for owner, admin, director, scorer, member,
  event-only player, participant, unrelated account and public spectator across
  every protected org/event/match query and mutation.
- Prove cross-org reads/writes and IDOR attempts fail for memberships, ghosts,
  teams, events, matches, ratings and audit records, including valid IDs copied
  from another org.
- Reject opposing rosters that resolve to the same subject and prevent one
  session from signing both sides or using staff power against an opponent.

### Webhooks and provisioning

- Accept a correctly signed, timely event for the configured source and create
  or update the user exactly once.
- Reject missing/invalid signatures, old/future timestamps, wrong source or
  audience, malformed payloads and unsupported event types before mutation.
- Replay the same provider event ID and deliver newer/older events out of order;
  prove idempotency and stale-event handling preserve the newest valid state.
- Verify webhook errors/logs contain no signature, session token or unnecessary
  payload personal data.

### Invite, join and claim tokens

- Verify entropy/format and digest-only persistence; search database, logs,
  audit records, errors and telemetry for the raw value.
- Prove a GET/link preview does not consume the value. Prove one authenticated
  mutation consumes it exactly once and concurrent attempts yield one winner.
- Reject expired, revoked, reused, wrong-kind, wrong-target, wrong-org and
  tampered tokens/codes.
- Prove the accepted role is the immutable server-stored role, `owner` is never
  invite-grantable, and leaked join codes yield only an event `player` role.
- Simulate a leaked join code: rotate/revoke it, reject later use, and let an
  authorized director remove spam registrations without broadening the joined
  account's role or cross-org visibility.
- Exercise I1 organizer confirmation: a forwarded claim link cannot finalize;
  the organizer—not Clerk—confirms real-world identity; contact bypass accepts
  only server-derived normalized Clerk-verified contact and discloses the
  minimum contact to the organizer.
- Exercise I2/I3 unclaim grace, rated-row protection, seven-day notice/undo,
  no-reclaim window and concurrent claim/unclaim races with audit assertions.

### Org/player privacy and public projections

- Reject registering a ghost from org A in org B's event and every cross-org
  ghost search/read path.
- Snapshot/contract-test public event, member, organizer and self projections.
  Public output must exclude ghost names where prohibited, claim contact,
  email, bearer data, internal signatures/audit fields and non-opted-in
  leaderboard identity.
- Prove leaderboard opt-in defaults false and changes only through the account's
  authorized transition.
- Verify a new linked player row inherits an already-locked subject skill/rating
  state so a fresh ghost cannot bypass I6.
- Reject under-13 sign-up before creating the Pickle King user/personal-org
  records. Require affirmative privacy-policy/terms consent and verify its
  timestamp is auditable without copying policy text or unnecessary PII.
- Exercise self-service export with self, cross-account and cross-org callers;
  return the authorized subject's data while excluding other private fields.
- Exercise the 90-day zero-match ghost purge and ineligible DUPR-outbox purge at
  just-before, exact-boundary and just-after timestamps. Retain ghosts with
  match history and preserve rating/result references.
- Verify production-readiness evidence records the approved Clerk/Convex
  processor agreements without exposing agreement or account secrets.

### Scoring claims, outbox and signing

- Permit claims only for `ready` matches by staff or a participant; reject a
  spectator, unresolved match, duplicate active claim and unauthorized revoke.
- Exercise three-hour expiry, staff takeover/manual entry and the dead-device
  path without making the match permanently unavailable.
- Bind submissions to a server-issued claim generation/revision. After expiry,
  revoke or takeover—including re-claim by the same user—prove the old payload
  becomes `superseded` and cannot apply.
- Replay a submission/idempotency key concurrently and after partial failure;
  prove exactly one `recorded` result and no duplicate rating/DUPR effects.
- Reject forged winner, games, roster, scoring configuration and `rallyHistory`;
  re-read current match/roster/result state during the atomic mutation.
- Prove `recorded` and `disputed` cause no downstream effect; require one valid
  signature per side for `final`; exercise staff override timeout and conflict
  restrictions from T5.
- Prove a signature is attributed to the authenticated session without claiming
  physical-person verification in UI or audit text.
- Import a structurally valid but fabricated guest snapshot; prove it receives
  only the approved low-weight/conflicted treatment, is never DUPR-eligible,
  and is visibly distinguishable from server-authenticated results.

### Correction, rating and external outbox

- Reject correction by non-staff, participant conflict, missing reason and a
  winner-changing correction after downstream play has started.
- On an allowed correction, preserve before/after history, return to `recorded`,
  require both signatures again and recompute ratings deterministically from
  the event log.
- Queue DUPR work only for eligible `final` results after the correction window;
  reject conflicted/unmapped/non-final results and duplicate
  `matchId:finalAt` keys.
- Exercise retry/terminal failure without exposing the credential. A correction
  after a sent item must become `correction-needed`; do not simulate unsupported
  remote edit/void behavior as success.

### Deletion, audit, jobs and secrets

- Begin deletion and concurrently attempt protected actions; all later actions
  by the deleted user must fail closed.
- Verify provider sessions/linkage, memberships, event roles, pending
  invites/claims and queued external work are revoked; email, display name,
  claim contacts and DUPR IDs are scrubbed; linked rows become unnamed ghosts.
- Prove results/rating history remain referentially valid and a sole-owned club
  transfers to the longest-tenured eligible admin or archives read-only.
- Assert the schema permits direct-identifier scrubbing, including provider ID
  and email, before claiming the deletion workflow passes.
- Verify audit records are append-only and access-controlled; require expected
  entries for privileged transitions and assert no raw token, credential,
  contact or unnecessary PII appears in their diffs.
- Reject external invocation of scheduled jobs. Exercise bounded/idempotent
  batches, retries, current-state revalidation, partial failure and privileged
  audit entries.
- Scan source, reachable history, environment examples, logs, fixtures, client
  bundles, service-worker caches and artifacts for Convex, Clerk and future DUPR
  secrets. Exercise rotation/recovery in the provider runbook without placing a
  real credential in a fixture.

## Release evidence rule

Record the exact command/test, commit, environment and result for each applicable
requirement. A planned test, mocked policy helper, document build, screenshot,
file existence, or unrelated green suite is not evidence that a hosted control
works. Any skipped negative path requires an explicit risk disposition before
the affected platform surface can be called release-ready.
