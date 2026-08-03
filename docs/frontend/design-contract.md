# Frontend Design Contract

Status: ready

Mode: audit and repair

Owner: In-sp3ctr3

Last updated: 2026-08-02

- Product: Pickle King offline tournament PWA
- Audience: Friend groups running a pickleball session courtside
- Primary user job: Run a fair single-court tournament without back-to-back fatigue
- Primary action: Build or resume the next tournament match

## Authority

1. The approved product specification.
2. The user-supplied classic double-sided tournament-tree screenshot for
   bracket geometry.
3. Skiper v37 for the smooth number-change character only.
4. The supplied near-black, acid-lime, athletic direction.
5. Labelled product-specific inference.

## Sources

| Source                              | Authority           | Use                                           | Status                    |
| ----------------------------------- | ------------------- | --------------------------------------------- | ------------------------- |
| User-supplied tournament screenshot | layout reference    | Wide two-contender match nodes with scores    | accepted                  |
| Skiper v37                          | measured reference  | Number transition tempo and legibility        | accepted with attribution |
| Skiper v107                         | rejection reference | Confirms Pro source must not be copied        | rejected as source        |
| Product specification               | product authority   | Flow, content, constraints, and accessibility | accepted                  |
| Product plan                        | immutable           | Flows, controls, content, accessibility       |

## Product and UX

- Audience: a friend group operating a phone beside a court.
- Primary job: finish a fair tournament inside the booked time.
- Primary action: start or resume the next scheduled match.
- Privacy: all names and scores remain local and stay out of URLs.

## Page Regions

| Region       | Purpose                      | Geometry                             | Responsive behavior                          | Interaction                  |
| ------------ | ---------------------------- | ------------------------------------ | -------------------------------------------- | ---------------------------- |
| Court header | explicit app navigation      | centered floating island             | labels contract, actions remain available    | back and home                |
| Home hero    | establish identity and begin | asymmetric copy + crowned mascot     | stacked; CTA first                           | mascot arrival and blink     |
| Run of show  | next match and time risk     | lime court slab + ordered queue      | horizontal queue becomes list                | start the one eligible match |
| Bracket      | advancement overview         | connected two-sided elimination tree | full tree desktop; preserved overflow mobile | scroll, start, and correct   |
| Scorekeeper  | no-look scoring              | split screen with oversized zones    | portrait two halves; landscape two columns   | add, subtract, pause, reset  |
| Results      | podium and evidence          | crown focal point + grouped tables   | stacked podium then cards                    | correct or return home       |
| History      | recall a social session      | editorial ledger + strong score rail | table becomes stacked match rows             | share or remove one record   |
| Draw editor  | repair the field safely      | focused sheet with consequence copy  | full-height mobile dialog                    | rename or guarded rebuild    |
| Share result | create a brag artifact       | portrait score poster                | preview scales without cropping              | share file or download       |

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

| Component         | States                                | Rules                                           |
| ----------------- | ------------------------------------- | ----------------------------------------------- |
| PrimaryButton     | default, pressed, disabled            | 52px minimum, filled tactile surface, no stroke |
| PlayerRow         | editing, invalid, complete            | inline name/React select; error text adjacent   |
| RatingSelect      | closed, open, selected, invalid       | portal listbox; keyboard and touch operable     |
| MatchCard         | waiting, queued, next, live, complete | wide two-contender rows; circle action at right |
| FinalMatchCard    | waiting, queued, next, complete       | finalist left/right with trophy in the center   |
| FloatingNav       | setup, bracket, results, quick        | solid centered island; explicit Back and Home   |
| ScoreSide         | normal, leader, golden                | whole large zone adds; explicit minus button    |
| NumberFlow        | changing, reduced motion              | numbers only; no ornamental looping             |
| Dialog            | confirm, destructive                  | initial focus, escape, focus return             |
| Toast/live region | neutral, warning                      | concise and announced politely                  |
| NameCombobox      | empty, filtering, selected, invalid   | custom listbox; excludes already selected names |
| HistoryRow        | quick match, tournament               | score-led ledger row; never dashboard-card grid |
| ShareCard         | quick result, bracket                 | Canvas PNG using local data and brand tokens    |

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
| crown arrival       | celebrate winner              | results entry       | 700ms spring        | static crown   |
| result celebration  | mark confirmed performance    | result review       | 520ms spring        | static crown   |
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
- Only the one-court eligible match may read `Next` or use the lime node state;
  other dependency-ready matches read `Queued`.
- Native select popups are prohibited for visible product controls.
- No gradients, glassmorphism, WebGL, stock sports photos, or dashboard tile grids.
- History reads as a courtside score ledger, not an admin dashboard.
- Result sharing is opt-in and generated locally; no automatic social prompts.
- Structural draw edits must visually separate safe renames from destructive reseeding.

## Acceptance criteria

- Touch targets are at least 48px and status is never color-only.
- Desktop, both tablet orientations, phone portrait, and phone landscape are
  verified.
- Live scoring stays operable with one hand and without fine pointer control.
- Reduced motion, keyboard focus, visible errors, and semantic announcements pass.
