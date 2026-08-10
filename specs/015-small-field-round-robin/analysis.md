# Consistency Analysis

- The approved 4–6 threshold matches the one-court product boundary; pool play
  remains the planned answer for larger fields.
- The existing format enum, standing source ranks, and V2 document shape are
  sufficient. A storage version change would add migration risk without a data
  model change.
- Circle rotation starting with the stored player order reproduces the shipped
  four-player pairings and extends deterministically to five and six.
- The eight-minute rule is presentation guidance only. Existing validation still
  blocks schedules that mathematically cannot fit, while untimed tournaments
  bypass cap calculation and advisory rendering.
- No unresolved product, architecture, privacy, or frontend-identity conflict
  blocks implementation.
