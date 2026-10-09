# Implementation Plan

## Design Contract

The browser is the only new application actor. A public build-time deployment
URL selects a Convex client; the client calls one argument-free read query and
renders only its fixed result. Convex deploy credentials stay in Convex/GitHub
secret storage and are consumed only by deployment tooling.

Positive journey:

`configured browser → validate public URL → ConvexProvider → status query → fixed diagnostic text`

Negative journeys:

- Missing/invalid public URL → no client or query → guest application and local
  persistence behave unchanged → diagnostic says unavailable.
- Backend offline/query failure → client-only provider remains outside the
  application reducer → a diagnostic-only error boundary and connection-state
  display report loading/disconnected/error → guest navigation, scoring, and
  local persistence continue.
- Missing deploy credential in CI/deploy tooling → command fails before a
  backend push; no fallback secret or browser-prefixed credential is created.

## Boundaries and Risks

- There is no authorization or personal data in scope. The query accepts no
  input and reads no database state.
- Network retries/realtime lifecycle belong to the Convex client. They must not
  feed the application reducer, browser storage, service worker, or navigation.
- `convex/react` is imported only by a client-only provider module. The server
  layout may render that module but must not import `convex/nextjs`, generated
  backend code, server fetch helpers, actions, middleware, or API routes. Both
  missing-config and configured production builds/Worker renders are checked.
- Public URL validation accepts standard `https://<deployment>.convex.cloud`
  endpoints and explicit loopback HTTP(S) development endpoints only. Custom
  and self-hosted origins are deferred.
- No migration, flag, or concurrency behavior exists because no table is added.
- Rollback records the previous frontend and backend revisions, restores the
  frontend first so it no longer calls the new query, then redeploys/removes the
  backend function and deletes temporary previews. The query owns no data to
  migrate or delete.
- Deployment separation is proven by provider-issued development, production,
  and preview identities without recording keys.

## Dependency Baseline

The pre-edit audit is 7 moderate, 19 high, and 2 critical vulnerable packages.
`handlebars@4.7.9` is transitive through the dev-only
`eslint-plugin-boundaries`, which the current ESLint config does not import. It
is not in the application runtime or deployment path. `next@16.2.12` is a
direct production dependency, but the critical advisory paths are a
Windows-hosted Next server, Image Optimization, and `next/og`; Pickle King uses
vinext on Cloudflare Workers and none of those paths. Other high findings in
Next/Sharp and Cloudflare/Vinext build tooling remain existing explicit risk;
SPE-103 does not claim to remediate them or merge broad Dependabot changes.
After dependency installation, the lockfile and structured audit are compared
to this baseline; any new high/critical finding or exact-head Dependency Review
failure blocks delivery pending explicit classification.

## Deployment Binding

Quality CI never receives production credentials and does not deploy. The
approved preview pipeline must use a least-privilege Convex preview key with
`convex deploy --cmd` so the exact frontend build receives the exact preview
backend URL as `NEXT_PUBLIC_CONVEX_URL`; it then records candidate SHA,
frontend artifact/URL, backend deployment identity, CLI query result, and
browser assertion. Production uses a separately scoped production key only on
the protected main deployment path and records the equivalent post-merge
identities. No generic admin key is required.

## Acceptance to Evidence

| Criterion                            | Evidence                                                                                                                   |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| Deterministic backend query          | `convex/status.test.ts` through the canonical Vitest run                                                                   |
| Optional, validated provider         | focused provider/config component tests, including exact URL partitions                                                    |
| Offline guest independence           | missing/invalid/unreachable/throwing-query tests plus existing guest navigation, persistence, PWA, and browser regressions |
| Config/secret boundary               | config test, `.env.example`, repository and artifact scan                                                                  |
| Canonical CI coverage                | deliberate-break check, restored `npm run check`, `./scripts/verify --full`                                                |
| Real environments/preview/production | provider CLI identities and exact-candidate/post-merge browser/query evidence tied to frontend and backend revisions       |

## Delivery Order

1. Review this plan independently.
2. Add dependencies and minimal generated Convex boundary.
3. Add failing backend and client/config tests.
4. Implement the query, optional provider, and diagnostic.
5. Extend existing scripts/config/docs only where required.
6. Provision deployments and preview through provider-approved credentials.
7. Run canonical verification, independent diff review, PR/CI, merge, and
   post-merge gates.

Only required generated client/server bindings are committed. Starter schema,
sample data, demo functions, and demo UI are removed. The backend test is
discovered from `convex/**` and calls the generated API through `convex-test`,
not a handler directly.
