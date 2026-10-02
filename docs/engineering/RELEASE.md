# CI and release evidence

Adapted from the accepted Project Harness release contract at `5d7052e820f7a7940be86df1c234e6da16047c6d`. Existing [ADR-0002](../architecture/adr-0002-vinext-sites.md), README version convention, Quality, CodeQL and Dependency Review workflows remain authoritative for their native behavior.

Quality calls `./scripts/verify --full` after Node/npm/Chromium setup. Record check name, mode, exact source SHA, result, time and exclusions for PR and merged `main`. A check from an older head is stale. Build success and screenshots alone do not prove user journeys or release readiness.

There is no verified repository-owned deployment command, environment identity probe, flag provider, telemetry provider, smoke script or automated release-check. A candidate release therefore needs an explicit record in its ticket/PR of: exact source and artifact, actual target identity/configuration, required CI and independent review, relevant product QA and offline/share checks, rollout operator, stop conditions, and either a tested rollback route or a forward-recovery plan. Unknown target identity, artifact provenance, review blocker or recovery route prevents a readiness claim. Do not infer a successful production smoke from local `npm run start`.

After separately authorized deployment, verify the observed release and target identity, application/offline behavior and relevant critical journey; record time, result, gaps and observation owner. For a persistent or user-visible change, record success/failure signals and cleanup work appropriate to the release. No harness command deploys, changes flags, migrates data or restores data.
