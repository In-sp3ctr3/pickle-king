# Frontend Design QA

Pipeline version: 2
Status: passed
Last updated: 2026-08-20

## Environment

- Commit/source state: v1.9.0-alpha.3 native iPad bracket scrolling repair
- Browser: Playwright Chromium 1.62.1
- Base URL: development harness on localhost; offline workflow repeated against
  the production Vinext server at http://127.0.0.1:3020
- DPR: Playwright default at 1440×1000 and 390×844
- Stable-data/animation setup: distinct fixed ratings, cleared localStorage,
  blurred focus before capture, disabled screenshot animations, and isolated
  reduced-motion checks
- Responsive verification: 1180×820 iPad landscape, 820×1180 iPad portrait,
  768×1024 and 1024×768 iPad, 390×844 and 844×390 phone, and 1440×900
  desktop

## Evidence

| Route/state                     | Viewport | Source capture                                                            | Render capture                                                             | Combined comparison                                                           | Interaction run | Axe result |
| ------------------------------- | -------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | --------------- | ---------- |
| home                            | desktop  | docs/frontend/evidence/home-desktop-source.png                            | test-results/frontend-captures/home-desktop.png                            | test-results/frontend-comparisons/home-desktop.png                            | passed          | passed     |
| home                            | mobile   | docs/frontend/evidence/home-mobile-source.png                             | test-results/frontend-captures/home-mobile.png                             | test-results/frontend-comparisons/home-mobile.png                             | passed          | passed     |
| home-completed                  | desktop  | docs/frontend/evidence/home-completed-desktop-source.png                  | test-results/frontend-captures/home-completed-desktop.png                  | test-results/frontend-comparisons/home-completed-desktop.png                  | passed          | passed     |
| home-completed                  | mobile   | docs/frontend/evidence/home-completed-mobile-source.png                   | test-results/frontend-captures/home-completed-mobile.png                   | test-results/frontend-comparisons/home-completed-mobile.png                   | passed          | passed     |
| setup                           | desktop  | docs/frontend/evidence/setup-desktop-source.png                           | test-results/frontend-captures/setup-desktop.png                           | test-results/frontend-comparisons/setup-desktop.png                           | passed          | passed     |
| setup                           | mobile   | docs/frontend/evidence/setup-mobile-source.png                            | test-results/frontend-captures/setup-mobile.png                            | test-results/frontend-comparisons/setup-mobile.png                            | passed          | passed     |
| bracket                         | desktop  | docs/frontend/evidence/bracket-desktop-source.png                         | test-results/frontend-captures/bracket-desktop.png                         | test-results/frontend-comparisons/bracket-desktop.png                         | passed          | passed     |
| bracket                         | mobile   | docs/frontend/evidence/bracket-mobile-source.png                          | test-results/frontend-captures/bracket-mobile.png                          | test-results/frontend-comparisons/bracket-mobile.png                          | passed          | passed     |
| bracket-completed               | desktop  | docs/frontend/evidence/bracket-completed-desktop-source.png               | test-results/frontend-captures/bracket-completed-desktop.png               | test-results/frontend-comparisons/bracket-completed-desktop.png               | passed          | passed     |
| bracket-completed               | mobile   | docs/frontend/evidence/bracket-completed-mobile-source.png                | test-results/frontend-captures/bracket-completed-mobile.png                | test-results/frontend-comparisons/bracket-completed-mobile.png                | passed          | passed     |
| quick-setup                     | desktop  | docs/frontend/evidence/quick-setup-desktop-source.png                     | test-results/frontend-captures/quick-setup-desktop.png                     | test-results/frontend-comparisons/quick-setup-desktop.png                     | passed          | passed     |
| quick-setup                     | mobile   | docs/frontend/evidence/quick-setup-mobile-source.png                      | test-results/frontend-captures/quick-setup-mobile.png                      | test-results/frontend-comparisons/quick-setup-mobile.png                      | passed          | passed     |
| quick-idle                      | desktop  | docs/frontend/evidence/quick-idle-desktop-source.png                      | test-results/frontend-captures/quick-idle-desktop.png                      | test-results/frontend-comparisons/quick-idle-desktop.png                      | passed          | passed     |
| quick-idle                      | mobile   | docs/frontend/evidence/quick-idle-mobile-source.png                       | test-results/frontend-captures/quick-idle-mobile.png                       | test-results/frontend-comparisons/quick-idle-mobile.png                       | passed          | passed     |
| quick-live                      | desktop  | docs/frontend/evidence/quick-live-desktop-source.png                      | test-results/frontend-captures/quick-live-desktop.png                      | test-results/frontend-comparisons/quick-live-desktop.png                      | passed          | passed     |
| quick-live                      | mobile   | docs/frontend/evidence/quick-live-mobile-source.png                       | test-results/frontend-captures/quick-live-mobile.png                       | test-results/frontend-comparisons/quick-live-mobile.png                       | passed          | passed     |
| quick-result                    | desktop  | docs/frontend/evidence/quick-result-desktop-source.png                    | test-results/frontend-captures/quick-result-desktop.png                    | test-results/frontend-comparisons/quick-result-desktop.png                    | passed          | passed     |
| quick-result                    | mobile   | docs/frontend/evidence/quick-result-mobile-source.png                     | test-results/frontend-captures/quick-result-mobile.png                     | test-results/frontend-comparisons/quick-result-mobile.png                     | passed          | passed     |
| results                         | desktop  | docs/frontend/evidence/results-desktop-source.png                         | test-results/frontend-captures/results-desktop.png                         | test-results/frontend-comparisons/results-desktop.png                         | passed          | passed     |
| results                         | mobile   | docs/frontend/evidence/results-mobile-source.png                          | test-results/frontend-captures/results-mobile.png                          | test-results/frontend-comparisons/results-mobile.png                          | passed          | passed     |
| history                         | desktop  | docs/frontend/evidence/history-desktop-source.png                         | test-results/frontend-captures/history-desktop.png                         | test-results/frontend-comparisons/history-desktop.png                         | passed          | passed     |
| history                         | mobile   | docs/frontend/evidence/history-mobile-source.png                          | test-results/frontend-captures/history-mobile.png                          | test-results/frontend-comparisons/history-mobile.png                          | passed          | passed     |
| history-populated               | desktop  | docs/frontend/evidence/history-populated-desktop-source.png               | test-results/frontend-captures/history-populated-desktop.png               | test-results/frontend-comparisons/history-populated-desktop.png               | passed          | passed     |
| history-populated               | mobile   | docs/frontend/evidence/history-populated-mobile-source.png                | test-results/frontend-captures/history-populated-mobile.png                | test-results/frontend-comparisons/history-populated-mobile.png                | passed          | passed     |
| history-results                 | desktop  | docs/frontend/evidence/history-results-desktop-source.png                 | test-results/frontend-captures/history-results-desktop.png                 | test-results/frontend-comparisons/history-results-desktop.png                 | passed          | passed     |
| history-results                 | mobile   | docs/frontend/evidence/history-results-mobile-source.png                  | test-results/frontend-captures/history-results-mobile.png                  | test-results/frontend-comparisons/history-results-mobile.png                  | passed          | passed     |
| round-robin-initial             | desktop  | docs/frontend/evidence/round-robin-initial-desktop-source.png             | test-results/frontend-captures/round-robin-initial-desktop.png             | test-results/frontend-comparisons/round-robin-initial-desktop.png             | passed          | passed     |
| round-robin-initial             | mobile   | docs/frontend/evidence/round-robin-initial-mobile-source.png              | test-results/frontend-captures/round-robin-initial-mobile.png              | test-results/frontend-comparisons/round-robin-initial-mobile.png              | passed          | passed     |
| round-robin-qualified           | desktop  | docs/frontend/evidence/round-robin-qualified-desktop-source.png           | test-results/frontend-captures/round-robin-qualified-desktop.png           | test-results/frontend-comparisons/round-robin-qualified-desktop.png           | passed          | passed     |
| round-robin-qualified           | mobile   | docs/frontend/evidence/round-robin-qualified-mobile-source.png            | test-results/frontend-captures/round-robin-qualified-mobile.png            | test-results/frontend-comparisons/round-robin-qualified-mobile.png            | passed          | passed     |
| round-robin-completed           | desktop  | docs/frontend/evidence/round-robin-completed-desktop-source.png           | test-results/frontend-captures/round-robin-completed-desktop.png           | test-results/frontend-comparisons/round-robin-completed-desktop.png           | passed          | passed     |
| round-robin-completed           | mobile   | docs/frontend/evidence/round-robin-completed-mobile-source.png            | test-results/frontend-captures/round-robin-completed-mobile.png            | test-results/frontend-comparisons/round-robin-completed-mobile.png            | passed          | passed     |
| round-robin-results             | desktop  | docs/frontend/evidence/round-robin-results-desktop-source.png             | test-results/frontend-captures/round-robin-results-desktop.png             | test-results/frontend-comparisons/round-robin-results-desktop.png             | passed          | passed     |
| round-robin-results             | mobile   | docs/frontend/evidence/round-robin-results-mobile-source.png              | test-results/frontend-captures/round-robin-results-mobile.png              | test-results/frontend-comparisons/round-robin-results-mobile.png              | passed          | passed     |
| round-robin-history-results     | desktop  | docs/frontend/evidence/round-robin-history-results-desktop-source.png     | test-results/frontend-captures/round-robin-history-results-desktop.png     | test-results/frontend-comparisons/round-robin-history-results-desktop.png     | passed          | passed     |
| round-robin-history-results     | mobile   | docs/frontend/evidence/round-robin-history-results-mobile-source.png      | test-results/frontend-captures/round-robin-history-results-mobile.png      | test-results/frontend-comparisons/round-robin-history-results-mobile.png      | passed          | passed     |
| round-robin-five-initial        | desktop  | docs/frontend/evidence/round-robin-five-initial-desktop-source.png        | test-results/frontend-captures/round-robin-five-initial-desktop.png        | test-results/frontend-comparisons/round-robin-five-initial-desktop.png        | passed          | passed     |
| round-robin-five-initial        | mobile   | docs/frontend/evidence/round-robin-five-initial-mobile-source.png         | test-results/frontend-captures/round-robin-five-initial-mobile.png         | test-results/frontend-comparisons/round-robin-five-initial-mobile.png         | passed          | passed     |
| round-robin-six-timed           | desktop  | docs/frontend/evidence/round-robin-six-timed-desktop-source.png           | test-results/frontend-captures/round-robin-six-timed-desktop.png           | test-results/frontend-comparisons/round-robin-six-timed-desktop.png           | passed          | passed     |
| round-robin-six-timed           | mobile   | docs/frontend/evidence/round-robin-six-timed-mobile-source.png            | test-results/frontend-captures/round-robin-six-timed-mobile.png            | test-results/frontend-comparisons/round-robin-six-timed-mobile.png            | passed          | passed     |
| round-robin-six-untimed         | desktop  | docs/frontend/evidence/round-robin-six-untimed-desktop-source.png         | test-results/frontend-captures/round-robin-six-untimed-desktop.png         | test-results/frontend-comparisons/round-robin-six-untimed-desktop.png         | passed          | passed     |
| round-robin-six-untimed         | mobile   | docs/frontend/evidence/round-robin-six-untimed-mobile-source.png          | test-results/frontend-captures/round-robin-six-untimed-mobile.png          | test-results/frontend-comparisons/round-robin-six-untimed-mobile.png          | passed          | passed     |
| round-robin-six-results         | desktop  | docs/frontend/evidence/round-robin-six-results-desktop-source.png         | test-results/frontend-captures/round-robin-six-results-desktop.png         | test-results/frontend-comparisons/round-robin-six-results-desktop.png         | passed          | passed     |
| round-robin-six-results         | mobile   | docs/frontend/evidence/round-robin-six-results-mobile-source.png          | test-results/frontend-captures/round-robin-six-results-mobile.png          | test-results/frontend-comparisons/round-robin-six-results-mobile.png          | passed          | passed     |
| round-robin-six-history-results | desktop  | docs/frontend/evidence/round-robin-six-history-results-desktop-source.png | test-results/frontend-captures/round-robin-six-history-results-desktop.png | test-results/frontend-comparisons/round-robin-six-history-results-desktop.png | passed          | passed     |
| round-robin-six-history-results | mobile   | docs/frontend/evidence/round-robin-six-history-results-mobile-source.png  | test-results/frontend-captures/round-robin-six-history-results-mobile.png  | test-results/frontend-comparisons/round-robin-six-history-results-mobile.png  | passed          | passed     |

## Iteration History

| Iteration | Region                  | Pixel signal                                          | Human finding                                                                          | Change                                                                                                        | Result |
| --------- | ----------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------ |
| 1         | Typography              | glyph crowding                                        | condensed display face joined double-digit scores                                      | introduced Archivo Black with positive score tracking                                                         | passed |
| 2         | Home hero               | concept rejection                                     | product-demo imagery kept replacing the requested identity                             | made the existing crowned mascot the sole visual with a restrained blink                                      | passed |
| 3         | Navigation              | misplaced controls                                    | corner navigation lacked a reliable bracket-to-setup path                              | added one solid centered island with explicit Back and Home                                                   | passed |
| 4         | Setup                   | control imbalance                                     | generic controls and uneven timing fields felt unfinished                              | added custom select, spring choices, field-local errors, and aligned rows                                     | passed |
| 5         | Bracket                 | node-model mismatch                                   | players and actions occupied separate nodes                                            | rebuilt each node as a wide two-contender match converging on a trophy final                                  | passed |
| 6         | Queue state             | scheduling ambiguity                                  | every dependency-ready match appeared ready                                            | reserved lime and `Next` for the one-court eligible match; marked the rest queued                             | passed |
| 7         | Responsive QA           | missing target screens                                | tablet and phone landscape behavior had not been proven                                | added executable layout tests for all three target viewports                                                  | passed |
| 8         | Bracket repair          | unclear six-player draw                               | `BYE` looked like an unregistered participant                                          | named automatic advances in setup/draw and removed the fake contender row                                     | passed |
| 9         | Result repair           | correction interruption                               | completed scores opened browser prompts                                                | added compact in-node score editing with explicit tied-result winner selection                                | passed |
| 10        | Score motion            | uncontrolled digit reel                               | rapid taps appeared to overshoot and subtraction spun forward                          | removed continuous cycling, restored delta direction, and bounded countdown digits                            | passed |
| 11        | Draw repair             | destructive ambiguity                                 | a forgotten entrant could not be added honestly after play                             | split safe name edits from a guarded full reseed                                                              | passed |
| 12        | Result moment           | weak share state                                      | final scores were difficult to screenshot or share                                     | made score/name/crown dominant and added local PNG sharing                                                    | passed |
| 13        | Session recall          | no durable visual record                              | Quick Matches disappeared after confirmation                                           | added a bounded courtside ledger with per-record sharing                                                      | passed |
| 14        | Name entry              | repeated typing                                       | recurring doubles players had to be entered every match                                | added an accessible custom remembered-name combobox                                                           | passed |
| 15        | Result review           | cramped celebration                                   | the winning score and product identity lacked presence                                 | expanded the review surface around one crowned mascot, dominant score, and context                            | passed |
| 16        | Share output            | generic exported identity                             | PNG exports used a generic crown instead of the product mark                           | made both async builders decode and draw the local mascot before export                                       | passed |
| 17        | Scorer fit              | clipped idle controls                                 | the footer start action fell below short landscape viewports                           | moved Start match into the score stage and fixed the scorer to `100dvh`                                       | passed |
| 18        | Draw utilities          | detached actions                                      | Edit draw and Share bracket competed with the page hero                                | grouped both actions beside Full draw with a narrow-screen stack                                              | passed |
| 19        | Mixed-skill draw        | opening-round humiliation                             | standard seeding was the only recreational option                                      | added explicit Competitive and Social draw choices                                                            | passed |
| 20        | Scorer controls         | ambiguous correction                                  | the floating minus control was missed on court                                         | retained court tap and added labeled add/undo controls                                                        | passed |
| 21        | Results                 | mutable summary                                       | correction actions made the final report feel unstable                                 | moved correction and rename to bracket nodes; kept results static                                             | passed |
| 22        | Tournament share        | one oversized story                                   | podium, standings, and draw compete at one aspect ratio                                | added focused recap, statistics, and full-bracket exports                                                     | passed |
| 23        | Result preview          | blind native sharing                                  | desktop users could not inspect or explicitly save the PNG                             | placed the exact generated image in review with separate Share and Download actions                           | passed |
| 24        | Share typography        | score collision                                       | a 4 to 11 score crowded its separator and hid player identity                          | split both scores and names into measured lanes using the supplied reference hierarchy                        | passed |
| 25        | Scorer idle             | oversized misplaced start                             | the Start surface read as a top card rather than an overlay                            | reduced it to a compact control centered over the viewport                                                    | passed |
| 26        | Bracket repair          | clipped names and oversized final                     | long opponents collided and the championship node wasted space                         | bounded every participant lane, separated the run-of-show names, and rebuilt a compact trophy final           | passed |
| 27        | Draw setup              | unclear seeded/social language                        | players could not predict how ratings affected placement                               | renamed the choices Ranked and Random, added plain-language copy, migration, and a pre-start reroll           | passed |
| 28        | Share identity          | generic glow and weak podium                          | exports did not carry the supplied reference's athletic hierarchy                      | added an original text-free arena and rebuilt feed, story, recap, stats, and bracket compositions             | passed |
| 29        | Share workflow          | cropped and blind output                              | users could not inspect the whole artifact or revisit completed results                | added contained previews, native share/download states, and read-only archived results                        | passed |
| 30        | Responsive input        | clipped steppers and undersized actions               | compact controls overlapped and missed the 48px contract                               | rebuilt number-control geometry and normalized setup, format, navigation, and bracket targets                 | passed |
| 31        | Adversarial QA          | transient long-name overflow and incomplete evidence  | async fallback and 16-player geometry were not proven                                  | contained the fallback, removed scale-shrunk hit targets, and added geometry plus current comparison evidence | passed |
| 32        | Small-field round robin | missing five/six-player and warning-state evidence    | the four-player screen contract did not prove longer fields or untimed warning absence | added dynamic schedules, rotating rests, five new route states, and responsive browser coverage               | passed |
| 33        | Full bracket viewport   | horizontal-only navigation and a top-aligned fit view | the complete draw could not be inspected at once and the fitted state was unclear      | added bounded native pan, pinch, wheel, keyboard zoom, centered Fit, and a visible read-only overview state   | passed |

The route-level source/render pairs remain regression baselines. Reference
fidelity is reviewed separately against both supplied victory cards. The cards
are authority for hierarchy, atmosphere, and score emphasis—not templates to
pixel-copy. Dynamic names, scores, statistics, and bracket geometry remain
code-rendered.

| Export comparison                 | Current artifact                                                             |
| --------------------------------- | ---------------------------------------------------------------------------- |
| Quick result · Feed               | `docs/frontend/evidence/share-comparisons/quick-feed.webp`                   |
| Quick result · Story              | `docs/frontend/evidence/share-comparisons/quick-story.webp`                  |
| Tournament recap · Feed           | `docs/frontend/evidence/share-comparisons/recap-feed.webp`                   |
| Tournament recap · Story          | `docs/frontend/evidence/share-comparisons/recap-story.webp`                  |
| Tournament statistics             | `docs/frontend/evidence/share-comparisons/stats-feed.webp`                   |
| Full bracket · 4 players          | `docs/frontend/evidence/share-comparisons/bracket-4.webp`                    |
| Full bracket · 8 players          | `docs/frontend/evidence/share-comparisons/bracket-8.webp`                    |
| Full bracket · 16 players         | `docs/frontend/evidence/share-comparisons/bracket-16.webp`                   |
| Quick result · source/render/diff | `docs/frontend/evidence/share-comparisons/quick-feed-source-render-diff.png` |

The supplied Jack 5–3 Post source was normalized to the product's exact
1080×1350 output before the source/render/diff sheet was created. Story,
tournament recap, statistics, and bracket exports have no matching supplied
source geometry; they are reference-derived extensions reviewed against the
documented safe-area, content, typography, and complete-draw invariants rather
than a misleading pixel-difference threshold.

The supplied source hashes are
`01d5f043e631ff2f7d7e5fe054ff9441582e3cba4483011331ad7ecad7f6d51f` and
`2503a333eac3bd1f2ccadff1a13173ca36be2d8ba840b7f86dc9c54a0187a458`.

## Findings

| ID     | Severity | Route/region      | Evidence                                                        | Contract/user impact                                                             | Owner    | Status |
| ------ | -------- | ----------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------- | -------- | ------ |
| DQA-01 | P1       | home/hero         | desktop, mobile, and responsive captures                        | rejected static artwork remained visible                                         | frontend | fixed  |
| DQA-02 | P1       | bracket/tree      | bracket desktop and mobile captures                             | node anatomy did not match a tournament bracket                                  | frontend | fixed  |
| DQA-03 | P1       | scorer/type       | quick-live desktop and mobile captures                          | condensed double digits reduced score legibility                                 | frontend | fixed  |
| DQA-04 | P2       | setup/controls    | setup desktop and mobile captures                               | native dropdown and vertical misalignment reduced polish                         | frontend | fixed  |
| DQA-05 | P2       | app/navigation    | setup, bracket, and results captures                            | back path was absent or duplicated outside navigation                            | frontend | fixed  |
| DQA-06 | P1       | bracket/byes      | six-player workflow and capture                                 | `BYE` appeared to be an unregistered player                                      | frontend | fixed  |
| DQA-07 | P1       | bracket/final     | desktop and mobile bracket captures                             | final label displaced its waiting state and faceoff                              | frontend | fixed  |
| DQA-08 | P2       | bracket/edit      | inline correction workflow and capture                          | completed scores could not be edited in their bracket node                       | frontend | fixed  |
| DQA-09 | P1       | scorer/motion     | burst-tap workflow and NumberFlow contract                      | visual reel could imply points beyond the locked result                          | frontend | fixed  |
| DQA-10 | P1       | bracket/edit      | completed and structural-edit workflows                         | late entrants had no fair, comprehensible recovery path                          | product  | fixed  |
| DQA-11 | P1       | bracket/edit      | iPad late-entry review and challenge lane                       | live insertion previously required a destructive full reset                      | product  | fixed  |
| DQA-14 | P1       | result/share      | desktop/mobile result and PNG evidence                          | victory review and exports lacked the approved branded hierarchy                 | frontend | fixed  |
| DQA-12 | P2       | history           | empty/populated ledger and iPad evidence                        | a social session had no device-local record                                      | frontend | fixed  |
| DQA-13 | P2       | quick/setup       | keyboard suggestion workflow                                    | recurring players required repeated name entry                                   | frontend | fixed  |
| DQA-15 | P1       | scorer/layout     | four target viewport assertions                                 | scorer controls could clip or require page scrolling                             | frontend | fixed  |
| DQA-16 | P2       | scorer/start      | idle scorer focus and inert-score workflow                      | users could tap inert scoring zones before discovering Start                     | frontend | fixed  |
| DQA-17 | P2       | bracket/tools     | bracket desktop and mobile captures                             | draw utilities appeared outside the Full draw context                            | frontend | fixed  |
| DQA-18 | P1       | scorer/controls   | iPad and phone workflow captures                                | point subtraction was not self-explanatory                                       | frontend | fixed  |
| DQA-19 | P1       | bracket/schedule  | four/six-player workflow captures                               | only the recommended opening match could start                                   | product  | fixed  |
| DQA-20 | P2       | results/share     | recap, stats, and result captures                               | final data lacked focused social formats                                         | frontend | fixed  |
| DQA-21 | P2       | bracket/edit      | inline stable-name workflow                                     | bracket nodes could correct scores but not player identity                       | product  | fixed  |
| DQA-22 | P1       | result/share      | desktop result and download workflow                            | native sharing offered no dependable desktop save path                           | frontend | fixed  |
| DQA-23 | P1       | result/type       | supplied reference and 4 to 11 export                           | combined score text allowed glyph and separator collisions                       | frontend | fixed  |
| DQA-24 | P2       | scorer/start      | four centered-overlay viewport assertions                       | the idle action was too large and not centered on the full screen                | frontend | fixed  |
| DQA-25 | P2       | scorer/clock      | untimed Quick Match workflow                                    | an empty timing concept remained visible as “Untimed”                            | frontend | fixed  |
| DQA-26 | P1       | result/share      | supplied portrait and landscape cards                           | winner scale, score hierarchy, and court atmosphere missed the authority         | frontend | fixed  |
| DQA-27 | P1       | share/QA          | identical source and render hashes                              | visual QA could report a false pass                                              | frontend | fixed  |
| DQA-28 | P1       | results/tablet    | missing 820×1180 and 1180×820 evidence                          | primary target layouts were unproven                                             | frontend | fixed  |
| DQA-29 | P2       | bracket/export    | cropped tree and weak champion state                            | completed draw was not legible or brag-worthy                                    | frontend | fixed  |
| DQA-30 | P2       | setup/rhythm      | section 02 collision and compressed suffixes                    | setup appeared unfinished                                                        | frontend | fixed  |
| DQA-31 | P2       | share/actions     | preview and action captures                                     | icon-only controls reduced Share and Download discoverability                    | frontend | fixed  |
| DQA-32 | P1       | bracket/names     | 40-character name containment matrix                            | opponent names collided in run-of-show and node layouts                          | frontend | fixed  |
| DQA-33 | P2       | bracket/final     | iPad final capture and 4/8/16 exports                           | final node spacing, status, and tools weakened championship hierarchy            | frontend | fixed  |
| DQA-34 | P2       | setup/draw        | migration, reroll, and responsive controls                      | draw intent and timing controls were unclear or clipped                          | product  | fixed  |
| DQA-35 | P1       | share/exports     | eight supplied-reference comparison sheets                      | recap, stats, and bracket artifacts lacked premium visual evidence               | frontend | fixed  |
| DQA-36 | P2       | history/results   | populated ledger and archived result captures                   | completed tournament results could not be reopened                               | product  | fixed  |
| DQA-37 | P2       | input/touch       | explicit component bounding-box assertions                      | multiple court-side actions were below the 48px touch-target contract            | frontend | fixed  |
| DQA-38 | P2       | share/fallback    | mocked Apple unsupported-share state                            | iPad copy promised a download action that was hidden                             | frontend | fixed  |
| DQA-39 | P1       | share/result      | delayed canvas and format-switch workflow                       | stale score artwork flashed before the requested image was ready                 | frontend | fixed  |
| DQA-40 | P1       | bracket/iPad      | 768/820 portrait and 1024/1180 landscape matrix                 | names wrapped mid-word and final scores drifted out of alignment                 | frontend | fixed  |
| DQA-41 | P1       | bracket/export    | 4/8-player Post, Story / Reel, and Full draw PNGs               | portrait sharing previously reused cropped landscape geometry                    | frontend | fixed  |
| DQA-42 | P2       | quick/result      | confirmation and history workflow                               | operators had to dismiss a redundant completed-score screen                      | product  | fixed  |
| DQA-43 | P2       | results/access    | bracket, home, and history reopen workflows                     | completed tournament results were difficult to revisit                           | product  | fixed  |
| DQA-44 | P1       | share/dialog      | 820×1180 bracket preview geometry                               | concatenated modifier classes collapsed the format selector and preview          | frontend | fixed  |
| DQA-45 | P2       | share/story       | Story safe-area geometry tests and current PNG                  | podium and result context entered destination chrome territory                   | frontend | fixed  |
| DQA-46 | P2       | bracket/portrait  | eight-player Story render                                       | the bronze node interrupted the lower finalist's progression connector           | frontend | fixed  |
| DQA-47 | P2       | share/evidence    | supplied Jack 5–3 source/render/diff sheet                      | prior evidence boards omitted an explicit pixel-difference panel                 | frontend | fixed  |
| DQA-48 | P1       | bracket/iPad      | 1180×820 completed bracket capture                              | final scores drifted and third place required a second scroll destination        | frontend | fixed  |
| DQA-49 | P2       | share/controls    | iPad share dialogs                                              | ratio-heavy labels stacked and obscured the simple format choice                 | frontend | fixed  |
| DQA-50 | P1       | bracket/portrait  | eight-player Post and Story renders                             | mirrored portrait trees were difficult to follow and used the wrong podium order | frontend | fixed  |
| DQA-51 | P2       | share/stats       | four-player Post and Story renders                              | oversized fact cards created weak hierarchy and empty interiors                  | frontend | fixed  |
| DQA-52 | P1       | bracket/iPad      | supplied next/final node captures                               | moved edit controls crowded participant rows and used unreadable state contrast  | frontend | fixed  |
| DQA-53 | P2       | setup/hierarchy   | 820×1180 setup capture                                          | Reset all was detached from the field it clears                                  | frontend | fixed  |
| DQA-54 | P1       | bracket/story     | 8/16-player Story / Reel renders                                | portrait rounds occupied the upper canvas and did not visibly converge as a tree | frontend | fixed  |
| DQA-55 | P1       | bracket/nodes     | current iPad next-match capture                                 | status and edit actions crowded the round label and misaligned the play control  | frontend | fixed  |
| DQA-56 | P2       | bracket/portrait  | current 16-player Post and Story renders                        | adjacent sibling pairs shared connector rails and obscured real dependencies     | frontend | fixed  |
| DQA-57 | P1       | bracket/edit      | completed-tournament rename workflow                            | a label-only edit resubmitted the result and reopened downstream matches         | product  | fixed  |
| DQA-58 | P2       | bracket/edit      | two-label validation regression                                 | a rejected second rename could leave the first label partially saved             | product  | fixed  |
| DQA-59 | P1       | bracket/nodes     | supplied ready/waiting iPad captures                            | one universal grid created uneven optical padding and an empty action lane       | frontend | fixed  |
| DQA-60 | P1       | bracket/portrait  | supplied eight-player Story render                              | shared central rails obscured dependencies and did not read as a tournament tree | frontend | fixed  |
| DQA-61 | P1       | results/names     | legal long-name mobile and desktop captures                     | champion and podium names must fit without mid-word wrapping or clipping         | frontend | fixed  |
| DQA-62 | P2       | round-robin       | five contracted desktop/mobile states                           | schedule, standings, placements, results, and archived results needed evidence   | frontend | fixed  |
| DQA-63 | P2       | phone/landscape   | 844×390 geometry assertion                                      | the primary start action needed to remain visible in the initial viewport        | frontend | fixed  |
| DQA-64 | P2       | results/history   | completed round-robin result captures                           | preliminary and placement history needed explicit groups                         | frontend | fixed  |
| DQA-65 | P2       | round-robin/setup | five/six-player desktop, mobile, tablet, and landscape captures | schedule density, rotating rests, and timed-only advisory needed explicit proof  | frontend | fixed  |
| DQA-66 | P1       | scorer/serve      | browser comments and 319px scorer capture                       | full-court cue, active box, server marker, score spacing, and cross-net side out | frontend | fixed  |
| DQA-67 | P2       | bracket/viewport  | phone, desktop, and both iPad orientations                      | horizontal scrolling alone prevented a complete-draw overview                    | frontend | fixed  |
| DQA-68 | P1       | home/version      | Axe contrast result at 390×844                                  | the discreet version label measured 3.48:1 instead of 4.5:1                      | frontend | fixed  |
| DQA-69 | P2       | bracket/overview  | fitted browser captures                                         | the fitted draw was top-aligned and its read-only state was not visible          | frontend | fixed  |
| DQA-70 | P2       | bracket/wheel     | Chromium console matrix                                         | React's passive wheel listener could not cancel browser zoom                     | frontend | fixed  |
| DQA-71 | P2       | bracket/centering | 390×844 geometry assertion                                      | the initial championship view was 20px off center on the mobile full-bleed lane  | frontend | fixed  |
| DQA-72 | P1       | bracket/iPad      | production field report and rapid-pointer regression            | repeated pointer moves starved the queued frame and card controls blocked drag   | frontend | fixed  |
| DQA-73 | P1       | bracket/overview  | 820×1180 and 1180×820 fitted interaction review                 | scaled 21–30px actions were unsafe and a tapped node did not center at 100%      | frontend | fixed  |
| DQA-74 | P1       | bracket/iPad      | three-size real-touch swipe matrix                              | contained vertical overscroll trapped page navigation over the bracket           | frontend | fixed  |
| DQA-75 | P2       | bracket/phone     | 390×844 final-node inspection                                   | mobile viewport padding shifted the selected match 20px left after inspect       | frontend | fixed  |
| DQA-76 | P1       | bracket/iPad      | field report, touch contract, and three-size browser review     | manual Pointer Event drag competed with WebKit scrolling and removed momentum    | frontend | fixed  |
| DQA-77 | P2       | recap/landscape   | 844×390 recap preview                                           | dialog chrome compressed the receipt below a useful inspection size              | frontend | fixed  |
| DQA-78 | P2       | recap/mixed rules | mixed-rule Doubles renderer review                              | Top Pair could displace the required point-differential omission notice          | frontend | fixed  |

## Feedback Loop

- Mechanism: screenshot-comments
- Availability/status: screenshot annotation was unavailable for this isolated
  viewport review; reviewer findings were recorded as DQA-67–75 and resolved.
- Annotation/comment evidence: `docs/frontend/evidence/bracket-zoom-prototype.md`
  and the DQA-67–75 finding rows above
- Resolution evidence: `tests/playwright/bracket-viewport.spec.ts`,
  `src/features/bracket/bracket-viewport.test.tsx`, and
  `output/playwright/design-review-alpha2-ipad-portrait-readable.png`

## Performance Evidence

| Surface                 | Numeric target    | Numeric result | Conditions                                                        | Evidence                                    | Result |
| ----------------------- | ----------------- | -------------- | ----------------------------------------------------------------- | ------------------------------------------- | ------ |
| Production PWA precache | ≤ 10 MB           | 8.82 MB        | Minified production build including the offline Chatterbox corpus | `npm run build` output                      | passed |
| Serve transition thread | ≤ 50 ms long task | 0 ms longest   | Chromium at 319×768 during one service transition                 | `tests/playwright/serve-tracker.spec.ts`    | passed |
| Bracket viewport thread | ≤ 50 ms long task | 0 ms longest   | Chromium at 390×844 across Fit, Reset, zoom, and keyboard input   | `tests/playwright/bracket-viewport.spec.ts` | passed |

## Anti-Template Review

| Surface       | Risk                        | Evidence                                | Finding                                                                                             | Resolution                                                                     | Result |
| ------------- | --------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------ |
| Live scorer   | Generic dashboard treatment | quick-live desktop/mobile captures      | Court-first split scoring remains the dominant composition                                          | Compact rule-specific serve strip uses the existing court identity             | passed |
| Serve guide   | Decorative sports diagram   | serve-tracker browser flow              | Every line, box, label, and marker communicates legal serve state                                   | Full court mirrors teams across the net and highlights one legal box           | passed |
| Full bracket  | Generic canvas/dashboard    | phone, desktop, and iPad captures       | Existing semantic match cards and connectors remain the product                                     | Native DOM/CSS transform and scrolling add no canvas or dependency             | passed |
| Session recap | Generic standings template  | supplied posters and five-size captures | Oversized format type, paper texture, acid-lime ledger, and one mascot retain the Receipts identity | Canvas renders only selected local match facts; no invented ceremony or AI art | passed |

## Authorship Evidence

| Decision              | Visible evidence                                                   | Product outcome                                                        |
| --------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| Legal service-box cue | One pulsing lime box on the full mini-court                        | The scorer sees where the next serve begins without calculating parity |
| Solid server marker   | Lime head-and-torso marker outside the active baseline             | The active server remains distinct without implying live formation     |
| Rally-winner scoring  | Two large court targets paired with whole-rally undo               | One tap records either a point or a service transition correctly       |
| Read-only overview    | Centered complete draw plus an explicit overview note              | Fit reveals the tournament shape without exposing undersized controls  |
| Receipts continuation | Date, format, page count, and full-format statistics on every page | Each shared page remains understandable after it leaves the app        |

## Harness Results

- [x] Route and interaction coverage passed.
- [x] Dead-control audit passed.
- [x] Raw-asset policy passed or exceptions are documented.
- [x] Desktop and mobile screenshots captured.
- [x] iPad portrait, iPad landscape, and phone landscape layouts passed.
- [x] Console checks passed.
- [x] Keyboard/focus checks passed.
- [x] Reduced-motion behavior passed.
- [x] Automated Axe checks passed.
- [x] Every P0/P1/P2 finding is closed.

## Final Decision

Reviewer: design_reviewer
Reviewer result: passed
Reviewer evidence: docs/frontend/reviews/design-review.md

Result: passed

Rationale: exact contained previews, native share/download fallbacks, measured
name fitting, 48px court-side controls, safe-area geometry, and the current
quick, recap, stats, and 4/8/16-player bracket artifacts were reviewed. The
latest iPad evidence proves state-specific ordinary nodes: compact equal-inset
startable cards and full-width waiting cards with no phantom action lane.
Current portrait exports use isolated mirrored dependency rails and one final
convergence, with intersection tests for 8- and 16-player draws. No P0/P1/P2
design finding remains open. The bracket viewport additionally passes bounded
20–200% zoom, exact phone and tablet championship centering, native non-passive
modifier-wheel handling, visible read-only Fit mode, keyboard operation, and a
0 ms longest-task interaction check. One-finger iPad pan now stays on native
horizontal overflow while vertical movement chains directly to the page; only
two-touch pinch uses the bounded custom gesture path.
