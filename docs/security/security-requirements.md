# Security Requirements

- Player names, scores, ratings, and history remain on the device unless the
  user explicitly invokes Share.
- Active-session and recent-history records use separate versioned schemas.
- Invalid persisted data must enter a recoverable reset path rather than being
  silently accepted or discarded.
- User names render as text and are trimmed, length-limited, and validated for
  case-insensitive uniqueness where tournament rules require it.
- Share images are rendered locally. Native file sharing is feature-detected;
  the fallback is an explicit local download.
- History is bounded to 50 Quick Matches and 10 completed tournaments.
- No accounts, analytics, remote fonts, runtime CDN assets, or server data APIs
  may be introduced without a new architecture and threat-model review.
- CI uses least-privilege permissions and runs dependency review, CodeQL, and
  repository quality gates.
