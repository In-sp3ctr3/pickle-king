# Convex Backend Foundation

Status: approved for implementation by SPE-103

## Outcome

Connect the Cloudflare-hosted browser application to separate Convex development
and production deployments while preserving the existing offline guest scorer.
The only backend behavior is a harmless deterministic connectivity query.

## Requirements

1. `convex/` contains one public read-only query that returns a stable,
   non-personal connectivity value and has an automated backend test.
2. The browser creates a Convex client only when `NEXT_PUBLIC_CONVEX_URL` is a
   valid Convex cloud URL or loopback local-development URL. Credentials,
   arbitrary origins, paths, query strings, and fragments are rejected.
   Missing or invalid configuration leaves the guest application usable and
   reports an unobtrusive unavailable diagnostic.
3. A configured client renders the query result without making application
   navigation, scoring, persistence, installation, or offline startup depend on
   the network response.
4. `.env.example` classifies the browser-public URL, local deployment selector,
   and CI deploy credential. No privileged value uses a `NEXT_PUBLIC_` prefix.
5. The existing `npm run check` and `./scripts/verify` path typechecks and tests
   Convex code. The existing 300-logical-line check includes `convex/` without an
   exemption.
6. Development and production Convex deployments exist. An exact candidate
   preview executes the query before merge, and the deployed production client
   and backend execute it after merge.

## Non-goals

No application schema, tables, users, orgs, players, identity, Clerk,
authorization, ratings, matches, result trust, DUPR, Worker-side proxy, server
action, middleware, runtime API route, or guest-data synchronization.

## Acceptance

- The query test returns the exact expected value.
- Provider/config tests cover configured, missing, and invalid public URLs.
- Throwing-query and unreachable-backend tests keep navigation, scoring, and
  local persistence usable while the isolated diagnostic reports failure.
- Existing guest tests and the canonical full verification remain green with no
  Convex environment configured.
- The real development, deployed preview, and post-merge production targets
  return/render the same connectivity value with recorded source, frontend
  artifact, and backend deployment identities.
- Repository and built artifacts contain no Convex deploy/admin credential.
