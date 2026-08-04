# Frontend Design Contract

Status: ready

Mode: audit and repair

Owner: In-sp3ctr3

Last updated: 2026-08-03

- Product: Pickle King offline tournament PWA
- Audience: Friend groups running a pickleball session courtside
- Primary user job: Run a fair single-court tournament without back-to-back fatigue
- Primary action: Build or resume the next tournament match

## Authority

1. The approved product specification.
2. The user-supplied classic double-sided tournament-tree screenshot for
   bracket geometry.
3. The user-supplied 2026-08-03 portrait and landscape victory cards for
   result hierarchy, scale, and court atmosphere.
4. Skiper v37 for the smooth number-change character only.
5. The supplied near-black, acid-lime, athletic direction.
6. Labelled product-specific inference.

## Sources

| Source                              | Authority           | Use                                           | Status                    |
| ----------------------------------- | ------------------- | --------------------------------------------- | ------------------------- |
| User-supplied tournament screenshot | layout reference    | Wide two-contender match nodes with scores    | accepted                  |
| Skiper v37                          | measured reference  | Number transition tempo and legibility        | accepted with attribution |
| Skiper v107                         | rejection reference | Confirms Pro source must not be copied        | rejected as source        |
| Product specification               | product authority   | Flow, content, constraints, and accessibility | accepted                  |
| Product plan                        | immutable           | Flows, controls, content, accessibility       |

## Product and UX

- Audience: a friend group operating a phone or iPad beside a court.
- Primary job: finish a fair tournament inside the booked time.
- Primary action: start or resume the next scheduled match.
- Privacy: all names and scores remain local and stay out of URLs.

## Page Regions

| Region         | Purpose                      | Geometry                                          | Responsive behavior                          | Interaction                        |
| -------------- | ---------------------------- | ------------------------------------------------- | -------------------------------------------- | ---------------------------------- |
| Court header   | explicit app navigation      | centered floating island                          | labels contract, actions remain available    | back and home                      |
| Home hero      | establish identity and begin | asymmetric copy + crowned mascot                  | stacked; CTA first                           | mascot arrival and blink           |
| Run of show    | next match and time risk     | lime court slab + ordered queue                   | horizontal queue becomes list                | start the one eligible match       |
| Bracket        | advancement overview         | connected two-sided elimination tree              | full tree desktop; preserved overflow mobile | scroll, start, and correct         |
| Scorekeeper    | no-look scoring              | viewport-bound split screen + centered idle start | portrait two halves; landscape two columns   | start, add, subtract, pause, reset |
| Results        | podium and evidence          | crowned-ball focal point + grouped tables         | stacked podium then tables                   | share, review, or replay           |
| History        | recall a social session      | editorial ledger + strong score rail              | table becomes stacked match rows             | view, share, or remove one record  |
| Draw editor    | repair the field safely      | focused sheet with consequence copy               | full-height mobile dialog                    | rename, late entry, or rebuild     |
| Challenge lane | expose an amended route      | horizontal earned-match sequence                  | scroll-preserved cards on mobile             | start, correct, or pre-start undo  |
| Share result   | preview a brag artifact      | reference-led portrait winner and split score     | contained 4:5 or 9:16 canvas preview         | native share or explicit download  |
| Share bracket  | preview the complete draw    | 4:3 tree with champion focal point                | exact 1600×1200 canvas preview               | native share or explicit download  |

## Geometry

- Max content width: 1440px; gutters 20px mobile, 40px desktop.
- Corner language: 18–28px only on interactive/surface groupings; score fields are squared.
- Numerals use tabular figures with visible character separation.
- Display text must not use condensed letterforms or negative tracking.

## Typography

| Role    | Family        | Weight  | Size           | Line height | Use                                |
| ------- | ------------- | ------- | -------------- | ----------- | ---------------------------------- |
| Display | Archivo Black | 400     | fluid 44–112px | 0.88–1.02   | hero, scoreboard, results          |
| UI/body | Manrope       | 400–800 | 12–18px        | 1.4–1.7     | labels, controls, explanatory copy |

## Color

| Token     | Value     | Role                            | Contrast use             |
| --------- | --------- | ------------------------------- | ------------------------ |
| court     | `#090b08` | app background                  | base                     |
| baseline  | `#11150f` | raised court surface            | surface only             |
| chalk     | `#f5f3e9` | primary text                    | primary on dark          |
| lime      | `#c8ff3d` | active state and primary action | dark text on lime        |
| lime-deep | `#95c721` | pressed/secondary lime          | decorative or large text |
| clay      | `#ff7a4d` | delay and destructive warning   | icon plus text           |
| mist      | `#9da494` | secondary text                  | secondary on dark        |
| line      | `#2b3227` | boundaries and connectors       | non-text boundary        |

## Breakpoints

| Name             | Range      | Layout                                       | Verification |
| ---------------- | ---------- | -------------------------------------------- | ------------ |
| Mobile portrait  | 320–639px  | stacked flows and scroll-preserved bracket   | 390×844      |
| Phone landscape  | short/wide | compact header, two-column forms when viable | 844×390      |
| Tablet portrait  | 640–1023px | primary setup and bracket canvas             | 820×1180     |
| Tablet landscape | 1024px+    | primary full draw and court controls         | 1180×820     |
| Desktop          | 1280px+    | full hero split and connected bracket        | 1440×1000    |

## Components

| Component         | States                                   | Rules                                                                        |
| ----------------- | ---------------------------------------- | ---------------------------------------------------------------------------- |
| PrimaryButton     | default, pressed, disabled               | 52px minimum, filled tactile surface, no stroke                              |
| PlayerRow         | editing, invalid, complete               | inline name/React select; error text adjacent                                |
| RatingSelect      | closed, open, selected, invalid          | portal listbox; keyboard and touch operable                                  |
| MatchCard         | waiting, available, next, live, complete | round/status/edit header; two contender rows; action aligned to row midpoint |
| FinalMatchCard    | waiting, queued, next, complete          | compact warm-metal final; bounded names; trophy centered; edit in header     |
| FloatingNav       | setup, bracket, results, quick           | solid centered island; explicit Back and Home                                |
| ScoreSide         | normal, leader, golden                   | whole court adds; explicit `+1` and `Undo −1`                                |
| NumberFlow        | changing, reduced motion                 | numbers only; no ornamental looping                                          |
| Dialog            | confirm, destructive                     | initial focus, escape, focus return                                          |
| LateEntryReview   | eligible, booking-risk, placement-lock   | exact route, match count, cancel always present                              |
| Toast/live region | neutral, warning                         | polite status clears after four seconds                                      |
| NameCombobox      | empty, filtering, selected, invalid      | custom listbox; excludes already selected names                              |
| HistoryRow        | quick match, tournament                  | score-led ledger row; never dashboard-card grid                              |
| ShareCard         | score, recap, stats, bracket             | Post, Story / Reel, or Full draw over the local arena asset                  |
| StartMatchOverlay | idle, focused                            | centered lime action; scoring remains inert                                  |
| VictoryReview     | target, buzzer, golden, early, selected  | one mascot crown; score and context dominate                                 |
| DrawTools         | ready, reroll available, locked          | lives with Full draw heading; 48px controls                                  |
| ReplayDialog      | same draw, new draw, cancel              | no destructive default; roster choice is explicit                            |

## Motion

| Motion              | Purpose                       | Trigger             | Timing              | Reduced motion |
| ------------------- | ----------------------------- | ------------------- | ------------------- | -------------- |
| score digit flow    | preserve number location      | score/time update   | spring, about 320ms | immediate text |
| mascot arrival      | establish product identity    | home entry          | 720ms ease-out      | static mascot  |
| mascot blink        | give the mark restrained life | idle                | 100ms every 5.2s    | no blink       |
| selected choice     | preserve toggle context       | option change       | 240ms spring        | immediate fill |
| rating popup        | connect trigger and menu      | open/select         | 180ms ease-out      | immediate menu |
| bracket advancement | show dependency               | result confirmation | 420ms ease-out      | crossfade      |
| connector reveal    | show advancement path         | result confirmation | 280ms ease-out      | immediate      |
| mascot arrival      | celebrate tournament champion | results entry       | 700ms spring        | static mascot  |
| result confetti     | mark confirmed performance    | result review       | two bursts, 1.2s    | static scatter |
| suggestion reveal   | retain typing context         | input filtering     | 160ms ease-out      | immediate list |
| press response      | confirm touch                 | pointer/keyboard    | 90ms                | color only     |

## Anti-generic constraints

- Bracket connectors and spacing provide structure; decorative strokes do not.
- Full-width separator rules are reserved for data tables and scorer anatomy,
  not page navigation or section decoration.
- Lime is reserved for current/ready/primary state, never sprayed across all copy.
- The home visual is the existing crowned mascot without a frame, product-demo
  diagram, fake dashboard, or unrelated hero effect.
- Match nodes contain both contenders. Separate player cards are prohibited.
- Ordinary match headers use three explicit lanes: round at left, status at
  center, and edit at right. Their start action aligns to the participant-row
  midpoint rather than the whole node.
- The play-action lane exists only while an ordinary node is startable. Waiting
  and queued nodes keep a two-lane round/status header and full-width participant
  rows; they never reserve an empty action column.
- Only the recommended match may read `Next` or use the lime node state. Other
  ready matches in the earliest unfinished round read `Available` and can start.
- Native select popups are prohibited for visible product controls.
- No generic app gradients, glassmorphism, WebGL, stock sports photos, radial light orbs, or dashboard tile grids. Canvas exports use the physical court environment and restrained edge lighting from the generated arena asset.
- History reads as a courtside score ledger, not an admin dashboard.
- Result sharing is opt-in and generated locally; no automatic social prompts.
- Every share action opens the exact local PNG preview before native share or download.
- Every celebration and exported image contains one crown: the mascot's crown.
- Share generation must fail clearly rather than silently omit the mascot.
- Draw editing and sharing controls stay with the Full draw they affect.
- Structural draw edits must visually separate safe renames from destructive reseeding. A safe rename changes the stable player record only; it never submits a result correction or reopens downstream matches.
- Late-entry repair must name the protected route, show its added matches and timing impact, and never hide the continue-unchanged action.
- Result tables are read-only. Corrections and stable-identity renames live in bracket nodes.
- Ranked and Random draw copy must state whether ratings affect placement. Random draws may be rerolled only before play begins.

## Share Export Geometry

- Post exports: 1080×1350 with essential content inside x=54…1026 and y=54…1296.
- Story / Reel exports: 1080×1920 with essential content inside x=72…1008 and y=240…1640.
- Brackets have dedicated 1600×1200 Full draw, 1080×1350 Post, and 1080×1920 Story / Reel geometry. Portrait draws use mirrored horizontal branches: opening matches occupy the outside columns, each dependent match moves inward and is vertically centered between its two sources, and only the two semifinal branches converge downward into the centered final. Each dependency group owns one private merge rail; unrelated connector groups may not cross, overlap, share a rail, or enter another card.
- Bracket previews open fitted. Expand creates an internally scrolling inspection surface with overscroll containment.
- Native Web Share completion reads `Done`; only an explicit browser download reads `Saved`.
- Confirmed Quick Matches return directly to setup after one history write. The completed-score screen is not a second step.
- New tournament names are capped at 24 characters. Dynamic labels use measured fitting within single-line participant rows; run-of-show opponents stack around `vs`. Horizontal text scaling, mid-word wrapping, and negative tracking are prohibited.
- Decorative fragments stay in the outer 14% and never intersect text, scores, medals, or the mascot.
- Preview images use containment; no ancestor may crop the generated PNG.

## Acceptance criteria

- Touch targets are at least 48px and status is never color-only.
- Desktop, both tablet orientations, phone portrait, and phone landscape are
  verified.
- Live scoring stays operable with one hand and without fine pointer control.
- Reduced motion, keyboard focus, visible errors, and semantic announcements pass.
