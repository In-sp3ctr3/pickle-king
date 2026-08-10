# Quickstart Validation: Serve tracker

## Prerequisites

- Node.js 22.13+ and the committed npm lockfile dependencies.
- Run commands from the worktree root.

## Focused validation

1. Run the match-domain tests and confirm these sequences:
   - singles serve, point, and side out;
   - doubles opening `0–0–2` side out;
   - doubles Server 1 point, Server 1 fault, Server 2 point, and side out;
   - whole-rally undo and service-only repair;
   - persistence recovery of a legacy active session.
2. Run the live-match component tests and verify setup, rally labels, guide
   labels, and recovery controls.
3. Run the browser scorer flow at 390×844, 844×390, 820×1180, and 1180×820:
   choose starting positions, record rallies, undo one, repair a missed serve,
   and verify keyboard focus and reduced-motion feedback.
4. Run `npm run check`, `npm run format:check`, and the frontend release gate.

## Expected outcome

Every displayed server and court side agrees with the sequence above. No point
is awarded to a receiving team under side-out scoring, and no player data leaves
the device.
