# Threat Model

## Assets

Player names, ratings, scores, match history, session deadlines, and application
integrity. No passwords, payment data, tokens, or server-side secrets exist.

## Data flow

```text
Organizer input -> React reducer -> validated localStorage snapshot
                                -> on-device bracket/results rendering
Static deploy -> service worker cache -> offline application shell
```

## Boundaries and threats

| Threat                         | Boundary               | Mitigation                                           |
| ------------------------------ | ---------------------- | ---------------------------------------------------- |
| Corrupt or edited snapshot     | localStorage to domain | Versioned Zod parse; recoverable reset               |
| Markup/script in a player name | input to DOM           | React text rendering; trim and length limit          |
| Accidental result finalization | score UI to bracket    | Pause and explicit confirmation                      |
| Stale worker during live play  | service worker update  | Defer activation while a match is active             |
| Timer drift after sleep        | browser lifecycle      | Recompute from absolute deadlines                    |
| Dependency compromise          | build pipeline         | Lockfile, Dependabot, CodeQL, dependency review      |
| Secret in public repo          | Git/GitHub             | Secret scanning, push protection, no runtime secrets |
| Shared-device disclosure       | local device           | Clear-session action and privacy notice              |

## Security requirements

- Use restrictive browser headers where Sites permits.
- No product analytics, remote fonts, or runtime CDN assets.
- CI permissions default to read-only and elevate only per job.
- New network, auth, storage, or backend behavior requires a new review.
