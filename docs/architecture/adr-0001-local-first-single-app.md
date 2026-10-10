# ADR 0001: Local-first single application

Status: accepted for guest data; cloud features superseded by ADR-0009
Date: 2026-07-30

## Context

Pickle King is used beside one court, often with unreliable connectivity. The
data is ephemeral and personal, and the first release has no collaboration need.

## Decision

Keep guest tournament data in a versioned, schema-validated localStorage
snapshot. Use one URL route and hash screen identifiers so player names never
appear in URLs or server logs. ADR-0009 owns the separate browser-reached
Convex backend; connecting to it must not make guest scoring network-dependent.

## Consequences

The app works privately and offline with minimal operating cost. Data does not
sync between devices and can be lost when browser storage is cleared. A future
sync feature requires a replacement ADR, threat model, and migration plan.
