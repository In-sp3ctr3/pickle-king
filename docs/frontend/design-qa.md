# Frontend Design QA

Status: passed
Last updated: 2026-08-03

## Environment

- Commit/source state:
  codex/feat/late-entry-challenge@victory-polish-validated-working-tree-2026-08-03
- Browser: Playwright Chromium 1.62.1
- Base URL: http://127.0.0.1:3000 production Vinext server
- DPR: Playwright default at 1440×1000 and 390×844
- Stable-data/animation setup: distinct fixed ratings, cleared localStorage,
  blurred focus before capture, disabled screenshot animations, and isolated
  reduced-motion checks
- Responsive verification: 1180×820 iPad landscape, 820×1180 iPad portrait,
  and 844×390 phone landscape

## Evidence

| Route/state  | Viewport | Source capture                                         | Render capture                                          | Combined comparison                                        | Interaction run | Axe result |
| ------------ | -------- | ------------------------------------------------------ | ------------------------------------------------------- | ---------------------------------------------------------- | --------------- | ---------- |
| home         | desktop  | docs/frontend/evidence/home-desktop-source.png         | test-results/frontend-captures/home-desktop.png         | test-results/frontend-comparisons/home-desktop.png         | passed          | passed     |
| home         | mobile   | docs/frontend/evidence/home-mobile-source.png          | test-results/frontend-captures/home-mobile.png          | test-results/frontend-comparisons/home-mobile.png          | passed          | passed     |
| setup        | desktop  | docs/frontend/evidence/setup-desktop-source.png        | test-results/frontend-captures/setup-desktop.png        | test-results/frontend-comparisons/setup-desktop.png        | passed          | passed     |
| setup        | mobile   | docs/frontend/evidence/setup-mobile-source.png         | test-results/frontend-captures/setup-mobile.png         | test-results/frontend-comparisons/setup-mobile.png         | passed          | passed     |
| bracket      | desktop  | docs/frontend/evidence/bracket-desktop-source.png      | test-results/frontend-captures/bracket-desktop.png      | test-results/frontend-comparisons/bracket-desktop.png      | passed          | passed     |
| bracket      | mobile   | docs/frontend/evidence/bracket-mobile-source.png       | test-results/frontend-captures/bracket-mobile.png       | test-results/frontend-comparisons/bracket-mobile.png       | passed          | passed     |
| quick-setup  | desktop  | docs/frontend/evidence/quick-setup-desktop-source.png  | test-results/frontend-captures/quick-setup-desktop.png  | test-results/frontend-comparisons/quick-setup-desktop.png  | passed          | passed     |
| quick-setup  | mobile   | docs/frontend/evidence/quick-setup-mobile-source.png   | test-results/frontend-captures/quick-setup-mobile.png   | test-results/frontend-comparisons/quick-setup-mobile.png   | passed          | passed     |
| quick-idle   | desktop  | docs/frontend/evidence/quick-idle-desktop-source.png   | test-results/frontend-captures/quick-idle-desktop.png   | test-results/frontend-comparisons/quick-idle-desktop.png   | passed          | passed     |
| quick-idle   | mobile   | docs/frontend/evidence/quick-idle-mobile-source.png    | test-results/frontend-captures/quick-idle-mobile.png    | test-results/frontend-comparisons/quick-idle-mobile.png    | passed          | passed     |
| quick-live   | desktop  | docs/frontend/evidence/quick-live-desktop-source.png   | test-results/frontend-captures/quick-live-desktop.png   | test-results/frontend-comparisons/quick-live-desktop.png   | passed          | passed     |
| quick-live   | mobile   | docs/frontend/evidence/quick-live-mobile-source.png    | test-results/frontend-captures/quick-live-mobile.png    | test-results/frontend-comparisons/quick-live-mobile.png    | passed          | passed     |
| quick-result | desktop  | docs/frontend/evidence/quick-result-desktop-source.png | test-results/frontend-captures/quick-result-desktop.png | test-results/frontend-comparisons/quick-result-desktop.png | passed          | passed     |
| quick-result | mobile   | docs/frontend/evidence/quick-result-mobile-source.png  | test-results/frontend-captures/quick-result-mobile.png  | test-results/frontend-comparisons/quick-result-mobile.png  | passed          | passed     |
| results      | desktop  | docs/frontend/evidence/results-desktop-source.png      | test-results/frontend-captures/results-desktop.png      | test-results/frontend-comparisons/results-desktop.png      | passed          | passed     |
| results      | mobile   | docs/frontend/evidence/results-mobile-source.png       | test-results/frontend-captures/results-mobile.png       | test-results/frontend-comparisons/results-mobile.png       | passed          | passed     |
| history      | desktop  | docs/frontend/evidence/history-desktop-source.png      | test-results/frontend-captures/history-desktop.png      | test-results/frontend-comparisons/history-desktop.png      | passed          | passed     |
| history      | mobile   | docs/frontend/evidence/history-mobile-source.png       | test-results/frontend-captures/history-mobile.png       | test-results/frontend-comparisons/history-mobile.png       | passed          | passed     |

## Iteration History

| Iteration | Region           | Pixel signal              | Human finding                                                 | Change                                                                                 | Result |
| --------- | ---------------- | ------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ------ |
| 1         | Typography       | glyph crowding            | condensed display face joined double-digit scores             | introduced Archivo Black with positive score tracking                                  | passed |
| 2         | Home hero        | concept rejection         | product-demo imagery kept replacing the requested identity    | made the existing crowned mascot the sole visual with a restrained blink               | passed |
| 3         | Navigation       | misplaced controls        | corner navigation lacked a reliable bracket-to-setup path     | added one solid centered island with explicit Back and Home                            | passed |
| 4         | Setup            | control imbalance         | generic controls and uneven timing fields felt unfinished     | added custom select, spring choices, field-local errors, and aligned rows              | passed |
| 5         | Bracket          | node-model mismatch       | players and actions occupied separate nodes                   | rebuilt each node as a wide two-contender match converging on a trophy final           | passed |
| 6         | Queue state      | scheduling ambiguity      | every dependency-ready match appeared ready                   | reserved lime and `Next` for the one-court eligible match; marked the rest queued      | passed |
| 7         | Responsive QA    | missing target screens    | tablet and phone landscape behavior had not been proven       | added executable layout tests for all three target viewports                           | passed |
| 8         | Bracket repair   | unclear six-player draw   | `BYE` looked like an unregistered participant                 | named automatic advances in setup/draw and removed the fake contender row              | passed |
| 9         | Result repair    | correction interruption   | completed scores opened browser prompts                       | added compact in-node score editing with explicit tied-result winner selection         | passed |
| 10        | Score motion     | uncontrolled digit reel   | rapid taps appeared to overshoot and subtraction spun forward | removed continuous cycling, restored delta direction, and bounded countdown digits     | passed |
| 11        | Draw repair      | destructive ambiguity     | a forgotten entrant could not be added honestly after play    | split safe name edits from a guarded full reseed                                       | passed |
| 12        | Result moment    | weak share state          | final scores were difficult to screenshot or share            | made score/name/crown dominant and added local PNG sharing                             | passed |
| 13        | Session recall   | no durable visual record  | Quick Matches disappeared after confirmation                  | added a bounded courtside ledger with per-record sharing                               | passed |
| 14        | Name entry       | repeated typing           | recurring doubles players had to be entered every match       | added an accessible custom remembered-name combobox                                    | passed |
| 15        | Result review    | cramped celebration       | the winning score and product identity lacked presence        | expanded the review surface around one crowned mascot, dominant score, and context     | passed |
| 16        | Share output     | generic exported identity | PNG exports used a generic crown instead of the product mark  | made both async builders decode and draw the local mascot before export                | passed |
| 17        | Scorer fit       | clipped idle controls     | the footer start action fell below short landscape viewports  | moved Start match into the score stage and fixed the scorer to `100dvh`                | passed |
| 18        | Draw utilities   | detached actions          | Edit draw and Share bracket competed with the page hero       | grouped both actions beside Full draw with a narrow-screen stack                       | passed |
| 19        | Mixed-skill draw | opening-round humiliation | standard seeding was the only recreational option             | added explicit Competitive and Social draw choices                                     | passed |
| 20        | Scorer controls  | ambiguous correction      | the floating minus control was missed on court                | retained court tap and added labeled add/undo controls                                 | passed |
| 21        | Results          | mutable summary           | correction actions made the final report feel unstable        | moved correction and rename to bracket nodes; kept results static                      | passed |
| 22        | Tournament share | one oversized story       | podium, standings, and draw compete at one aspect ratio       | added focused recap, statistics, and full-bracket exports                              | passed |
| 23        | Result preview   | blind native sharing      | desktop users could not inspect or explicitly save the PNG    | placed the exact generated image in review with separate Share and Download actions    | passed |
| 24        | Share typography | score collision           | a 4 to 11 score crowded its separator and hid player identity | split both scores and names into measured lanes using the supplied reference hierarchy | passed |
| 25        | Scorer idle      | oversized misplaced start | the Start surface read as a top card rather than an overlay   | reduced it to a compact control centered over the viewport                             | passed |

Pixel difference is an iteration signal, not a universal pass threshold. The
intentional hero-scale and final-card repairs were visually reviewed and
promoted as the new frozen baselines. Every reviewed source/render pair is
identical.

## Findings

| ID     | Severity | Route/region     | Evidence                                   | Contract/user impact                                              | Owner    | Status |
| ------ | -------- | ---------------- | ------------------------------------------ | ----------------------------------------------------------------- | -------- | ------ |
| DQA-01 | P1       | home/hero        | desktop, mobile, and responsive captures   | rejected static artwork remained visible                          | frontend | fixed  |
| DQA-02 | P1       | bracket/tree     | bracket desktop and mobile captures        | node anatomy did not match a tournament bracket                   | frontend | fixed  |
| DQA-03 | P1       | scorer/type      | quick-live desktop and mobile captures     | condensed double digits reduced score legibility                  | frontend | fixed  |
| DQA-04 | P2       | setup/controls   | setup desktop and mobile captures          | native dropdown and vertical misalignment reduced polish          | frontend | fixed  |
| DQA-05 | P2       | app/navigation   | setup, bracket, and results captures       | back path was absent or duplicated outside navigation             | frontend | fixed  |
| DQA-06 | P1       | bracket/byes     | six-player workflow and capture            | `BYE` appeared to be an unregistered player                       | frontend | fixed  |
| DQA-07 | P1       | bracket/final    | desktop and mobile bracket captures        | final label displaced its waiting state and faceoff               | frontend | fixed  |
| DQA-08 | P2       | bracket/edit     | inline correction workflow and capture     | completed scores could not be edited in their bracket node        | frontend | fixed  |
| DQA-09 | P1       | scorer/motion    | burst-tap workflow and NumberFlow contract | visual reel could imply points beyond the locked result           | frontend | fixed  |
| DQA-10 | P1       | bracket/edit     | completed and structural-edit workflows    | late entrants had no fair, comprehensible recovery path           | product  | fixed  |
| DQA-11 | P1       | bracket/edit     | iPad late-entry review and challenge lane  | live insertion previously required a destructive full reset       | product  | fixed  |
| DQA-14 | P1       | result/share     | desktop/mobile result and PNG evidence     | victory review and exports lacked the approved branded hierarchy  | frontend | fixed  |
| DQA-12 | P2       | history          | empty/populated ledger and iPad evidence   | a social session had no device-local record                       | frontend | fixed  |
| DQA-13 | P2       | quick/setup      | keyboard suggestion workflow               | recurring players required repeated name entry                    | frontend | fixed  |
| DQA-15 | P1       | scorer/layout    | four target viewport assertions            | scorer controls could clip or require page scrolling              | frontend | fixed  |
| DQA-16 | P2       | scorer/start     | idle scorer focus and inert-score workflow | users could tap inert scoring zones before discovering Start      | frontend | fixed  |
| DQA-17 | P2       | bracket/tools    | bracket desktop and mobile captures        | draw utilities appeared outside the Full draw context             | frontend | fixed  |
| DQA-18 | P1       | scorer/controls  | iPad and phone workflow captures           | point subtraction was not self-explanatory                        | frontend | fixed  |
| DQA-19 | P1       | bracket/schedule | four/six-player workflow captures          | only the recommended opening match could start                    | product  | fixed  |
| DQA-20 | P2       | results/share    | recap, stats, and result captures          | final data lacked focused social formats                          | frontend | fixed  |
| DQA-21 | P2       | bracket/edit     | inline stable-name workflow                | bracket nodes could correct scores but not player identity        | product  | fixed  |
| DQA-22 | P1       | result/share     | desktop result and download workflow       | native sharing offered no dependable desktop save path            | frontend | fixed  |
| DQA-23 | P1       | result/type      | supplied reference and 4 to 11 export      | combined score text allowed glyph and separator collisions        | frontend | fixed  |
| DQA-24 | P2       | scorer/start     | four centered-overlay viewport assertions  | the idle action was too large and not centered on the full screen | frontend | fixed  |
| DQA-25 | P2       | scorer/clock     | untimed Quick Match workflow               | an empty timing concept remained visible as “Untimed”             | frontend | fixed  |

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

Reviewer: local adversarial frontend review
Reviewer result: passed
Reviewer evidence: docs/frontend/reviews/design-review.md

Result: passed

Rationale: the previewed celebration, explicit desktop download, split score
lanes, centered scorer start, court controls, mixed-skill draw, stable-name
editing, replay flow, and focused sharing pass the frontend harness. No
P0/P1/P2 design finding remains open.
