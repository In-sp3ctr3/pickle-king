# Feature Specification: Result Preview and Desktop Download

## Goal

Make the confirmed score artifact visible before it leaves the device, provide
an explicit download path on every browser, and align the result composition
with the supplied Pickle King winner references.

## Requirements

- The result review displays the exact 1080 by 1350 PNG before confirmation.
- Native Share and Download are separate actions. Download remains available
  when the browser does not support file sharing.
- No control displays indeterminate text such as “Building image.”
- The winner name is dominant; the two scores and participant names occupy
  separate lanes so a result such as 4 to 11 cannot collide with its separator.
- Standard target finishes do not repeat the score margin or confirmation
  instructions. Exceptional finishes may retain concise context.
- An untimed scorer omits the match-clock region entirely.
- The idle Start match control is a compact overlay centered on the viewport.
- Existing local-only behavior, result correction, confirmation, confetti,
  reduced motion, and tournament-stage labels remain intact.

## Reference Contract

The two supplied winner images are authoritative for hierarchy, weight,
winner/score prominence, and acid-lime contrast. Pickle King retains its
existing crowned-ball mark instead of copying the references’ generic crown,
fake XP, or decorative copy.
