# Pickle King

An offline-first tournament director and scorekeeper for a weekly pickleball
crew. Seed 4–16 players, finish a fair one-court knockout inside the booking,
and crown a winner without sending player data anywhere.

> Pickle King is under active v1 development. Ratings shape Competitive or
> Social draws; the app does not calculate an official pickleball rating.

## What it does

- Connected, double-sided singles brackets with automatic byes
- Competitive seeding or closer-rated Social opening matchups
- One-court, round-by-round scheduling with protected rest
- Mandatory third-place match before the final
- Optional booking timer for tournaments and Quick Match
- Win-by-two scoring, buzzer finishes, and golden point for timed ties
- Explicit restart, early-finish, tied-winner, and discard controls
- Standalone Quick Match for singles or doubles
- Recent Quick Match and tournament history, stored only on this device
- Remembered-name suggestions for faster rematches
- Safe player-name corrections and explicit draw rebuilds for roster changes
- One procedurally fair late-entry challenge before placement play begins
- Branded result, champion/podium, player-stat, and full-bracket PNGs
- Exact-draw replay or a prefilled fresh draw after a tournament
- Results, point differential, match history, and upset highlights
- Offline recovery across refresh, sleep, and network loss
- Local-only storage: names and scores never leave the device

## Local development

Requirements: Node.js 22.13 or newer.

```bash
npm ci
npm run dev
```

Open `http://127.0.0.1:3000`.

## Quality checks

```bash
npm run vinext:check
npm run lint
npm run typecheck
npm run check:lines
npm run test
npm run build
npm audit --audit-level=high
npm run frontend:test
npm run frontend:test:workflows
npm run test:pwa
```

See the [v1 product specification](specs/001-offline-tournament-pwa/spec.md),
[session continuity specification](specs/002-session-continuity-sharing/spec.md),
[late-entry specification](specs/003-late-entry-challenge/spec.md),
[victory and scorer polish specification](specs/004-victory-sharing-scorer-polish/spec.md),
[tournament control and sharing specification](specs/005-tournament-control-sharing/spec.md),
[architecture decisions](docs/architecture), and the
[verification records](specs).

## Privacy

Tournament data and the bounded recent-history ledger are stored only in your
browser. There is no account, analytics, cloud database, or server API. Share
images are rendered on the device and leave it only when you use the Share
control. Clearing site storage deletes local sessions and history.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) and the
[Code of Conduct](CODE_OF_CONDUCT.md). Please report vulnerabilities privately
as described in [SECURITY.md](SECURITY.md).

## License

Pickle King is available under the [MIT License](LICENSE). Third-party software
and design acknowledgements are listed in
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
