# Frontend Design Review

Reviewer: local adversarial frontend review
Result: passed
Source state:
codex/fix/share-flow-ipad-polish@base-7c2cdb0 + reviewed working tree
Reviewed at: 2026-08-03

Open P0: 0
Open P1: 0
Open P2: 0

## Evidence

<!-- prettier-ignore -->
- Source captures: docs/frontend/evidence/home-desktop-source.png, docs/frontend/evidence/home-mobile-source.png, docs/frontend/evidence/home-completed-desktop-source.png, docs/frontend/evidence/home-completed-mobile-source.png, docs/frontend/evidence/setup-desktop-source.png, docs/frontend/evidence/setup-mobile-source.png, docs/frontend/evidence/bracket-desktop-source.png, docs/frontend/evidence/bracket-mobile-source.png, docs/frontend/evidence/bracket-completed-desktop-source.png, docs/frontend/evidence/bracket-completed-mobile-source.png, docs/frontend/evidence/quick-setup-desktop-source.png, docs/frontend/evidence/quick-setup-mobile-source.png, docs/frontend/evidence/quick-idle-desktop-source.png, docs/frontend/evidence/quick-idle-mobile-source.png, docs/frontend/evidence/quick-live-desktop-source.png, docs/frontend/evidence/quick-live-mobile-source.png, docs/frontend/evidence/quick-result-desktop-source.png, docs/frontend/evidence/quick-result-mobile-source.png, docs/frontend/evidence/results-desktop-source.png, docs/frontend/evidence/results-mobile-source.png, docs/frontend/evidence/history-desktop-source.png, docs/frontend/evidence/history-mobile-source.png, docs/frontend/evidence/history-populated-desktop-source.png, docs/frontend/evidence/history-populated-mobile-source.png, docs/frontend/evidence/history-results-desktop-source.png, docs/frontend/evidence/history-results-mobile-source.png

<!-- prettier-ignore -->
- Render captures: test-results/frontend-captures/home-desktop.png, test-results/frontend-captures/home-mobile.png, test-results/frontend-captures/home-completed-desktop.png, test-results/frontend-captures/home-completed-mobile.png, test-results/frontend-captures/setup-desktop.png, test-results/frontend-captures/setup-mobile.png, test-results/frontend-captures/bracket-desktop.png, test-results/frontend-captures/bracket-mobile.png, test-results/frontend-captures/bracket-completed-desktop.png, test-results/frontend-captures/bracket-completed-mobile.png, test-results/frontend-captures/quick-setup-desktop.png, test-results/frontend-captures/quick-setup-mobile.png, test-results/frontend-captures/quick-idle-desktop.png, test-results/frontend-captures/quick-idle-mobile.png, test-results/frontend-captures/quick-live-desktop.png, test-results/frontend-captures/quick-live-mobile.png, test-results/frontend-captures/quick-result-desktop.png, test-results/frontend-captures/quick-result-mobile.png, test-results/frontend-captures/results-desktop.png, test-results/frontend-captures/results-mobile.png, test-results/frontend-captures/history-desktop.png, test-results/frontend-captures/history-mobile.png, test-results/frontend-captures/history-populated-desktop.png, test-results/frontend-captures/history-populated-mobile.png, test-results/frontend-captures/history-results-desktop.png, test-results/frontend-captures/history-results-mobile.png

<!-- prettier-ignore -->
- Combined comparisons: test-results/frontend-comparisons/home-desktop.png, test-results/frontend-comparisons/home-mobile.png, test-results/frontend-comparisons/home-completed-desktop.png, test-results/frontend-comparisons/home-completed-mobile.png, test-results/frontend-comparisons/setup-desktop.png, test-results/frontend-comparisons/setup-mobile.png, test-results/frontend-comparisons/bracket-desktop.png, test-results/frontend-comparisons/bracket-mobile.png, test-results/frontend-comparisons/bracket-completed-desktop.png, test-results/frontend-comparisons/bracket-completed-mobile.png, test-results/frontend-comparisons/quick-setup-desktop.png, test-results/frontend-comparisons/quick-setup-mobile.png, test-results/frontend-comparisons/quick-idle-desktop.png, test-results/frontend-comparisons/quick-idle-mobile.png, test-results/frontend-comparisons/quick-live-desktop.png, test-results/frontend-comparisons/quick-live-mobile.png, test-results/frontend-comparisons/quick-result-desktop.png, test-results/frontend-comparisons/quick-result-mobile.png, test-results/frontend-comparisons/results-desktop.png, test-results/frontend-comparisons/results-mobile.png, test-results/frontend-comparisons/history-desktop.png, test-results/frontend-comparisons/history-mobile.png, test-results/frontend-comparisons/history-populated-desktop.png, test-results/frontend-comparisons/history-populated-mobile.png, test-results/frontend-comparisons/history-results-desktop.png, test-results/frontend-comparisons/history-results-mobile.png

<!-- prettier-ignore -->
- Supplied-reference comparisons: docs/frontend/evidence/share-comparisons/quick-feed-source-render-diff.png, docs/frontend/evidence/share-comparisons/quick-feed.webp, docs/frontend/evidence/share-comparisons/quick-story.webp, docs/frontend/evidence/share-comparisons/recap-feed.webp, docs/frontend/evidence/share-comparisons/recap-story.webp, docs/frontend/evidence/share-comparisons/stats-feed.webp, docs/frontend/evidence/share-comparisons/bracket-4.webp, docs/frontend/evidence/share-comparisons/bracket-8.webp, docs/frontend/evidence/share-comparisons/bracket-16.webp

<!-- prettier-ignore -->
- Completed-state source captures: docs/frontend/evidence/home-completed-desktop-source.png, docs/frontend/evidence/home-completed-mobile-source.png, docs/frontend/evidence/bracket-completed-desktop-source.png, docs/frontend/evidence/bracket-completed-mobile-source.png

<!-- prettier-ignore -->
- Completed-state render captures: test-results/frontend-captures/home-completed-desktop.png, test-results/frontend-captures/home-completed-mobile.png, test-results/frontend-captures/bracket-completed-desktop.png, test-results/frontend-captures/bracket-completed-mobile.png

<!-- prettier-ignore -->
- Completed-state comparisons: test-results/frontend-comparisons/home-completed-desktop.png, test-results/frontend-comparisons/home-completed-mobile.png, test-results/frontend-comparisons/bracket-completed-desktop.png, test-results/frontend-comparisons/bracket-completed-mobile.png

## Findings

| ID    | Severity | Route/region    | Evidence                                    | Repair                                                                                   | Status |
| ----- | -------- | --------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------- | ------ |
| DR-01 | P1       | home/hero       | regenerated desktop/mobile evidence         | replaced the rejected product demo with the crowned mascot and blink                     | fixed  |
| DR-02 | P1       | bracket/tree    | four- and six-player evidence               | grouped two contenders, scores, and a compact action inside every connected node         | fixed  |
| DR-03 | P1       | scorer/type     | 10–10 tablet evidence                       | replaced joined condensed numerals with separated Archivo Black figures                  | fixed  |
| DR-04 | P2       | setup/controls  | setup and responsive evidence               | added custom select, animated choices, field-local errors, and aligned fields            | fixed  |
| DR-05 | P2       | navigation      | setup, bracket, and results evidence        | consolidated Back and Home into a solid centered island                                  | fixed  |
| DR-06 | P2       | bracket/queue   | four- and six-player evidence               | limited `Next` and lime treatment to the one-court eligible match                        | fixed  |
| DR-07 | P1       | bracket/byes    | six-player workflow and evidence            | replaced fake-looking `BYE` rows with explicit automatic-advance nodes                   | fixed  |
| DR-08 | P1       | bracket/final   | desktop and mobile evidence                 | moved `Waiting` top-right and centered both finalists around the trophy                  | fixed  |
| DR-09 | P2       | bracket/edit    | correction workflow and evidence            | embedded score inputs, tie selection, save, and cancel in completed nodes                | fixed  |
| DR-10 | P1       | draw/editor     | completed-match and iPad workflows          | separated safe renames from destructive field reseeding                                  | fixed  |
| DR-11 | P1       | result/share    | result and exported PNG evidence            | promoted crown, score, names, and explicit share/download actions                        | fixed  |
| DR-12 | P2       | history/names   | ledger and combobox workflows               | added a local score ledger and reusable, accessible player-name suggestions              | fixed  |
| DR-13 | P1       | result/share    | modal, results, and exported PNGs           | made the existing mascot the single crown, added truthful context, and branded exports   | fixed  |
| DR-14 | P1       | scorer/fit      | four target viewport assertions             | fixed the scorer to `100dvh` and moved Start into an initially focused overlay           | fixed  |
| DR-15 | P2       | result/motion   | normal and reduced-motion workflows         | added a cleaned-up two-sided burst with a deterministic static fallback                  | fixed  |
| DR-16 | P2       | bracket/tools   | desktop and mobile bracket evidence         | moved draw utilities beside Full draw and stacked them on narrow screens                 | fixed  |
| DR-17 | P1       | bracket/ready   | four- and six-player workflows              | kept one recommended court while exposing compact play actions on other ready nodes      | fixed  |
| DR-18 | P1       | bracket/final   | desktop and mobile evidence                 | centered the finalists and trophy as one compact faceoff with status held top-right      | fixed  |
| DR-19 | P2       | scorer/input    | tablet and phone interaction tests          | retained full-panel tapping and added labeled Add point and Undo controls per side       | fixed  |
| DR-20 | P1       | results/share   | podium and exported card evidence           | added medal hierarchy, contextual copy, comeback data, and focused recap/stats exports   | fixed  |
| DR-21 | P2       | scorer/focus    | production desktop focus audit              | focused Start match reliably after both navigation and a production reload               | fixed  |
| DR-22 | P1       | result/share    | supplied references and desktop flow        | previewed the exact artifact and separated native Share from universal Download          | fixed  |
| DR-23 | P1       | result/type     | 4 to 11 exported PNG                        | positioned each score, name, and separator independently with bold reference-led type    | fixed  |
| DR-24 | P2       | scorer/start    | four device viewport checks                 | reduced Start to a compact true-center overlay and removed the untimed clock region      | fixed  |
| DR-25 | P1       | result/export   | supplied Jack 5–3 source/render/diff        | rebuilt the winner scale, split score arena, court depth, and factual footer             | fixed  |
| DR-26 | P1       | bracket/export  | 4/8/16-player 1600×1200 evidence            | centered the champion, retained every node, and kept header, podium, and footer in frame | fixed  |
| DR-27 | P2       | share/preview   | phone and both iPad orientations            | added exact previews with compact labelled Share and Download actions                    | fixed  |
| DR-28 | P2       | setup/rhythm    | responsive geometry assertions              | separated section 02 and guaranteed readable number/suffix lanes                         | fixed  |
| DR-29 | P1       | bracket/names   | long-name iPad and export evidence          | bounded both participant lanes and removed unbounded versus headlines                    | fixed  |
| DR-30 | P2       | bracket/final   | final-node and 4/8/16 comparisons           | compacted the championship node, centered the trophy, and made its edit target invisible | fixed  |
| DR-31 | P2       | setup/draw      | copy, migration, reroll, and viewport tests | made rating use explicit and kept Random rerolls fair and pre-start only                 | fixed  |
| DR-32 | P1       | share/family    | eight current reference comparison sheets   | rebuilt the full export family around one original arena and code-rendered data          | fixed  |
| DR-33 | P2       | history/results | populated and read-only result captures     | restored completed results without disturbing the active tournament                      | fixed  |
| DR-34 | P2       | interaction     | 48px bounding-box and Apple fallback tests  | fixed undersized targets and guaranteed a save path when native sharing is unavailable   | fixed  |
| DR-35 | P1       | share/dialog    | 820×1180 bracket preview                    | separated modifier classes and kept all format choices with the fitted preview           | fixed  |
| DR-36 | P2       | share/story     | safe-area bounds and current Story PNG      | moved podium, labels, and result context above the 1640px essential-content boundary     | fixed  |
| DR-37 | P2       | bracket/story   | eight-player portrait draw                  | isolated third place and routed finalist progression around the bronze node              | fixed  |
| DR-38 | P2       | share/evidence  | Jack 5–3 source/render/diff                 | added a normalized source, current render, and explicit pixel-difference panel           | fixed  |
| DR-39 | P2       | results/reentry | completed home and bracket captures         | exposed and verified direct routes back to completed tournament results                  | fixed  |

## Decision

Passed. The exact preview, native share/download fallbacks, measured long-name
behavior, factual results, and current quick/recap/stats/4/8/16 comparison
evidence meet the supplied reference's athletic hierarchy without copying its
pixels or baking dynamic data into raster art. The adversarial review has no
open P0/P1/P2 finding.
