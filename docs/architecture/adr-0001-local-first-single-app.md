# ADR 0001: Local-first single application

Status: accepted  
Date: 2026-07-30

## Context

Pickle King is used beside one court, often with unreliable connectivity. The
data is ephemeral and personal, and the first release has no collaboration need.

## Decision

Use one React/Vinext application with no backend. Keep tournament data in a
versioned, schema-validated localStorage snapshot. Use one URL route and hash
screen identifiers so player names never appear in URLs or server logs.

## Consequences

The app works privately and offline with minimal operating cost. Data does not
sync between devices and can be lost when browser storage is cleared. A future
sync feature requires a replacement ADR, threat model, and migration plan.
