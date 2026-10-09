# Verification

Status: locally verified; cloud delivery blocked

## Baseline

- Canonical start: `1e8ed2cfbe1940924c035f323d733c23bbb86cd4`.
- Harness: adopted/accepted `e566213e527802f6ab305486bde26a10dfb07975`,
  `action: no_action_required`, no local drift.
- Start hygiene: zero blockers after preserving the superseded architecture
  branch and existing Dependabot proposals as separately owned work.
- Audit: 7 moderate, 19 high, 2 critical vulnerable packages.
  `handlebars@4.7.9` is dev-only, transitive, and unreachable because the
  owning ESLint plugin is not loaded; npm proposes a semver-major plugin change.
  `next@16.2.12` is direct/production, but its critical Windows server, Image
  Optimization, and `next/og` paths are unused by the vinext Cloudflare Worker;
  `next@16.4.0` is the non-major audit fix. No baseline dependency was
  remediated.
- Local runtime observed: Node 26.0.0/npm 11.12.1; canonical CI remains Node
  22.13 as declared by the project profile.

## Current-tree evidence

- `./scripts/verify --full` passed on 2026-10-09 with
  `NEXT_PUBLIC_CONVEX_URL` empty and `PICKLE_KING_VERIFY_PORT=3103`: harness
  provenance, Vinext compatibility, formatting, lint, root and Convex
  typechecks, 300-line gate, spec integrity, 59 Vitest files/324 tests,
  production build, rendered HTML, PWA artifacts, five share-image browser
  cases, and recap geometry assertions.
- `convex/status.test.ts` calls the generated public API through `convex-test`
  and returns exactly `ready`.
- Provider/config coverage includes configured, missing, invalid, unreachable,
  cached-result-while-disconnected, throwing-query, client cleanup, and local
  persistence behavior.
- Missing-config and configured production builds and Worker renders passed.
- Local anonymous Convex development runtime returned `ready`. With that
  runtime stopped, a real browser displayed `Cloud offline`, opened Quick
  Match, started Ada versus Grace, and recorded Ada's first rally while the
  scorer remained usable.
- Deliberate `ready` → `broken` query mutation failed the backend assertion and
  was restored. A deliberate Convex type error failed `typecheck:convex` and
  was restored.
- Repository/diff scan found no tracked environment file or deploy credential.
  Built client/server artifacts contain neither `CONVEX_DEPLOY_KEY` nor
  `CONVEX_DEPLOYMENT`. The only token-shaped URL is an intentional rejected
  input in `src/backend/convex-url.test.ts`.
- Post-install `npm audit --json` remains exactly 7 moderate, 19 high, and 2
  critical vulnerable packages. No Convex dependency added an advisory; the
  baseline classification below is unchanged.
- Fresh implementation review found no remaining code finding. Earlier review
  findings around generated-code policy, real guest-flow coverage, cloud URL
  validation, documentation, server construction, and app remounting were
  fixed before the final review.
- Fresh visual review passed its 9/9 responsive subset. The minimum applicable
  iPad hint gap was 10.46875px against an 8px requirement. At 320x568,
  390x844, 844x390, 820x1180, 1180x820, and 1440x1000, match bottom, client
  height, and scroll height matched with no horizontal overflow or console
  errors.

## Blocked external evidence

- Convex CLI has no authenticated cloud session.
- No `CONVEX_DEPLOY_KEY` or `CONVEX_DEPLOYMENT` is present in the environment,
  and the GitHub repository has no Convex Actions secret or variable.
- Therefore development/production cloud identities, exact-candidate preview,
  exact-head CI, PR/merge, post-merge production smoke, and delivery hygiene
  are not claimed. No fallback credential, public secret, or unapproved
  account/login flow was created.

## Independent Design Review

The fresh review found three P1 and two P2 gaps: isolated query failure/offline
proof, production smoke evidence, exact preview frontend/backend binding,
client-only import and URL constraints, plus concrete test/audit/generated-code
and two-sided rollback gates. All five were accepted and added to `spec.md` and
`plan.md` before implementation.
