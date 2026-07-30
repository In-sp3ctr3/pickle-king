# ADR 0002: Vinext on Sites

Status: accepted with verification gate  
Date: 2026-07-30

## Context

The connected Sites starter supplies React 19, an App Router-compatible surface,
Vinext, Vite, Tailwind, and an npm lockfile. Vinext is actively developed and
does not promise complete Next.js compatibility.

## Decision

Use the starter and only supported static/client APIs. No server actions,
middleware, image optimization, database, or runtime API routes are required.
`vinext check` and a production build are blocking on every release.

## Alternatives

- Plain Vite is simpler but conflicts with the connected Sites starter.
- Full Next.js is mature but is not the runtime deployed by this Sites project.

## Consequences

The app remains portable because its product logic is plain React and
TypeScript. Framework-specific usage stays in the thin `app/` shell.
