# Frontend Design QA

Pipeline version: 2
Status: passed
Last updated: 2026-08-26

## Environment

- Active feature: `specs/017-share-composer-tournament-identity/`.
- Direction, isolated prototype, production implementation, full-resolution
  artifact review, and browser evidence are approved.

- Commit/source state: v1.10.0-alpha.1 Premium Share Composer and tournament identity
- Browser: Playwright Chromium 1.62.1
- Base URL: production Vinext server at http://127.0.0.1:3043
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
| quick-result-saved              | desktop  | docs/frontend/evidence/quick-result-saved-desktop-source.png              | test-results/frontend-captures/quick-result-saved-desktop.png              | test-results/frontend-comparisons/quick-result-saved-desktop.png              | passed          | passed     |
| quick-result-saved              | mobile   | docs/frontend/evidence/quick-result-saved-mobile-source.png               | test-results/frontend-captures/quick-result-saved-mobile.png               | test-results/frontend-comparisons/quick-result-saved-mobile.png               | passed          | passed     |
| results                         | desktop  | docs/frontend/evidence/results-desktop-source.png                         | test-results/frontend-captures/results-desktop.png                         | test-results/frontend-comparisons/results-desktop.png                         | passed          | passed     |
| results                         | mobile   | docs/frontend/evidence/results-mobile-source.png                          | test-results/frontend-captures/results-mobile.png                          | test-results/frontend-comparisons/results-mobile.png                          | passed          | passed     |
| history                         | desktop  | docs/frontend/evidence/history-desktop-source.png                         | test-results/frontend-captures/history-desktop.png                         | test-results/frontend-comparisons/history-desktop.png                         | passed          | passed     |
| history                         | mobile   | docs/frontend/evidence/history-mobile-source.png                          | test-results/frontend-captures/history-mobile.png                          | test-results/frontend-comparisons/history-mobile.png                          | passed          | passed     |
| history-recap                   | desktop  | docs/frontend/evidence/history-recap-desktop-source.png                   | test-results/frontend-captures/history-recap-desktop.png                   | test-results/frontend-comparisons/history-recap-desktop.png                   | passed          | passed     |
| history-recap                   | mobile   | docs/frontend/evidence/history-recap-mobile-source.png                    | test-results/frontend-captures/history-recap-mobile.png                    | test-results/frontend-comparisons/history-recap-mobile.png                    | passed          | passed     |
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

| Iteration | Region                          | Pixel signal                                          | Human finding                                                                                             | Change                                                                                                        | Result     |
| --------- | ------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------- |
| 1         | Typography                      | glyph crowding                                        | condensed display face joined double-digit scores                                                         | introduced Archivo Black with positive score tracking                                                         | passed     |
| 2         | Home hero                       | concept rejection                                     | product-demo imagery kept replacing the requested identity                                                | made the existing crowned mascot the sole visual with a restrained blink                                      | passed     |
| 3         | Navigation                      | misplaced controls                                    | corner navigation lacked a reliable bracket-to-setup path                                                 | added one solid centered island with explicit Back and Home                                                   | passed     |
| 4         | Setup                           | control imbalance                                     | generic controls and uneven timing fields felt unfinished                                                 | added custom select, spring choices, field-local errors, and aligned rows                                     | passed     |
| 5         | Bracket                         | node-model mismatch                                   | players and actions occupied separate nodes                                                               | rebuilt each node as a wide two-contender match converging on a trophy final                                  | passed     |
| 6         | Queue state                     | scheduling ambiguity                                  | every dependency-ready match appeared ready                                                               | reserved lime and `Next` for the one-court eligible match; marked the rest queued                             | passed     |
| 7         | Responsive QA                   | missing target screens                                | tablet and phone landscape behavior had not been proven                                                   | added executable layout tests for all three target viewports                                                  | passed     |
| 8         | Bracket repair                  | unclear six-player draw                               | `BYE` looked like an unregistered participant                                                             | named automatic advances in setup/draw and removed the fake contender row                                     | passed     |
| 9         | Result repair                   | correction interruption                               | completed scores opened browser prompts                                                                   | added compact in-node score editing with explicit tied-result winner selection                                | passed     |
| 10        | Score motion                    | uncontrolled digit reel                               | rapid taps appeared to overshoot and subtraction spun forward                                             | removed continuous cycling, restored delta direction, and bounded countdown digits                            | passed     |
| 11        | Draw repair                     | destructive ambiguity                                 | a forgotten entrant could not be added honestly after play                                                | split safe name edits from a guarded full reseed                                                              | passed     |
| 12        | Result moment                   | weak share state                                      | final scores were difficult to screenshot or share                                                        | made score/name/crown dominant and added local PNG sharing                                                    | passed     |
| 13        | Session recall                  | no durable visual record                              | Quick Matches disappeared after confirmation                                                              | added a bounded courtside ledger with per-record sharing                                                      | passed     |
| 14        | Name entry                      | repeated typing                                       | recurring doubles players had to be entered every match                                                   | added an accessible custom remembered-name combobox                                                           | passed     |
| 15        | Result review                   | cramped celebration                                   | the winning score and product identity lacked presence                                                    | expanded the review surface around one crowned mascot, dominant score, and context                            | passed     |
| 16        | Share output                    | generic exported identity                             | PNG exports used a generic crown instead of the product mark                                              | made both async builders decode and draw the local mascot before export                                       | passed     |
| 17        | Scorer fit                      | clipped idle controls                                 | the footer start action fell below short landscape viewports                                              | moved Start match into the score stage and fixed the scorer to `100dvh`                                       | passed     |
| 18        | Draw utilities                  | detached actions                                      | Edit draw and Share bracket competed with the page hero                                                   | grouped both actions beside Full draw with a narrow-screen stack                                              | passed     |
| 19        | Mixed-skill draw                | opening-round humiliation                             | standard seeding was the only recreational option                                                         | added explicit Competitive and Social draw choices                                                            | passed     |
| 20        | Scorer controls                 | ambiguous correction                                  | the floating minus control was missed on court                                                            | retained court tap and added labeled add/undo controls                                                        | passed     |
| 21        | Results                         | mutable summary                                       | correction actions made the final report feel unstable                                                    | moved correction and rename to bracket nodes; kept results static                                             | passed     |
| 22        | Tournament share                | one oversized story                                   | podium, standings, and draw compete at one aspect ratio                                                   | added focused recap, statistics, and full-bracket exports                                                     | passed     |
| 23        | Result preview                  | blind native sharing                                  | desktop users could not inspect or explicitly save the PNG                                                | placed the exact generated image in review with separate Share and Download actions                           | passed     |
| 24        | Share typography                | score collision                                       | a 4 to 11 score crowded its separator and hid player identity                                             | split both scores and names into measured lanes using the supplied reference hierarchy                        | passed     |
| 25        | Scorer idle                     | oversized misplaced start                             | the Start surface read as a top card rather than an overlay                                               | reduced it to a compact control centered over the viewport                                                    | passed     |
| 26        | Bracket repair                  | clipped names and oversized final                     | long opponents collided and the championship node wasted space                                            | bounded every participant lane, separated the run-of-show names, and rebuilt a compact trophy final           | passed     |
| 27        | Draw setup                      | unclear seeded/social language                        | players could not predict how ratings affected placement                                                  | renamed the choices Ranked and Random, added plain-language copy, migration, and a pre-start reroll           | passed     |
| 28        | Share identity                  | generic glow and weak podium                          | exports did not carry the supplied reference's athletic hierarchy                                         | added an original text-free arena and rebuilt feed, story, recap, stats, and bracket compositions             | passed     |
| 29        | Share workflow                  | cropped and blind output                              | users could not inspect the whole artifact or revisit completed results                                   | added contained previews, native share/download states, and read-only archived results                        | passed     |
| 30        | Responsive input                | clipped steppers and undersized actions               | compact controls overlapped and missed the 48px contract                                                  | rebuilt number-control geometry and normalized setup, format, navigation, and bracket targets                 | passed     |
| 31        | Adversarial QA                  | transient long-name overflow and incomplete evidence  | async fallback and 16-player geometry were not proven                                                     | contained the fallback, removed scale-shrunk hit targets, and added geometry plus current comparison evidence | passed     |
| 32        | Small-field round robin         | missing five/six-player and warning-state evidence    | the four-player screen contract did not prove longer fields or untimed warning absence                    | added dynamic schedules, rotating rests, five new route states, and responsive browser coverage               | passed     |
| 33        | Full bracket viewport           | horizontal-only navigation and a top-aligned fit view | the complete draw could not be inspected at once and the fitted state was unclear                         | added bounded native pan, pinch, wheel, keyboard zoom, centered Fit, and a visible read-only overview state   | passed     |
| 34        | Share identity repair           | five supplied poster comparisons                      | recap density, Quick Match choices, and tournament exports diverged from the references                   | rebuilt the Canvas layouts around cream, near-black, lime, condensed type, and the crowned mascot             | superseded |
| 35        | Reference lock repair           | four annotated source/render boards                   | the hand-drawn Canvas approximation still used wrong fonts, spacing, mascot crops, and invented metadata  | used cleaned reference-derived templates plus measured dynamic text and hard font readiness                   | passed     |
| 36        | Remaining reference calibration | four supplied source/render/diff boards               | Receipt-level region checks had not yet been applied to Poster, Frame, Singles recap, and Doubles recap   | locked each dynamic region to measured Story geometry while preserving eight-row and long-name behavior       | passed     |
| 37        | Lockup and dense recap repair   | fresh full-resolution Quick and two-page recap PNGs   | footer ratios varied, Quick winner copy collided, and the eight-row table rules crossed the following row | saved one canonical lockup, cleared the Quick collisions, and added one measured 7–8-row Story composition    | passed     |
| 38        | Twelve-row and name-fit repair  | approved 8/12/13-player and 16-character export sets  | recap pagination began too early and character-count wrapping could not protect the three Quick layouts   | added compact twelve-row compositions, measured glyph centering, and grapheme-safe two-line winner fitting    | passed     |
| 39        | Doubles masthead crop repair    | regular/dense Post and Story pixel-component scans    | the source crop had already removed the final S edge and left detached letter fragments outside the title | replaced it with the contained owner-supplied source and added internal-padding plus fragment guards          | passed     |

The route-level source/render pairs remain regression baselines. The five
supplied posters are the visual authority for export composition; names,
scores, statistics, pagination, and bracket geometry remain deterministic
Canvas data rather than baked text.

| Export comparison       | Current source/render/diff board                                            |
| ----------------------- | --------------------------------------------------------------------------- |
| Session Recap · Singles | `docs/frontend/evidence/share-comparisons/session-recap-singles-story.webp` |
| Session Recap · Doubles | `docs/frontend/evidence/share-comparisons/session-recap-doubles-story.webp` |
| Quick result · Poster   | `docs/frontend/evidence/share-comparisons/quick-poster-story.webp`          |
| Quick result · Frame    | `docs/frontend/evidence/share-comparisons/quick-frame-story.webp`           |
| Quick result · Receipt  | `docs/frontend/evidence/share-comparisons/quick-receipt-story.webp`         |

The reference-derived states below were independently reviewed at full
resolution, then locked by exact hash as measured regression targets. They do
not replace the five supplied authorities above.

| Derived comparison                         | Locked target/render/diff board                                               |
| ------------------------------------------ | ----------------------------------------------------------------------------- |
| Recap · regular Doubles · Post             | `docs/frontend/evidence/share-comparisons/recap-doubles-regular-post.webp`    |
| Recap · regular Doubles · Story            | `docs/frontend/evidence/share-comparisons/recap-doubles-regular-story.webp`   |
| Recap · 8 players · Post                   | `docs/frontend/evidence/share-comparisons/recap-doubles-8-post.webp`          |
| Recap · 8 players · Story                  | `docs/frontend/evidence/share-comparisons/recap-doubles-8-story.webp`         |
| Recap · 12 players · Post                  | `docs/frontend/evidence/share-comparisons/recap-doubles-12-post.webp`         |
| Recap · 12 players · Story                 | `docs/frontend/evidence/share-comparisons/recap-doubles-12-story.webp`        |
| Recap · 13 players · Story page 1          | `docs/frontend/evidence/share-comparisons/recap-doubles-13-page-1-story.webp` |
| Recap · 13 players · Story page 2          | `docs/frontend/evidence/share-comparisons/recap-doubles-13-page-2-story.webp` |
| Quick · `Jean-Baptiste M.` · Poster Story  | `docs/frontend/evidence/share-comparisons/quick-long-name-poster-story.webp`  |
| Quick · `Jean-Baptiste M.` · Frame Story   | `docs/frontend/evidence/share-comparisons/quick-long-name-frame-story.webp`   |
| Quick · `Jean-Baptiste M.` · Receipt Story | `docs/frontend/evidence/share-comparisons/quick-long-name-receipt-story.webp` |
| Tournament · Champion · Story              | `docs/frontend/evidence/share-comparisons/tournament-champion-story.png`      |
| Tournament · Standings · Story             | `docs/frontend/evidence/share-comparisons/tournament-standings-story.png`     |
| Tournament · Full draw · Story             | `docs/frontend/evidence/share-comparisons/tournament-full-draw-story.png`     |

The final independently approved recap target hashes, in table order, are
`386144f9fdaa3b2e3ee25331d591d591a87eb0c90a2d6880af02f5229aae110a`,
`a06a43f9d0365f5f892ece43da546053381fdd38096bf4acec264aebf1e7c457`,
`f7f1c7b164c661050ece3b80b8278fc933db88e7ccc3ad57cc95eaa7663a4a08`,
`ad637723c277f7c4c3602f8d5591b951a63e7f15dda3bdbda5661789a3f03060`,
`5f64490aa78c952be15f4bd563b15250260a18e7047d7cb1d62b078cf7e5078e`,
`fab4c15615bd742f6daeeac090311869909493a8dcee9fd2555c7dec305d003c`,
`4ab1e5fc0992107141d354a20473034fae6b3b9e4901ef5adb1f7be8983d09e1`,
and `24027aa8ae7e9e1466df4b35804d0585b231e00cd2d884abb1ef31448a2a0baf`.

The independently reviewed tournament Story targets are reference-derived,
not supplied authorities. Their Champion, Standings, and Full draw hashes are
`58101a490493b40d63eb0d49f592dc9085b3e787bbea3bf31189bd9a999afad4`,
`aedb33687c1e528f77fada865b755864be3353b16def83dfbfea5f57413b5c21`,
and `8306e2229c998f99fddf6285c952c580c6c9d92ce956785edd0019879adad5e7`.

Supplied source hashes, in the table order above, are
`fd359dc21bcdec8d5f02a470722195b778f530932a0a8154f0ee2fac03a581e3`,
`27b20c7ac2ff386c4823114c469249404c134f6b538b5ba872a8e8481eeb520f`,
`18e4080472f599e790897efdb964d91691832f8ea96c7c73066a13b2523ba995`,
`622818b65acbef1800315c06d4f2d8a16e43a8ea1c9d97b53f339fb73d3cc545`, and
`92cb451e554dc860205e4fcd2b48f483327034ea0d9b7b5361de764b7b53e5f2`.
Each current export uses the reference's names, score, and Aug 22 date so the
third panel is a valid absolute pixel-difference signal.

Quick Receipt no longer uses the whole-card difference image as its sole gate.
`scripts/measure-receipt-fidelity.mjs --check` isolates the dynamic text masks
at 1080×1920 and fails on geometry or shape drift. The final Maya/Steven render
measures winner `556,1149,457,238`, score `162,1453,850,257`, and opponent
`789,1729,209,31`; every edge remains inside the contracted tolerance. The
five-viewport browser matrix also covers current 16-character and legacy
40-character names without clipping or moving the score/footer geometry.

Poster, Frame, Singles recap, and Doubles recap identity regions use
`scripts/measure-other-share-fidelity.mjs --check`. Unchanged Quick score,
opponent, and tagline regions stay within 14px per edge. The intentional
two-line heading, lighter Frame opponent, and fixed-lane Poster loser score use
readability, minimum-width, vertical-edge, mask, and shared-center checks
instead of obsolete source-glyph widths. Every footer is checked for a centered
readable canonical lockup. The final
Frame template preserves its continuous bottom rule, while dense Doubles keeps
equal 64px masthead margins and the authority's underline-free masthead.

`scripts/measure-recap-grid.mjs --check` is the non-circular recap geometry
gate. It scans Player, W-L, and +/- separately in fresh regular 5/6-row, dense
8-row, compact 12-row, and continuation PNGs. Maximum top/bottom imbalance is
2px; minimum combined divider clearance is 13px. The Doubles masthead build
also rejects any final-S flat-edge plateau above 12% of glyph height, so extra
canvas padding cannot conceal a clipped source contour.

## Findings

| ID      | Severity | Route/region               | Evidence                                                             | Contract/user impact                                                                                                                                      | Owner    | Status |
| ------- | -------- | -------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------ |
| DQA-01  | P1       | home/hero                  | desktop, mobile, and responsive captures                             | rejected static artwork remained visible                                                                                                                  | frontend | fixed  |
| DQA-02  | P1       | bracket/tree               | bracket desktop and mobile captures                                  | node anatomy did not match a tournament bracket                                                                                                           | frontend | fixed  |
| DQA-03  | P1       | scorer/type                | quick-live desktop and mobile captures                               | condensed double digits reduced score legibility                                                                                                          | frontend | fixed  |
| DQA-04  | P2       | setup/controls             | setup desktop and mobile captures                                    | native dropdown and vertical misalignment reduced polish                                                                                                  | frontend | fixed  |
| DQA-05  | P2       | app/navigation             | setup, bracket, and results captures                                 | back path was absent or duplicated outside navigation                                                                                                     | frontend | fixed  |
| DQA-06  | P1       | bracket/byes               | six-player workflow and capture                                      | `BYE` appeared to be an unregistered player                                                                                                               | frontend | fixed  |
| DQA-07  | P1       | bracket/final              | desktop and mobile bracket captures                                  | final label displaced its waiting state and faceoff                                                                                                       | frontend | fixed  |
| DQA-08  | P2       | bracket/edit               | inline correction workflow and capture                               | completed scores could not be edited in their bracket node                                                                                                | frontend | fixed  |
| DQA-09  | P1       | scorer/motion              | burst-tap workflow and NumberFlow contract                           | visual reel could imply points beyond the locked result                                                                                                   | frontend | fixed  |
| DQA-10  | P1       | bracket/edit               | completed and structural-edit workflows                              | late entrants had no fair, comprehensible recovery path                                                                                                   | product  | fixed  |
| DQA-11  | P1       | bracket/edit               | iPad late-entry review and challenge lane                            | live insertion previously required a destructive full reset                                                                                               | product  | fixed  |
| DQA-14  | P1       | result/share               | desktop/mobile result and PNG evidence                               | victory review and exports lacked the approved branded hierarchy                                                                                          | frontend | fixed  |
| DQA-12  | P2       | history                    | empty/populated ledger and iPad evidence                             | a social session had no device-local record                                                                                                               | frontend | fixed  |
| DQA-13  | P2       | quick/setup                | keyboard suggestion workflow                                         | recurring players required repeated name entry                                                                                                            | frontend | fixed  |
| DQA-15  | P1       | scorer/layout              | four target viewport assertions                                      | scorer controls could clip or require page scrolling                                                                                                      | frontend | fixed  |
| DQA-16  | P2       | scorer/start               | idle scorer focus and inert-score workflow                           | users could tap inert scoring zones before discovering Start                                                                                              | frontend | fixed  |
| DQA-17  | P2       | bracket/tools              | bracket desktop and mobile captures                                  | draw utilities appeared outside the Full draw context                                                                                                     | frontend | fixed  |
| DQA-18  | P1       | scorer/controls            | iPad and phone workflow captures                                     | point subtraction was not self-explanatory                                                                                                                | frontend | fixed  |
| DQA-19  | P1       | bracket/schedule           | four/six-player workflow captures                                    | only the recommended opening match could start                                                                                                            | product  | fixed  |
| DQA-20  | P2       | results/share              | recap, stats, and result captures                                    | final data lacked focused social formats                                                                                                                  | frontend | fixed  |
| DQA-21  | P2       | bracket/edit               | inline stable-name workflow                                          | bracket nodes could correct scores but not player identity                                                                                                | product  | fixed  |
| DQA-22  | P1       | result/share               | desktop result and download workflow                                 | native sharing offered no dependable desktop save path                                                                                                    | frontend | fixed  |
| DQA-23  | P1       | result/type                | supplied reference and 4 to 11 export                                | combined score text allowed glyph and separator collisions                                                                                                | frontend | fixed  |
| DQA-24  | P2       | scorer/start               | four centered-overlay viewport assertions                            | the idle action was too large and not centered on the full screen                                                                                         | frontend | fixed  |
| DQA-25  | P2       | scorer/clock               | untimed Quick Match workflow                                         | an empty timing concept remained visible as “Untimed”                                                                                                     | frontend | fixed  |
| DQA-26  | P1       | result/share               | supplied portrait and landscape cards                                | winner scale, score hierarchy, and court atmosphere missed the authority                                                                                  | frontend | fixed  |
| DQA-27  | P1       | share/QA                   | identical source and render hashes                                   | visual QA could report a false pass                                                                                                                       | frontend | fixed  |
| DQA-28  | P1       | results/tablet             | missing 820×1180 and 1180×820 evidence                               | primary target layouts were unproven                                                                                                                      | frontend | fixed  |
| DQA-29  | P2       | bracket/export             | cropped tree and weak champion state                                 | completed draw was not legible or brag-worthy                                                                                                             | frontend | fixed  |
| DQA-30  | P2       | setup/rhythm               | section 02 collision and compressed suffixes                         | setup appeared unfinished                                                                                                                                 | frontend | fixed  |
| DQA-31  | P2       | share/actions              | preview and action captures                                          | icon-only controls reduced Share and Download discoverability                                                                                             | frontend | fixed  |
| DQA-32  | P1       | bracket/names              | 40-character name containment matrix                                 | opponent names collided in run-of-show and node layouts                                                                                                   | frontend | fixed  |
| DQA-33  | P2       | bracket/final              | iPad final capture and 4/8/16 exports                                | final node spacing, status, and tools weakened championship hierarchy                                                                                     | frontend | fixed  |
| DQA-34  | P2       | setup/draw                 | migration, reroll, and responsive controls                           | draw intent and timing controls were unclear or clipped                                                                                                   | product  | fixed  |
| DQA-35  | P1       | share/exports              | eight supplied-reference comparison sheets                           | recap, stats, and bracket artifacts lacked premium visual evidence                                                                                        | frontend | fixed  |
| DQA-36  | P2       | history/results            | populated ledger and archived result captures                        | completed tournament results could not be reopened                                                                                                        | product  | fixed  |
| DQA-37  | P2       | input/touch                | explicit component bounding-box assertions                           | multiple court-side actions were below the 48px touch-target contract                                                                                     | frontend | fixed  |
| DQA-38  | P2       | share/fallback             | mocked Apple unsupported-share state                                 | iPad copy promised a download action that was hidden                                                                                                      | frontend | fixed  |
| DQA-39  | P1       | share/result               | delayed canvas and format-switch workflow                            | stale score artwork flashed before the requested image was ready                                                                                          | frontend | fixed  |
| DQA-40  | P1       | bracket/iPad               | 768/820 portrait and 1024/1180 landscape matrix                      | names wrapped mid-word and final scores drifted out of alignment                                                                                          | frontend | fixed  |
| DQA-41  | P1       | bracket/export             | 4/8-player Post, Story / Reel, and Full draw PNGs                    | portrait sharing previously reused cropped landscape geometry                                                                                             | frontend | fixed  |
| DQA-42  | P2       | quick/result               | confirmation and history workflow                                    | operators had to dismiss a redundant completed-score screen                                                                                               | product  | fixed  |
| DQA-43  | P2       | results/access             | bracket, home, and history reopen workflows                          | completed tournament results were difficult to revisit                                                                                                    | product  | fixed  |
| DQA-44  | P1       | share/dialog               | 820×1180 bracket preview geometry                                    | concatenated modifier classes collapsed the format selector and preview                                                                                   | frontend | fixed  |
| DQA-45  | P2       | share/story                | Story safe-area geometry tests and current PNG                       | podium and result context entered destination chrome territory                                                                                            | frontend | fixed  |
| DQA-46  | P2       | bracket/portrait           | eight-player Story render                                            | the bronze node interrupted the lower finalist's progression connector                                                                                    | frontend | fixed  |
| DQA-47  | P2       | share/evidence             | supplied Jack 5–3 source/render/diff sheet                           | prior evidence boards omitted an explicit pixel-difference panel                                                                                          | frontend | fixed  |
| DQA-48  | P1       | bracket/iPad               | 1180×820 completed bracket capture                                   | final scores drifted and third place required a second scroll destination                                                                                 | frontend | fixed  |
| DQA-49  | P2       | share/controls             | iPad share dialogs                                                   | ratio-heavy labels stacked and obscured the simple format choice                                                                                          | frontend | fixed  |
| DQA-50  | P1       | bracket/portrait           | eight-player Post and Story renders                                  | mirrored portrait trees were difficult to follow and used the wrong podium order                                                                          | frontend | fixed  |
| DQA-51  | P2       | share/stats                | four-player Post and Story renders                                   | oversized fact cards created weak hierarchy and empty interiors                                                                                           | frontend | fixed  |
| DQA-52  | P1       | bracket/iPad               | supplied next/final node captures                                    | moved edit controls crowded participant rows and used unreadable state contrast                                                                           | frontend | fixed  |
| DQA-53  | P2       | setup/hierarchy            | 820×1180 setup capture                                               | Reset all was detached from the field it clears                                                                                                           | frontend | fixed  |
| DQA-54  | P1       | bracket/story              | 8/16-player Story / Reel renders                                     | portrait rounds occupied the upper canvas and did not visibly converge as a tree                                                                          | frontend | fixed  |
| DQA-55  | P1       | bracket/nodes              | current iPad next-match capture                                      | status and edit actions crowded the round label and misaligned the play control                                                                           | frontend | fixed  |
| DQA-56  | P2       | bracket/portrait           | current 16-player Post and Story renders                             | adjacent sibling pairs shared connector rails and obscured real dependencies                                                                              | frontend | fixed  |
| DQA-57  | P1       | bracket/edit               | completed-tournament rename workflow                                 | a label-only edit resubmitted the result and reopened downstream matches                                                                                  | product  | fixed  |
| DQA-58  | P2       | bracket/edit               | two-label validation regression                                      | a rejected second rename could leave the first label partially saved                                                                                      | product  | fixed  |
| DQA-59  | P1       | bracket/nodes              | supplied ready/waiting iPad captures                                 | one universal grid created uneven optical padding and an empty action lane                                                                                | frontend | fixed  |
| DQA-60  | P1       | bracket/portrait           | supplied eight-player Story render                                   | shared central rails obscured dependencies and did not read as a tournament tree                                                                          | frontend | fixed  |
| DQA-61  | P1       | results/names              | legal long-name mobile and desktop captures                          | champion and podium names must fit without mid-word wrapping or clipping                                                                                  | frontend | fixed  |
| DQA-62  | P2       | round-robin                | five contracted desktop/mobile states                                | schedule, standings, placements, results, and archived results needed evidence                                                                            | frontend | fixed  |
| DQA-63  | P2       | phone/landscape            | 844×390 geometry assertion                                           | the primary start action needed to remain visible in the initial viewport                                                                                 | frontend | fixed  |
| DQA-64  | P2       | results/history            | completed round-robin result captures                                | preliminary and placement history needed explicit groups                                                                                                  | frontend | fixed  |
| DQA-65  | P2       | round-robin/setup          | five/six-player desktop, mobile, tablet, and landscape captures      | schedule density, rotating rests, and timed-only advisory needed explicit proof                                                                           | frontend | fixed  |
| DQA-66  | P1       | scorer/serve               | browser comments and 319px scorer capture                            | full-court cue, active box, server marker, score spacing, and cross-net side out                                                                          | frontend | fixed  |
| DQA-67  | P2       | bracket/viewport           | phone, desktop, and both iPad orientations                           | horizontal scrolling alone prevented a complete-draw overview                                                                                             | frontend | fixed  |
| DQA-68  | P1       | home/version               | Axe contrast result at 390×844                                       | the discreet version label measured 3.48:1 instead of 4.5:1                                                                                               | frontend | fixed  |
| DQA-69  | P2       | bracket/overview           | fitted browser captures                                              | the fitted draw was top-aligned and its read-only state was not visible                                                                                   | frontend | fixed  |
| DQA-70  | P2       | bracket/wheel              | Chromium console matrix                                              | React's passive wheel listener could not cancel browser zoom                                                                                              | frontend | fixed  |
| DQA-71  | P2       | bracket/centering          | 390×844 geometry assertion                                           | the initial championship view was 20px off center on the mobile full-bleed lane                                                                           | frontend | fixed  |
| DQA-72  | P1       | bracket/iPad               | production field report and rapid-pointer regression                 | repeated pointer moves starved the queued frame and card controls blocked drag                                                                            | frontend | fixed  |
| DQA-73  | P1       | bracket/overview           | 820×1180 and 1180×820 fitted interaction review                      | scaled 21–30px actions were unsafe and a tapped node did not center at 100%                                                                               | frontend | fixed  |
| DQA-74  | P1       | bracket/iPad               | three-size real-touch swipe matrix                                   | contained vertical overscroll trapped page navigation over the bracket                                                                                    | frontend | fixed  |
| DQA-75  | P2       | bracket/phone              | 390×844 final-node inspection                                        | mobile viewport padding shifted the selected match 20px left after inspect                                                                                | frontend | fixed  |
| DQA-76  | P1       | bracket/iPad               | field report, touch contract, and three-size browser review          | manual Pointer Event drag competed with WebKit scrolling and removed momentum                                                                             | frontend | fixed  |
| DQA-77  | P2       | recap/landscape            | 844×390 recap preview                                                | dialog chrome compressed the receipt below a useful inspection size                                                                                       | frontend | fixed  |
| DQA-78  | P2       | recap/mixed rules          | mixed-rule Doubles renderer review                                   | Top Pair could displace the required point-differential omission notice                                                                                   | frontend | fixed  |
| DQA-79  | P1       | recap/export               | supplied Singles and Doubles receipts plus current comparison boards | recap pages held only six rows and the signature mastheads missed the supplied hierarchy                                                                  | frontend | fixed  |
| DQA-80  | P1       | quick/share                | Poster, Frame, and Receipt Story comparison boards                   | one generic Quick Match card did not offer the three requested reference-led treatments                                                                   | frontend | fixed  |
| DQA-81  | P1       | tournament/share           | Champion, Stats, and Full Bracket export matrix                      | legacy arena artwork broke the cream/black/lime share identity                                                                                            | frontend | fixed  |
| DQA-82  | P2       | setup/names                | 24-character validation and legacy-history coverage                  | new Quick Match names accepted a needlessly large 40-character limit                                                                                      | frontend | fixed  |
| DQA-83  | P1       | recap/export               | annotated Singles comparison board                                   | wrong masthead/table faces, mascot inside the final S, and crowded row rules cheapen the receipt                                                          | frontend | fixed  |
| DQA-84  | P1       | quick/share                | annotated Poster, Frame, and Receipt boards                          | wrong winner/score faces and spacing materially diverge from all three authorities                                                                        | frontend | fixed  |
| DQA-85  | P1       | quick/content              | annotated individual-result boards                                   | Quick cards invent `FINAL` and `FIRST TO` metadata not present in the match                                                                               | frontend | fixed  |
| DQA-86  | P2       | share/footer               | annotated individual-result boards                                   | footer lockups are too close to result content and not consistently bottom-centered                                                                       | frontend | fixed  |
| DQA-87  | P1       | quick/receipt              | normalized region measurement and absolute-difference board          | broad typography, score width, opponent weight/spacing, heading legibility, and footer tracking materially miss the authority                             | frontend | fixed  |
| DQA-88  | P1       | remaining supplied exports | four region-level measurement profiles and current comparison boards | recap tables/date/footer and Quick Poster/Frame typography, score geometry, opponent spacing, and footer scale materially miss their supplied authorities | frontend | fixed  |
| DQA-89  | P1       | share/footer               | canonical asset plus fresh exports                                   | mascot/wordmark ratios varied from 3.49:1 to 6.18:1 instead of using one protected brand lockup                                                           | frontend | fixed  |
| DQA-90  | P1       | quick/share                | fresh 1080×1920 Poster and Frame PNGs                                | Poster WINS intersected the mascot in 410 pixels; Frame MAYA/WINS overlapped vertically by 4px                                                            | frontend | fixed  |
| DQA-91  | P1       | recap/8-row Story          | fresh eight-player page 1 and one-player page 2 PNGs                 | 59px row rhythm drew dividers through the following row and continuation pages changed composition                                                        | frontend | fixed  |
| DQA-92  | P1       | recap/12-row export        | approved 8/12/13-player Post and Story exports                       | pagination began too early and the heavy rows/subtitles had uneven rule spacing                                                                           | frontend | fixed  |
| DQA-93  | P1       | recap/masthead             | contained Singles/Doubles masthead boundary measurements             | raster subtitle scaling looked squashed and the final S lacked a protected edge                                                                           | frontend | fixed  |
| DQA-94  | P1       | quick/long names           | `Jean-Baptiste M.` Poster, Frame, and Receipt Story exports          | character-count wrapping could not guarantee a complete 16-character first name                                                                           | frontend | fixed  |
| DQA-95  | P1       | recap/Doubles masthead     | regular/dense Post and Story component scans                         | a pre-clipped source hid the bottom/right edge loss from the outer canvas guard and retained detached fragments                                           | frontend | fixed  |
| DQA-96  | P1       | recap/regular Feed         | fresh five-player Singles and six-player Doubles Post rasters        | regular pages divided their row space by the twelve-row capacity, wedging 34px text into 27–34px rule bands while leaving lower space unused              | frontend | fixed  |
| DQA-97  | P1       | recap/Doubles masthead     | owner-source contour scan plus regular/dense/compact Feed and Story  | the padded Doubles source still contained a visually flat, pre-clipped final-S contour that an outer bounding-box check could not detect                  | frontend | fixed  |
| DQA-98  | P1       | recap/table grid           | nine-profile Player/W-L/+/- raster scan                              | synthetic font metrics and one shared optical offset could not center three independently rasterized columns or prove every finite density breakpoint     | frontend | fixed  |
| DQA-99  | P1       | Quick result Feed exports  | production `Darien 12–10 Jean-Paul` Poster/Frame/Receipt captures    | iOS ignored Canvas-filter wordmark recoloring; two-digit scores and winner lanes crossed the static artwork because Feed QA only covered smaller fixtures | frontend | fixed  |
| DQA-100 | P1       | Quick result visual gate   | independent full-resolution review of eighteen Post/Story baselines  | broad whole-image tolerance could lose opponent text; Receipt Feed clipped the winner against the mascot and all Feed footers crossed the safe area       | frontend | fixed  |
| DQA-101 | P1       | Quick result fitting       | `Jean-Paul` winner diff bounds plus Canvas text capture              | width-only name fitting painted above its lane, mascot art consumed text space, and Receipt Post silently shortened `12–10` to an ellipsis                | frontend | fixed  |
| DQA-102 | P1       | share/composer             | five-viewport Composer captures and keyboard/touch workflow          | fragmented dialogs, ambiguous format labels, and text-only Quick styles made sharing feel disjointed                                                      | frontend | fixed  |
| DQA-103 | P1       | result/handoff             | confirm, dismiss, continue, and Share result browser workflows       | result persistence and image sharing were coupled, making dismissal and save timing unclear                                                               | product  | fixed  |
| DQA-104 | P1       | tournament/share identity  | Champion, Standings, and Full draw target/render/difference boards   | tournament artifacts did not consistently use the approved cream, near-black, lime, mascot, and canonical-lockup system                                   | frontend | fixed  |
| DQA-105 | P2       | share/responsive actions   | 390×844, 844×390, 820×1180, 1180×820, and 1440×1000 captures         | preview hierarchy and Share/Save reachability were not proven across phone, tablet, and desktop                                                           | frontend | fixed  |

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

| Surface                 | Numeric target    | Numeric result  | Conditions                                                      | Evidence                                           | Result |
| ----------------------- | ----------------- | --------------- | --------------------------------------------------------------- | -------------------------------------------------- | ------ |
| Production PWA precache | ≤ 10 MB           | 9.94 MB         | Minified production build including local templates and fonts   | `npm run build` output                             | passed |
| Serve transition thread | ≤ 50 ms long task | 0 ms longest    | Chromium at 319×768 during one service transition               | `tests/playwright/serve-tracker.spec.ts`           | passed |
| Bracket viewport thread | ≤ 50 ms long task | 0 ms longest    | Chromium at 390×844 across Fit, Reset, zoom, and keyboard input | `tests/playwright/bracket-viewport.spec.ts`        | passed |
| First recap page encode | ≤ 2,500 ms        | 174 ms          | 13-player Doubles recap, first visible Story page               | `output/playwright/session-recap-performance.json` | passed |
| Complete recap page set | ≤ 5,000 ms        | 317 ms total    | First page plus sequential second-page encode/share preparation | `output/playwright/session-recap-performance.json` | passed |
| Recap Story PNG weight  | ≤ 1 MB per page   | 669 KB / 592 KB | 12-row first page and one-row continuation                      | `output/playwright/session-recap-story-card*.png`  | passed |

## Anti-Template Review

| Surface            | Risk                           | Evidence                                              | Finding                                                                                             | Resolution                                                                            | Result |
| ------------------ | ------------------------------ | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------ |
| Live scorer        | Generic dashboard treatment    | quick-live desktop/mobile captures                    | Court-first split scoring remains the dominant composition                                          | Compact rule-specific serve strip uses the existing court identity                    | passed |
| Serve guide        | Decorative sports diagram      | serve-tracker browser flow                            | Every line, box, label, and marker communicates legal serve state                                   | Full court mirrors teams across the net and highlights one legal box                  | passed |
| Full bracket       | Generic canvas/dashboard       | phone, desktop, and iPad captures                     | Existing semantic match cards and connectors remain the product                                     | Native DOM/CSS transform and scrolling add no canvas or dependency                    | passed |
| Session recap      | Generic standings template     | supplied posters and five-size captures               | Oversized format type, paper texture, acid-lime ledger, and one mascot retain the Receipts identity | Canvas renders only selected local match facts; no invented ceremony or AI art        | passed |
| Share Composer     | Generic media picker           | five composer viewports and actual result thumbnails  | The current match remains dominant while format, design, privacy, and actions stay explicit         | Two shared primitives reuse native dialog, radio, scrolling, and Canvas behavior      | passed |
| Tournament exports | Generic trophy/leaderboard art | three full-resolution target/render/difference boards | Champion, Standings, and Full draw remain distinct factual artifacts in one identity                | Existing renderers and data boundaries are retained; no theme engine or invented copy | passed |

## Authorship Evidence

| Decision              | Visible evidence                                                   | Product outcome                                                         |
| --------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| Legal service-box cue | One pulsing lime box on the full mini-court                        | The scorer sees where the next serve begins without calculating parity  |
| Solid server marker   | Lime head-and-torso marker outside the active baseline             | The active server remains distinct without implying live formation      |
| Rally-winner scoring  | Two large court targets paired with whole-rally undo               | One tap records either a point or a service transition correctly        |
| Read-only overview    | Centered complete draw plus an explicit overview note              | Fit reveals the tournament shape without exposing undersized controls   |
| Receipts continuation | Date, format, page count, and full-format statistics on every page | Each shared page remains understandable after it leaves the app         |
| Saved-result handoff  | Confirmation ends before a focused Result saved celebration        | Dismissal cannot erase a match and sharing never controls persistence   |
| Ratio-first composer  | Story (9:16), Post (4:5), and supported Full draw (4:3) labels     | Users choose destination shape before committing to an export           |
| Visual design rail    | Actual Poster, Frame, and Receipt result thumbnails                | Template choice is inspectable, tactile, and never dependent on swiping |

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

Rationale: exact contained previews, native Share/Save fallbacks, measured
name fitting, 48px court-side controls, safe-area geometry, and the current
quick, recap, stats, and 4/8/16-player bracket artifacts were reviewed. The
shared Composer also passes its five target viewports, Story defaults, exact
ratio labels, selected-preview-first thumbnail sequence, focus restoration,
sticky actions, and reduced-motion behavior. Confirmation now persists once
before the transient Result saved handoff. Champion, Standings, and Full draw
use one coherent share identity while keeping their artifact-specific facts and
formats.
Quick Feed matrix now includes the real two-digit `Darien 12–10 Jean-Paul`
fixture in all three treatments, direct chalk/ink lockup assets, and fixed
score/name safe lanes with no Canvas-filter dependency. The
recap set includes one-page 8/12-player exports, the 13-player continuation,
and complete `Jean-Baptiste M.` Quick exports across all three treatments. The
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
