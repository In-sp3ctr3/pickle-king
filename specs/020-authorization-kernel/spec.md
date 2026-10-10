# Convex Authorization Kernel

Status: approved for implementation by SPE-107

## Outcome

Add a reusable, typed, deny-by-default Convex authorization kernel that derives
the caller from `ctx.auth`, resolves the active Pickle King user and persisted
resource relationships, and asserts explicit organization or event capabilities.

## Requirements

1. `convex/lib/authz.ts` resolves the authenticated Clerk subject through
   `users.by_clerkId` and rejects absent/malformed identities, duplicate or
   unprovisioned subjects, incomplete active users, and deleted users.
2. No authority comes from a client-supplied user ID, role, email, owner flag,
   organization ID, or membership claim.
3. Resource scope is derived for orgs, events, divisions, matches, and lobbies.
   Missing/dangling, cross-linked, or ambiguous relationships fail closed.
4. Typed capabilities keep organization-wide powers separate from event powers.
   `player` is event-only. An explicit event role replaces inherited event
   capabilities for a non-owner only within that event; owner authority cannot
   be demoted or granted by an event role.
5. `orgs.ownerUserId` is canonical ownership. Active organizations require an
   agreeing owner membership; archived organizations may lack the deleted
   owner's membership but never grant owner authority from another row.
   Conflicting state and duplicate membership/event-role rows fail closed.
6. Archived organizations retain explicitly protected read access for an
   already authorized member/event role but deny every protected write.
7. Match recording, scoring, signing, and correction are structurally separate
   preliminary role gates, never final operation capabilities. Later mutations
   must additionally recheck participant side, scorer claim/revision, match
   state, conflicts, and result state.
8. Tests exercise the real Convex authentication context with schema-backed
   relationships. No public demo mutation or production test identity is added.
9. Existing `status.health`, the 18-table/28-index schema, and offline guest
   behavior remain unchanged.

## Non-goals

No Clerk configuration or UI, webhooks, account provisioning, organization or
event CRUD, invites, claiming, scoring claims, match submissions, signatures,
corrections, ratings, tournaments, DUPR processing, deletion workflow, public
private-data query, or production test data.

## Acceptance

- Required identity, role, owner/override, archived-org, cross-org, guessed-ID,
  duplicate-role, and missing/ambiguous-resource negative paths pass through
  `convex-test`.
- Capability tests assert actual target scope, not isolated role-string maps.
- Convex/root typechecks, product tests, build, and canonical full verification
  pass without changing the schema or public generated API.
- Independent plan and implementation reviews have no unresolved in-scope
  privilege-escalation or tenant-isolation findings.
- An authorized development/preview validation succeeds before any separately
  approved production release action.
