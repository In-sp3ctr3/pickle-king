# Threat Model

## Status and scope

This model covers two product states and must not be read as a deployment
claim:

- **Current runtime:** the Cloudflare-hosted application shell supports guest
  scoring and tournaments without an account. Match data, bounded history,
  generated share images, and the scorer's `rallyHistory` remain in the
  browser unless the user explicitly shares or downloads them.
- **Approved hosted platform, not yet implemented:** Clerk authentication and
  Convex persistence will add accounts, personal and club orgs, claimable
  players, server-authorized results and signatures, ratings, scheduled jobs,
  and a later DUPR adapter. The controls below are requirements for that target
  and require implementation evidence before release.

Creating an account must not become a prerequisite for local scoring.
ADR-0009, ADR-0010, `PLAN.md` D1-D11 and section 7, and the platform
domain/rules drafts define the approved architecture.

## Assets and data classification

| Asset                                                                 | Classification and exposure                                                                                                                                            |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cloudflare application URL and public build-time client configuration | Browser-readable public configuration. It must contain no server credential. A value is not secret merely because the frontend is hosted on Cloudflare.                |
| Clerk publishable configuration                                       | Browser-readable public configuration. It identifies the Clerk application but grants no server authority.                                                             |
| Clerk identity, session and token state                               | User/session state. Tokens are bearer credentials and must be protected from logs, URLs, persistent application storage, service-worker caches, and unrelated origins. |
| Convex deployment/configuration credentials and Clerk webhook secrets | Server-only secrets. They belong in provider or CI secret stores and must never reach client bundles, logs, share images, or repository history.                       |
| Future DUPR credential                                                | Server-only secret, scoped to the adapter and club/integration account. It does not exist in the current runtime.                                                      |
| Email, display name, consent and age-gate state                       | Persistent personal data in the approved hosted platform. Public responses must expose only an explicit safe projection.                                               |
| Org memberships, event roles and ownership                            | Persistent authorization state. Clients may display it but may not assert or change its authority without a server-authorized transition.                              |
| Player and ghost rows, claim contacts and account links               | Persistent personal or pseudonymous data. Ghosts and claim contacts are org-scoped; claim contacts are not public profile fields.                                      |
| Invite, join and claim tokens/codes                                   | Bearer access-transition material. Store only scoped digests, except the one-time value returned at creation; never store or log the raw value.                        |
| Match results, corrections, signatures and scorer claims              | Integrity-sensitive records. Only `final` results may advance brackets, affect ratings, or enter a DUPR outbox.                                                        |
| Rating history                                                        | Persistent integrity-sensitive personal data. The append-only event history must remain referentially valid through claim, unclaim, correction, and anonymization.     |
| Audit records                                                         | Security-sensitive, append-only operational records. They may contain opaque identifiers and minimal diffs, never raw tokens, secrets, or unnecessary personal data.   |
| Guest snapshots, bounded history and submission outbox                | Browser-local user/session data. It is editable by the device holder and is not proof that a match occurred.                                                           |
| User-generated names and tournament content                           | Untrusted input whether sourced from a form, localStorage, import, webhook, or backend record.                                                                         |
| Source, dependencies, CI credentials and production artifacts         | Application/build integrity. CI credentials are server-only secrets; built client assets are public.                                                                   |

No payment-card data is in the approved scope.

## Actors and authorization premise

Actors include an unauthenticated guest, authenticated player, event-only
player, org member, scorer, director, admin, owner, public spectator,
malicious account holder, compromised browser/session, CI maintainer, Clerk,
Convex, and the future DUPR service.

**Clerk authenticates the user. Pickle King/Convex authorizes the action.**
Every protected query, mutation, action, webhook effect, and scheduled job
must derive identity and authority server-side from the authenticated identity
and stored relationships. A client-supplied user ID, org or event role, player
identity, scorer identity, token role, or ownership claim is untrusted input.

## Trust boundaries

| Boundary                                          | Required security property                                                                                                                                                                  |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Browser -> Convex query/mutation/action           | Authenticate where required; validate input; resolve authorization and record scope server-side; return a least-data projection.                                                            |
| Clerk session -> Convex identity                  | Validate configured issuer, audience and token/session state; map the verified provider identity to one active Pickle King user.                                                            |
| Clerk webhook -> provisioning flow                | Verify signature and timestamp before parsing effects; enforce issuer/audience where applicable; deduplicate on provider event ID; handle replay and out-of-order delivery.                 |
| Server identity -> org/event/match resource       | Load current membership, event role, roster, claim and match state; fail closed across orgs and after deletion or revocation.                                                               |
| Invite/join/claim bearer -> access transition     | Bind a high-entropy digest to kind, issuer, target, fixed role, expiry and revocation; consume atomically in an authenticated mutation, never on GET or link preview.                       |
| Local/offline scorer -> outbox -> Convex          | Treat the payload as untrusted; bind it to match ID and a server-issued claim generation; recheck holder, generation, expiry, match/roster state, scoring rules and idempotency atomically. |
| Convex scheduled job -> stored data               | Internal-only invocation; bounded and idempotent batches; re-read current state; audit privileged changes; expose failures without leaking data.                                            |
| Convex -> future DUPR API                         | Send only eligible `final` results through the adapter with a server-only credential and idempotency key; record retries and manual correction needs.                                       |
| localStorage/service worker -> application domain | Parse versioned schemas and reject malformed data; do not cache auth tokens or protected API responses; provide explicit local reset/logout cleanup.                                        |
| Stored personal data -> UI/public leaderboard     | Server-generated projections enforce audience, org scope, ghost rules and leaderboard opt-in before rendering.                                                                              |
| User -> share-image export                        | Export is explicit; preview makes disclosed names/results visible before share or download; no automatic upload.                                                                            |
| GitHub/CI -> production artifact and secrets      | Review source/dependencies, use least privilege, keep secrets out of builds and artifacts, and bind evidence to the exact commit.                                                           |

## Control classification

- **SE:** server enforced in Convex/backend code.
- **CL:** client/local defense; useful for safety or recovery, never a substitute
  for server authorization.
- **OP:** operational/process control.
- **EP:** external-provider control that must be configured and verified.
- **AR:** accepted residual risk.

## Hosted-platform threats and dispositions

These controls are approved requirements, not verified runtime behavior.

| Threat                                                                                                         | Disposition                                                                                                                                                                                                                                                                                                                                                                                                          | Control        |
| -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| Stolen, expired or misconfigured Clerk session is accepted                                                     | Convex validates the configured authentication context and rejects absent, expired or wrong-issuer/audience identity. Provider session rotation, recovery, MFA and abuse controls remain Clerk configuration responsibilities.                                                                                                                                                                                       | SE, EP         |
| Webhook spoofing, replay or out-of-order delivery provisions the wrong account                                 | Verify signature and timestamp before mutation; validate expected source/configuration; deduplicate provider event IDs; make provisioning idempotent; ignore or reconcile stale events by provider version/time.                                                                                                                                                                                                     | SE, EP         |
| Client supplies another `userId`, role, org, player or scorer identity                                         | Ignore authority-bearing client fields. Resolve the user from Clerk and load current org/event/match relationships on every protected operation.                                                                                                                                                                                                                                                                     | SE             |
| **I1: forwarded claim link hijacks a profile**                                                                 | The link records an authenticated Clerk account but does not finalize. The organizer confirms the claimant's real-world identity; Clerk proves only account/session and verified-contact control. A server-derived normalized contact match may skip confirmation. Reveal the minimum contact needed.                                                                                                                | SE             |
| **I2: hostile organizer silently unclaims a linked player**                                                    | Permit immediate organizer unclaim only within 48 hours or before rating events. Later organizer action needs user confirmation or a seven-day notice with undo; block re-claim during notice and audit every transition.                                                                                                                                                                                            | SE             |
| **I3: concurrent claim race links one row twice**                                                              | A serialised mutation checks unclaimed/not-in-notice state and atomically consumes the token and links the player. Record both successful and rejected attempts without logging the token.                                                                                                                                                                                                                           | SE             |
| **I4: invite acceptance escalates the client-selected role**                                                   | Store the fixed role with the invite; acceptance reads that server row. `owner` is transfer-only and cannot be invited.                                                                                                                                                                                                                                                                                              | SE             |
| Bearer token/code is guessed, leaked, reused, logged or consumed by a link preview                             | Generate high-entropy values; store only a kind/issuer/target-scoped digest; apply expiry, rotation and revocation; consume once atomically in a mutation; redact URLs, telemetry, errors and audit diffs. Join codes grant only an event `player` role and still require eligibility checks. A leaked code can cause deletable registration spam until rotation/expiry; that bounded availability risk is accepted. | SE, CL, OP, AR |
| **I5: cross-org ghost or player is registered**                                                                | Team registration verifies each player is linked to the acting/eligible account or is a ghost belonging to the event's owning org. Every read/write query is scoped by the current org/event relationship.                                                                                                                                                                                                           | SE             |
| One subject occupies both match sides or one session signs both sides                                          | Resolve subjects from current player links; reject opposing rosters containing the same subject; reject a signature if that user already represents or signed the other side.                                                                                                                                                                                                                                        | SE             |
| **I6: alternate ghost bypasses the self-rating lock**                                                          | Resolve the lock per subject at read/write time; once any linked row has a rated match, a fresh or newly linked ghost inherits the locked account state.                                                                                                                                                                                                                                                             | SE             |
| **I7: ghost or personal data leaks through search, public event or leaderboard**                               | Ghosts are not globally searchable, are visible only within their creating org to members, and require explicit account opt-in for public leaderboard identity. Public/event projections omit ghost names, claim contacts, emails, signatures, audit internals and non-opted-in identities.                                                                                                                          | SE             |
| **I8: account deletion cascades through results and ratings**                                                  | Deleted users immediately fail closed. Revoke Clerk sessions/linkage, memberships, event roles, pending invites/claims and queued external work; scrub email/name/claim contacts/DUPR IDs; convert linked players to unnamed ghosts; retain opaque IDs and rating events; archive the personal org. The draft's required `clerkId`/`email` fields need adjustment in the later schema ticket.                        | SE, EP, OP     |
| **I9: owner leaves and orphans a club**                                                                        | Require explicit transfer before leaving; on deletion promote the longest-tenured admin with an audit row, or archive the club read-only if none exists.                                                                                                                                                                                                                                                             | SE             |
| **I10: guest import duplicates the signed-in host as a ghost**                                                 | Require the host to select which local name is theirs and map that appearance to the authenticated user's player row; create ghosts only for the remaining names.                                                                                                                                                                                                                                                    | SE, CL         |
| **I11: role/subject/junior type drift grants authority or collects unsupported data**                          | Keep org roles separate from event roles, resolve rating subjects at read time, and exclude junior divisions until an approved parent-consent flow exists. Server schemas and authorization tests must preserve those distinctions.                                                                                                                                                                                  | SE, OP         |
| **T1/T2: scorer claim holder disappears or blocks a match**                                                    | Claims exist only on `ready` matches, expire after three hours, may be revoked by staff, and are always superseded by authorized staff manual entry.                                                                                                                                                                                                                                                                 | SE             |
| **T3: scoring claim is issued for an unresolved match**                                                        | The claim mutation re-resolves both teams and requires current match status `ready`.                                                                                                                                                                                                                                                                                                                                 | SE             |
| **T4/T10: stale, replayed, duplicate or superseded offline submission applies**                                | Bind each payload to a server-issued claim generation/revision and idempotency key. Atomically recheck holder, generation, expiry, current match state/result/roster and score. Revoke/takeover increments the generation; invalid items end visibly as `superseded`.                                                                                                                                                | SE, CL         |
| Offline payload forges score, winner, roster or rally data                                                     | The payload contains no authority-bearing roster. Server domain rules validate games/winner against the stored match/scoring snapshot and treat `rallyHistory` as supporting data, not proof of identity.                                                                                                                                                                                                            | SE             |
| **T5: participant uses staff power to sign for opponents or resolve a dispute**                                | Resolve participant status server-side. A participant cannot sign the opposing side, staff-override it or resolve that match's dispute. A personal-org exception uses `conflicted`, weight 0.25 and no DUPR eligibility.                                                                                                                                                                                             | SE             |
| **T6: a signature is mistaken for verified physical identity**                                                 | **A Pickle King signature proves that an authenticated session performed the signing action; it does not prove the physical identity of the human holding the device.** This is an accepted limitation, not biometric verification.                                                                                                                                                                                  | AR             |
| **T7/T8/T9: desk staff auto-signs, an unreachable signer blocks forever, or dispute resolution is unrecorded** | A non-participant recorder auto-signs neither side; eligible non-participant staff may override an unsigned side only after 24 hours with an audit row; every dispute resolution stores actor, reason and time.                                                                                                                                                                                                      | SE             |
| **T11: scoring configuration changes after play starts**                                                       | Lock division scoring/eligibility when registration closes and store an immutable per-match scoring snapshot used for every submission/correction validation.                                                                                                                                                                                                                                                        | SE             |
| Unauthorized result correction silently changes history                                                        | Staff-only mutation requires a reason, preserves before/after history, returns the result to `recorded`, clears/requires both signatures again, and refuses a winner-changing correction after downstream play until explicitly voided. Ratings replay from the event log; sent DUPR items become `correction-needed`.                                                                                               | SE, OP         |
| Non-final result advances a bracket, affects rating or reaches DUPR                                            | Only `final` is downstream-eligible. `recorded`, `signed` and `disputed` have no bracket, rating or external-export effect.                                                                                                                                                                                                                                                                                          | SE             |
| **T26/T27: rally history grows without bound or live-score subscriptions expose/overload durable state**       | Keep submitted `rallyHistory` bounded and validated, persist durable snapshots in chunked `rallyLogs`, and expose only the minimal current projection through `liveScores`; authorize spectators by event visibility.                                                                                                                                                                                                | SE, CL, OP     |
| **T28: scheduled job is unspecified, externally invoked, races state or runs unbounded**                       | Use only the named jobs from D4; jobs are internal-only, bounded, retryable/idempotent, and re-authorize/re-read each target before mutation. Privileged changes and failures are audited/observable.                                                                                                                                                                                                                | SE, OP         |
| Server credential reaches source, client bundle, logs or share output                                          | Keep credentials in provider/CI secret stores, scan repository and artifacts, restrict environment access, redact logs, rotate on suspected exposure, and never prefix public variables with secret material.                                                                                                                                                                                                        | OP, EP         |
| Audit log is altered or becomes a personal-data/token dump                                                     | Append-only writes through server functions; least-privilege reads; minimal structured diffs; retention/access review; no raw bearer token, credential, contact value or unnecessary personal data.                                                                                                                                                                                                                  | SE, OP         |
| **T23/T24/T25: future DUPR submission is unauthorized, duplicated, retained indefinitely or premature**        | Adapter alone reads the scoped server credential. Require club authority, participant mappings, `final`, no conflicted signature, correction window, `matchId:finalAt` idempotency and the approved terminal/purge states. Retry visibly; do not assume remote edit/void support.                                                                                                                                    | SE, OP         |
| Guest import fabricates matches or manipulates internal rating                                                 | Server replay can validate structure but cannot prove who played or whether an offline event occurred. Imported matches use the approved low-weight/conflicted treatment and are never DUPR-eligible. Deliberate low-impact internal-rating manipulation remains accepted.                                                                                                                                           | SE, AR         |

`PLAN.md` findings T12-T22 other than T11 are tournament/rating correctness
decisions rather than new authority or disclosure boundaries. Their resolved
domain invariants still require ordinary implementation tests; they are not
reclassified here as security controls.

## Current guest/offline threats

| Threat                                                 | Mitigation                                                                                                                                                                              | Control |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| Corrupt or edited localStorage snapshot                | Versioned schema parse, domain validation and recoverable reset; never silently trust malformed state.                                                                                  | CL      |
| Markup/script-like player name or stored content       | Length/shape validation and React/Canvas text rendering; no HTML interpretation. Hosted writes repeat validation server-side.                                                           | CL, SE  |
| Accidental result finalization                         | Pause plus explicit confirmation; hosted results additionally follow the server result/signature state machine.                                                                         | CL, SE  |
| Stale service worker during live play                  | Defer activation while a match is active and recover predictably after reload. Do not cache auth tokens or protected API responses.                                                     | CL      |
| Timer drift or device sleep corrupts match integrity   | Recompute timers from absolute deadlines and lifecycle state rather than trusting elapsed callbacks.                                                                                    | CL      |
| Unlocked/shared device exposes local history or outbox | Clear-session/history controls, privacy notice, bounded storage, and logout cleanup of sensitive hosted/session state. Browser data remains readable to anyone controlling the profile. | CL, AR  |
| Accidental local-history disclosure                    | Separate bounded active/history stores and provide an explicit local reset.                                                                                                             | CL      |
| User unintentionally shares names/results              | Generate locally, preview, and require an explicit share/download action; no automatic transmission. Intentional sharing remains the user's disclosure.                                 | CL, AR  |
| Dependency, CI or artifact compromise                  | Lockfile, review, least-privilege workflows, CodeQL/dependency review/secret scanning, exact-commit verification and controlled production artifacts.                                   | OP, EP  |

## Privacy and residual risk

The engineering model collects no date of birth and no location by default.
Gender or age bracket is collected only when a division requires it. Public
leaderboards require opt-in; unclaimed identities are not globally searchable
or public. Clerk, Convex and eventual DUPR processing in the United States is
an acknowledged architecture characteristic, not a legal conclusion.
SPE-98 and SPE-99 remain the authority for unresolved operator/OIC decisions.

Residual risks include physical access to an unlocked browser profile,
intentional share disclosure, bearer-session use by a different human, and
low-weight manipulation of unverifiable guest imports. Provider controls and
all hosted-platform server controls remain unverified until their
implementation tickets supply executable evidence.

## Review triggers

Re-review this model before releasing any material change to identity/session
configuration, authorization or public projections, org roles, claim/invite
flows, result/signature states, offline synchronization, deletion/anonymization,
scheduled jobs, new personal data, external APIs, analytics, payments, uploads,
or deployment/secret boundaries.
