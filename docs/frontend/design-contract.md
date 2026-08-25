# Frontend Design Contract

Status: ready

Pipeline version: 2

Mode: audit and repair

Owner: In-sp3ctr3

Last updated: 2026-08-25

- Product: Pickle King offline tournament PWA
- Audience: Friend groups running a pickleball session courtside
- Primary user job: Turn selected informal Quick Matches into an honest,
  shareable end-of-session recap.
- Primary action: Select ledger matches and preview separate Singles and
  Doubles Receipts.
- Visual thesis: The dark courtside ledger opens into a cream paper receipt
  where oversized black format type and one acid-lime record slab turn local
  match data into a social artifact without implying a tournament champion.
- Content narrative: Select the played matches, review the derived player
  records, then share a deterministic Post or Story page.
- Selected direction: Reference-lock the existing share system to the five
  supplied Aug 22 authorities: two Receipts and three individual-result
  posters. Preserve their stable shaded artwork as cleaned local templates,
  then draw only real match data into measured text regions.
- Selected by: Product owner in the 2026-08-24 annotated export repair request.
- Selection evidence: supplied Aug 22 Singles, Doubles, Poster, Frame, and
  Receipt images; user-approved direct reference-pixel reuse; and
  `specs/016-session-recap/spec.md`.
- Selection status: approved

## Authority

1. The approved product specification.
2. The user-supplied classic double-sided tournament-tree screenshot for
   bracket geometry.
3. The user-supplied 2026-08-03 portrait and landscape victory cards for
   result hierarchy, scale, and court atmosphere.
4. Skiper v37 for the smooth number-change character only.
5. The supplied near-black, acid-lime, athletic direction.
6. Labelled product-specific inference.
7. The user-supplied Aug 22 Singles and Doubles Receipts for exact recap
   composition, stable masthead art, color, and table rhythm. The approved
   compact extension raises product capacity to twelve rows.
8. The three user-supplied Aug 22 individual-result posters for exact stable
   artwork, mascot crop, score hierarchy, spacing, and black/cream variants.
9. The user's annotated side-by-side boards for the defects to remove: wrong
   fonts, misplaced mascot punctuation, crowded rules, invented `FINAL` and
   `FIRST TO` copy, and weak footer spacing.

## Sources

| Source                              | Authority           | Use                                           | Status                    |
| ----------------------------------- | ------------------- | --------------------------------------------- | ------------------------- |
| User-supplied tournament screenshot | layout reference    | Wide two-contender match nodes with scores    | accepted                  |
| Skiper v37                          | measured reference  | Number transition tempo and legibility        | accepted with attribution |
| Aug 22 Receipts posters             | visual authority    | Light recap export hierarchy and color system | accepted                  |
| Skiper v107                         | rejection reference | Confirms Pro source must not be copied        | rejected as source        |
| Product specification               | product authority   | Flow, content, constraints, and accessibility | accepted                  |
| Product plan                        | immutable           | Flows, controls, content, accessibility       |

## Reference Atlas

| Reference                    | Borrow                                              | Do not borrow                                   | Evidence                                               |
| ---------------------------- | --------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------ |
| Existing quick-live scorer   | Split court scoring scale and restrained lime state | Extra dashboard panels or reduced score targets | `docs/frontend/evidence/quick-live-desktop-source.png` |
| USA Pickleball serving rules | Legal service sequence and terminology              | Live formation or stacking movement claims      | `specs/015-serve-tracker/research.md`                  |

## Product and UX

- Audience: a friend group operating a phone or iPad beside a court.
- Primary job: finish a fair tournament inside the booked time.
- Primary action: start or resume the next scheduled match.
- Privacy: all names and scores remain local and stay out of URLs.

## Page Regions

| Region         | Purpose                         | Geometry                                          | Responsive behavior                        | Interaction                          |
| -------------- | ------------------------------- | ------------------------------------------------- | ------------------------------------------ | ------------------------------------ |
| Court header   | explicit app navigation         | centered floating island                          | labels contract, actions remain available  | back and home                        |
| Home hero      | establish identity and begin    | asymmetric copy + crowned mascot                  | stacked; CTA first                         | mascot arrival and blink             |
| Run of show    | next match and time risk        | lime court slab + ordered queue                   | horizontal queue becomes list              | start the one eligible match         |
| Bracket        | advancement overview            | connected two-sided elimination tree              | bounded pan/zoom with fitted overview      | pan, zoom, fit, start, and correct   |
| Round robin    | participation and qualification | live table + 3–5 paired rounds + placement row    | three cards become one; rounds stack       | start, rest, correct, and track rank |
| Scorekeeper    | no-look scoring                 | viewport-bound split screen + centered idle start | portrait two halves; landscape two columns | start, add, subtract, pause, reset   |
| Results        | podium and evidence             | crowned-ball focal point + grouped tables         | stacked podium then tables                 | share, review, or replay             |
| History        | recall a social session         | editorial ledger + strong score rail              | table becomes stacked match rows           | view, share, or remove one record    |
| Draw editor    | repair the field safely         | focused sheet with consequence copy               | full-height mobile dialog                  | rename, late entry, or rebuild       |
| Challenge lane | expose an amended route         | horizontal earned-match sequence                  | scroll-preserved cards on mobile           | start, correct, or pre-start undo    |
| Share result   | preview a brag artifact         | reference-led poster with three treatments        | contained 4:5 or 9:16 canvas preview       | choose style, share, or download     |
| Share bracket  | preview the complete draw       | 4:3 tree with champion focal point                | exact 1600×1200 canvas preview             | native share or explicit download    |
| Serve guide    | identify legal next server      | compact strip under scorer top bar                | remains above score targets                | read-only court cue and Fix serve    |

## Page Rhythm Map

| Region        | Entry                | Dominant cue                      | Exit               | Mobile treatment                |
| ------------- | -------------------- | --------------------------------- | ------------------ | ------------------------------- |
| Match top bar | navigation and clock | time and match context            | serving guide      | compact three-column header     |
| Serve guide   | legal next serve     | named player plus highlighted box | score targets      | two-line text beside mini-court |
| Score targets | rally winner choice  | large team score                  | pause/end controls | remains full-width half-court   |

## Geometry

- Max content width: 1440px; gutters 20px mobile, 40px desktop.
- Corner language: 18–28px only on interactive/surface groupings; score fields are squared.
- Numerals use tabular figures with visible character separation.
- Product UI display text must not use condensed letterforms or negative
  tracking. Export-only `SINGLES` and `DOUBLES` mastheads may use deterministic
  horizontal scaling to reproduce the supplied condensed poster lettering.

## Typography

| Role            | Family           | Weight  | Size           | Line height | Use                                              |
| --------------- | ---------------- | ------- | -------------- | ----------- | ------------------------------------------------ |
| Product display | Archivo Black    | 400     | fluid 44–112px | 0.88–1.02   | app hero, scoreboard, and results                |
| UI/body         | Manrope          | 400–800 | 12–18px        | 1.4–1.7     | labels, controls, dates, and opponent copy       |
| Export headline | Anton            | 400     | measured       | 0.86–0.96   | Poster and Frame winner headlines                |
| Export winner   | Archivo Black    | 400     | measured       | 0.9–1       | Broad Quick Receipt winner copy                  |
| Export table    | Roboto Condensed | 700     | measured       | 1           | Recap standings                                  |
| Export score    | Alfa Slab One    | 400     | measured       | 0.9–1       | Quick Receipt score numerals and score separator |
| Export score    | Roboto Slab      | 900     | measured       | 0.9–1       | Quick Poster and Frame score numerals            |

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
| Mobile portrait  | 320–639px  | stacked flows and bounded bracket viewport   | 390×844      |
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
| ShareCard         | score, recap, stats, bracket             | Post, Story / Reel, or Full draw in the supplied poster identity             |
| StartMatchOverlay | idle, focused                            | centered lime action; scoring remains inert                                  |
| VictoryReview     | target, buzzer, golden, early, selected  | one mascot crown; score and context dominate                                 |
| DrawTools         | ready, reroll available, locked          | lives with Full draw heading; 48px controls                                  |
| ReplayDialog      | same draw, new draw, cancel              | no destructive default; roster choice is explicit                            |
| FormatChoice      | knockout, round robin, unavailable       | states match field size; exact match/player counts remain visible            |
| LeagueStandings   | provisional, qualified, complete         | semantic table; wins, points, differential, and deterministic rank           |
| RoundRobinRound   | waiting, available, complete             | two match nodes per round; one-column phone fallback                         |
| PlacementMatches  | unresolved, bronze-ready, final-ready    | third place precedes final; standings placeholders explain qualification     |
| ServeGuide        | opening, first, second, swapped          | one legal box and one solid player marker; never a live formation map        |
| BracketViewport   | fitted, readable, zoomed, panning        | fitted views are read-only below 100%; match controls activate at 100%+      |

## Motion

| Motion              | Purpose                          | Trigger               | Timing              | Reduced motion |
| ------------------- | -------------------------------- | --------------------- | ------------------- | -------------- |
| score digit flow    | preserve number location         | score/time update     | spring, about 320ms | immediate text |
| mascot arrival      | establish product identity       | home entry            | 720ms ease-out      | static mascot  |
| mascot blink        | give the mark restrained life    | idle                  | 100ms every 5.2s    | no blink       |
| selected choice     | preserve toggle context          | option change         | 240ms spring        | immediate fill |
| rating popup        | connect trigger and menu         | open/select           | 180ms ease-out      | immediate menu |
| bracket advancement | show dependency                  | result confirmation   | 420ms ease-out      | crossfade      |
| connector reveal    | show advancement path            | result confirmation   | 280ms ease-out      | immediate      |
| mascot arrival      | celebrate tournament champion    | results entry         | 700ms spring        | static mascot  |
| result confetti     | mark confirmed performance       | result review         | two bursts, 1.2s    | static scatter |
| suggestion reveal   | retain typing context            | input filtering       | 160ms ease-out      | immediate list |
| press response      | confirm touch                    | pointer/keyboard      | 90ms                | color only     |
| service-box pulse   | keep legal position glanceable   | legal serve change    | 1.8s soft pulse     | static fill    |
| bracket zoom        | move between overview and detail | pinch or zoom control | direct manipulation | immediate      |

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
- No generic app gradients, glassmorphism, WebGL, stock sports photos, radial light orbs, or dashboard tile grids. Canvas exports use the supplied cream, near-black, lime, condensed-type, and oversized-mascot identity.
- History reads as a courtside score ledger, not an admin dashboard.
- Result sharing is opt-in and generated locally; no automatic social prompts.
- Every share action opens the exact local PNG preview before native share or download.
- Share artwork may contain one dominant crowned mascot plus one small mascot-and-wordmark footer lockup; no other crown decoration is permitted.
- Share generation must fail clearly rather than silently omit the mascot.
- Draw editing and sharing controls stay with the Full draw they affect.
- Structural draw edits must visually separate safe renames from destructive reseeding. A safe rename changes the stable player record only; it never submits a result correction or reopens downstream matches.
- Late-entry repair must name the protected route, show its added matches and timing impact, and never hide the continue-unchanged action.
- Result tables are read-only. Corrections and stable-identity renames live in bracket nodes.
- Ranked and Random draw copy must state whether ratings affect placement. Random draws may be rerolled only before play begins.
- Round robin + finals is available at four through six players and must state
  the exact `8/12/17 matches` and `4/4–5/5–6 per player` cost. Adding a seventh
  player returns the choice to Fast knockout with a polite status message.
- Five-player rounds name the resting player without rendering a fake match.
- Timed caps below eight minutes receive a prominent advisory near the build
  summary. Untimed setup never renders duration-risk messaging.
- The round-robin surface reuses the run of show and match-card anatomy but
  never imitates a connected elimination tree. The standings table and 3–5
  rounds carry the hierarchy; placement matches remain visible and unresolved
  until every preliminary result exists.
- Round-robin standings use non-color rank/status text and remain horizontally
  contained at 390px. Schedule cards form two columns at tablet/desktop sizes
  and one column on phones.
- Round-robin completed sharing offers Champion card and Player stats only.
  Full bracket and in-progress tournament-image actions remain knockout-only.

## Feature 014 visual extension

- Mode: reference-derived product.
- Identity anchor: the accepted setup, run-of-show, match-node, results, and
  history evidence already listed in this contract.
- New surface: a near-black editorial standings table above paired match nodes;
  lime remains reserved for the one recommended court action.
- Motion required: no new ornamental motion. Existing choice, match-state, and
  reduced-motion behavior applies.
- Assets: existing local fonts, Lucide icons, and mascot only.
- Target viewports: 390×844, 844×390, 820×1180, 1180×820, and 1440×1000.

## Feature 015 serve-tracker extension

- The serving guide is a short court strip rather than a third score panel. Its
  horizontal court includes the net, both kitchens, and four service boxes,
  highlighting only the active legal box.
- One solid lime head-and-torso marker identifies the server without implying
  live doubles formation. It sits outside the active baseline without a halo.
- The active box softly pulses; reduced-motion renders a static fill.
- Mobile score zones keep the team name, rally instruction, large centered
  numeral, and two 48px controls vertically separated at 320–390px widths.
- A side out moves the highlighted service box and marker to the opposing court
  end. `Swap sides` reverses screen orientation without changing identity,
  scores, service history, or tournament results.

## Feature 016 bracket viewport extension

- The Full draw remains semantic DOM/CSS; no bitmap canvas or WebGL replaces
  match cards, connectors, labels, focus order, or node actions.
- One-finger touch uses the browser's native horizontal overflow and momentum;
  vertical touch movement continues to the page because the viewport has no
  vertical scroll range. A dedicated two-touch handler owns bounded pinch.
  Mouse/pen drag and modifier-wheel remain available, including gestures that
  begin over a match action. A tap remains a tap; only movement suppresses its
  action. Zoom controls provide equivalent single-pointer and keyboard access.
- Fit shows the complete draw at the largest scale that fits the viewport. It
  remains an inspection state because scaled controls are below the 48px touch
  contract. The first tap centers that match at 100%; its normal-size Play/Edit
  control then performs the action. Reset and section navigation remain 48px
  alternatives.
- The viewport clamps between the computed fit scale and 200%. Reset returns to
  100% and centers the championship match. Reduced motion changes immediately.
- Left, championship, and right navigation remain available at every scale.
- Continuous pinch updates are coalesced into animation frames without
  cancelling an already queued frame; scale and anchored scroll paint together.
- Target viewports: 390×844, 844×390, 820×1180, 1180×820, and
  1440×1000.

## Reference-locked share repair

- Mode: audit and repair.
- Story authority: the supplied cream paper posters with oversized black
  `SINGLES` or `DOUBLES`, one crowned mascot, and an acid-lime record table.
- Borrow: date-led Receipts heading, clipped display scale, thin black rules,
  strong table rows, and restrained footer branding.
- Do not borrow: tournament/champion language, permanent standings claims, or
  unlabelled mixed-rule differential. One dominant mascot plus the small footer
  lockup is the maximum on a card.
- The Match Ledger remains near-black and editorial. Selection adds checkboxes
  and one bounded action row rather than turning history into a dashboard grid.
- Post and Story pages use the same content order and retain twelve readable
  player rows before pagination. The table renders Player, W-L, and conditional
  +/- only; removing GP preserves the reference density.
- Continuation pages repeat date, format, page count, rules notice, and Top Pair
  so every shared image remains understandable on its own.
- Motion required: no. Selection, tab, format, and page changes are immediate;
  existing pressed/focus feedback remains.
- `SINGLES` uses the supplied right-side mascot punctuation outside the final
  letter. `DOUBLES` uses the contained owner-supplied word with the crowned
  mascot centered inside the O. Both mastheads are stable template pixels, not
  retyped approximations. Every extracted masthead keeps at least 8px of
  transparent source padding, and no detached dark component may appear outside
  the intended title band.
- Every footer draws the same checked-in 640×144 transparent mascot + Pickle
  King wordmark asset at its fixed 4.444:1 aspect ratio. Color variants may
  recolor only the wordmark pixels; rebuilding the lockup from runtime text,
  changing the mascot-to-word ratio, or using a bare wordmark is prohibited.
- Individual Quick Match styles are Poster (default), Frame, and Receipt. Only
  the selected Canvas is generated; alternatives are lazy.
- Tournament Champion, Stats, and Full Bracket flows remain, but their legacy
  arena styling is replaced atomically with this poster identity.
- Assets: six deterministic Quick Match templates plus twelve recap templates:
  four regular, four dense for 7–8 rows, and four compact for 9–12 rows,
  derived from the five user-authorized reference rasters; one deterministic
  640×144 brand lockup derived from authorized footer pixels and the existing
  crowned mark; and local Anton, Manrope, Roboto Condensed, and Roboto Slab
  fonts.
  Image generation is not needed because direct reference pixels preserve the
  shaded artwork more faithfully and all variable text remains deterministic.
- Font readiness is a hard export boundary. The Canvas builder verifies every
  required face and rejects preview generation with a clear error instead of
  silently substituting browser fallback glyphs.
- Quick Match headings use format on line one and the local date on line two.
  A real tournament stage may replace the second-line date prefix, but Quick
  Matches never synthesize `FINAL`. Export art never renders `FIRST TO`, target,
  finish reason, or other redundant rules metadata.
- Target viewports: 390×844, 844×390, 820×1180, 1180×820, and 1440×1000.

## Authorship Decisions

| Decision                   | Product-specific reason                                             | Visible result                                                           |
| -------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Legal-position mini-court  | Players forget a serving side, not a generic score statistic        | Horizontal full-court diagram with one highlighted box and server marker |
| Rally-winner score zones   | Side-out scoring makes receiver wins meaningful without a point     | Large targets communicate rally outcome rather than blind increment      |
| Stacking-safe wording      | Physical formations vary while rules position only active players   | Guide states the legal box without claiming a live player map            |
| Read-only bracket overview | A fully fitted draw makes embedded controls too small to tap safely | Overview below 100%; readable interactive cards at 100% and above        |
| Selected-match receipt     | Informal play needs ceremony without pretending to be a tournament  | Cream poster, player records, and explicit mixed-rules disclosure        |
| Format-separated exports   | Singles and partner-influenced Doubles are not one fair leaderboard | Independent Singles/Doubles tabs and PNG page sets                       |
| Twelve-row receipt pages   | A normal open-play group should fit on one image                    | Strict twelve-row chunks begin a continuation only with player thirteen  |
| Share-style choice         | Players want Strava-like control without rebuilding the result      | Three named treatments with Poster selected by default                   |

## Share Export Geometry

- Post exports: 1080×1350 with essential content inside x=54…1026 and y=54…1296.
- Story / Reel exports: 1080×1920 with essential content inside x=72…1008 and y=240…1640.
- Story recap date baseline is 134±6px with its lime rule at 164±6px. Pages
  with 7–8 rows use the dense composition; pages with 9–12 rows use the
  compact composition. Contained mastheads stay inside x=64…1016. Compact
  Story rules begin at y=870 with a row-count-aware 60–72px pitch and 44px
  row type; compact Post rules begin at y=600 with a 45–60px pitch and 32px
  row type. Both formats paginate only at player thirteen,
  and every continuation keeps the same twelve-slot compact composition.
- `PLAYER STANDINGS` and `ROTATING PARTNERS` are dynamic Manrope 700 text,
  centered between two broken rules. Table headers and rows use Roboto
  Condensed 700; actual glyph bounds are vertically centered between rules.
- Quick Poster keeps equal score slots, centers the opponent beneath the lower
  score, fits `THAT'S GAME.` inside the lime slab, and centers the footer at the
  bottom. Frame keeps at least 72px between winner and score. Receipt keeps at
  least 72px between winner and score, clears the mascot circle, and keeps the
  score inside x=1008.
- Quick Receipt Story uses the normalized 1080×1920 authority geometry below.
  The winner, score, and opponent fixture text must be measured independently
  from the static artwork; a full-image difference board cannot close these
  regions by itself.

| Receipt region | Authority ink bounds (x, y, w, h) | Allowed geometry drift | Type contract                        |
| -------------- | --------------------------------- | ---------------------- | ------------------------------------ |
| winner         | 549, 1148, 465, 247               | ±12px per edge         | Archivo Black 400, right aligned     |
| score          | 162, 1458, 848, 251               | ±12px per edge         | Alfa Slab One 400, measured fit      |
| opponent       | 787, 1732, 211, 27                | ±8px per edge          | Manrope 400, right aligned           |
| footer lockup  | centered at x=540, y=1844         | ±12px center/baseline  | mascot plus tracked Manrope wordmark |

- Quick Receipt heading keeps format and date on separate right-aligned lines.
  `SINGLES` is at least 32px, the date is at least 24px, and both use explicit
  positive tracking. The footer wordmark is at least 27px with 4px tracking;
  compressed Anton footer text is prohibited.
- Quick Poster and Frame use the same region-level measurement discipline as
  Receipt. Poster preserves the vertical score slab and independent stacked
  winner score, separator, loser score, opponent, and `THAT'S GAME.` regions.
  Frame preserves the lower-left winner/result block. Both keep semantic
  two-line format/date copy, never invent `FINAL` or `FIRST TO`, and use the
  requested centered mascot + tracked wordmark footer instead of copying the
  source's text-only footer placement.
- Quick Feed exports use `Darien 12–10 Jean-Paul` as the finite two-digit
  regression fixture. Poster keeps both score values and the separator inside
  the lime slab; Frame keeps the complete result left of the mascot; Receipt
  keeps the complete winner and score on cream. Dark exports draw the canonical
  chalk lockup asset directly—Canvas filter-based recoloring is prohibited.
- Quick template artwork owns a fixed non-text lane: Poster and Frame mascot
  pixels begin at x=510 or later, while Receipt artwork ends at x=700 or
  earlier. Dynamic text never moves the artwork. The exact `Jean-Paul` winner
  fixture must remain inside these winner regions in both formats: Poster Post
  x=50…510/y=120…470 and Story x=50…510/y=195…650; Frame Post
  x=80…560/y=540…930 and Story x=80…560/y=950…1410; Receipt Post
  x=600…1040/y=680…930 and Story x=540…1040/y=1110…1400.
- The browser visual gate records the actual Canvas `fillText` values: a valid
  result such as `12–10` must never be shortened to an ellipsis. Winner-region
  assertions use a same-data control render so only winner pixels contribute
  to the measured bounds.
- Poster Story keeps the winner block inside x=68…423, leaving at least 24px
  of clear space before the mascot. Frame Story preserves a minimum 16px gap
  between `MAYA`, `WINS`, and the score; its winner lines advance by 218px
  rather than overlapping glyph boxes.

| Quick Story region | Authority ink bounds (x, y, w, h) | Allowed drift | Required treatment           |
| ------------------ | --------------------------------- | ------------- | ---------------------------- |
| Poster winner      | 71, 202, 439, 408                 | ±14px/edge    | Anton 400 cream winner stack |
| Poster score `4`   | 108, 715, 265, 330                | ±14px/edge    | Anton 400 black numeral      |
| Poster separator   | 180, 1097, 120, 53                | ±14px/edge    | Anton 400 black separator    |
| Poster score `2`   | 109, 1198, 250, 350               | ±14px/edge    | Anton 400 black numeral      |
| Poster opponent    | 105, 1579, 266, 35                | ±14px/edge    | Manrope 400 centered copy    |
| Frame winner       | 122, 1012, 423, 366               | ±14px/edge    | Anton 400 cream winner stack |
| Frame score        | 134, 1421, 769, 231               | ±14px/edge    | Alfa Slab One 400 at 1.15×   |
| Frame opponent     | 132, 1688, 242, 29                | ±14px/edge    | Manrope 400 opponent copy    |

- Recap tables are measured as independent header, player-row, Top Pair/note,
  date, and footer bands. The supplied sample page typography is the primary
  calibration fixture; twelve-player capacity, deterministic order, pagination,
  and mixed-rule behavior remain immutable. Exact sample Story text bands are:
  Singles `1142–1174`, `1224–1263`, `1306–1345`, `1387–1425`,
  `1466–1505`, `1547–1587`; Doubles `1048–1079`, `1126–1166`,
  `1208–1248`, `1289–1329`, `1370–1411`, `1451–1492`, `1532–1573`,
  and Top Pair `1643–1669`. Nine through twelve rows use the compact branch.
  Its finite profile is keyed only by format and visible row count: Story uses
  44px/700 type on a 72/72/65/60px pitch for 9/10/11/12 rows; Post uses
  32px/700 type on a 60/54/49/45px pitch. Every continuation keeps the fixed
  twelve-slot composition.
- Recap Story dates use format-specific Manrope 800 calibration: Singles 36px
  with 7px tracking and Doubles 30px with 6px tracking. Tables use Roboto
  Condensed 700 at approximately 34px headers, 48–54px names, and 48–52px
  records; columns start near x=142 with record right x=650 and differential
  right x=902. Sample row rhythm is `81±4px`; dense pages compress gaps,
  not glyphs. Visible row-ink-to-rule gaps target `21±3px`. Top Pair uses a
  fitted 34px starting size at baseline 1669. The canonical recap footer is
  the Singles authority's centered mascot + tracked Manrope 800 wordmark:
  approximately 95px mark, 44px type, 4px tracking, and 398×95px overall.
- Brackets have dedicated 1600×1200 Full draw, 1080×1350 Post, and 1080×1920 Story / Reel geometry. Portrait draws use mirrored horizontal branches: opening matches occupy the outside columns, each dependent match moves inward and is vertically centered between its two sources, and only the two semifinal branches converge downward into the centered final. Each dependency group owns one private merge rail; unrelated connector groups may not cross, overlap, share a rail, or enter another card.
- Bracket previews open fitted. Expand creates an internally scrolling inspection surface with overscroll containment.
- Native Web Share completion reads `Done`; only an explicit browser download reads `Saved`.
- Confirmed Quick Matches return directly to setup after one history write. The completed-score screen is not a second step.
- New player names are capped at 16 trimmed characters. Persisted names up to
  40 characters continue to load and use measured fitting/ellipsizing; saved
  history is never rewritten.
- Decorative fragments stay in the outer 14% and never intersect text, scores, medals, or the mascot.
- Preview images use containment; no ancestor may crop the generated PNG.

## Acceptance criteria

- Touch targets are at least 48px and status is never color-only.
- Desktop, both tablet orientations, phone portrait, and phone landscape are
  verified.
- Live scoring stays operable with one hand and without fine pointer control.
- Reduced motion, keyboard focus, visible errors, and semantic announcements pass.
