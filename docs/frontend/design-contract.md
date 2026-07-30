# Frontend Design Contract

Status: ready  
Mode: reference-derived product  
Owner: In-sp3ctr3  
Last updated: 2026-07-30

## Authority

1. The approved product specification.
2. Skiper v37 for the smooth number-change character only.
3. The supplied near-black, acid-lime, athletic direction.
4. Labelled product-specific inference.

| Source       | Authority                  | Use                                         |
| ------------ | -------------------------- | ------------------------------------------- |
| Skiper v37   | measured reference         | Number transition tempo and legibility      |
| Skiper v107  | composition reference only | Paged bracket concept; no Pro source copied |
| Product plan | immutable                  | Flows, controls, content, accessibility     |

## Product and UX

- Audience: a friend group operating a phone beside a court.
- Primary job: finish a fair tournament inside the booked time.
- Primary action: start or resume the next scheduled match.
- Privacy: all names and scores remain local and stay out of URLs.

## Page Regions

| Region       | Purpose                       | Geometry                           | Responsive behavior                        |
| ------------ | ----------------------------- | ---------------------------------- | ------------------------------------------ |
| Court header | brand, session state, install | wide baseline with compact status  | two-row mobile                             |
| Home hero    | explain value and begin       | asymmetric 7/5 split               | stacked; CTA first                         |
| Run of show  | next match and time risk      | lime court slab + ordered queue    | horizontal queue becomes list              |
| Bracket      | advancement overview          | paged rounds, two cards per column | one round per swipe/page                   |
| Scorekeeper  | no-look scoring               | split screen with oversized zones  | portrait two halves; landscape two columns |
| Results      | podium and evidence           | crown focal point + grouped tables | stacked podium then cards                  |

## Geometry and typography

- Max content width: 1440px; gutters 20px mobile, 40px desktop.
- Corner language: 18–28px only on interactive/surface groupings; score fields are squared.
- Display numerals: locally hosted `Barlow Condensed`, 700–800.
- Body and labels: locally hosted `Manrope`, 450–700.
- Numerals use tabular figures; labels use uppercase tracking.

## Color

| Token     | Value     | Role                            |
| --------- | --------- | ------------------------------- |
| court     | `#090b08` | app background                  |
| baseline  | `#11150f` | raised court surface            |
| chalk     | `#f5f3e9` | primary text                    |
| lime      | `#c8ff3d` | active state and primary action |
| lime-deep | `#95c721` | pressed/secondary lime          |
| clay      | `#ff7a4d` | delay and destructive warning   |
| mist      | `#9da494` | secondary text                  |
| line      | `#2b3227` | boundaries and connectors       |

## Components

| Component         | States                         | Rules                                        |
| ----------------- | ------------------------------ | -------------------------------------------- |
| PrimaryButton     | default, pressed, disabled     | 52px minimum, lime fill, black text          |
| PlayerRow         | editing, invalid, complete     | inline name/rating; error text adjacent      |
| MatchCard         | waiting, ready, live, complete | icon/text plus color; scores always visible  |
| ScoreSide         | normal, leader, golden         | whole large zone adds; explicit minus button |
| NumberFlow        | changing, reduced motion       | numbers only; no ornamental looping          |
| Dialog            | confirm, destructive           | initial focus, escape, focus return          |
| Toast/live region | neutral, warning               | concise and announced politely               |

## Motion

| Motion              | Purpose                  | Trigger             | Timing              | Reduced motion |
| ------------------- | ------------------------ | ------------------- | ------------------- | -------------- |
| score digit flow    | preserve number location | score/time update   | spring, about 320ms | immediate text |
| bracket advancement | show dependency          | result confirmation | 420ms ease-out      | crossfade      |
| round paging        | preserve place           | tab/swipe           | 280ms ease-out      | immediate      |
| crown arrival       | celebrate winner         | results entry       | 700ms spring        | static crown   |
| press response      | confirm touch            | pointer/keyboard    | 90ms                | color only     |

## Anti-generic constraints

- Court lines and bracket connectors provide structure; decorative cards do not.
- Lime is reserved for current/ready/primary state, never sprayed across all copy.
- The home visual depicts a real bracket advancing into a crowned ball.
- No gradients, glassmorphism, WebGL, stock sports photos, or dashboard tile grids.

## Acceptance criteria

- Touch targets are at least 48px and status is never color-only.
- Desktop 1440px, mobile 390px, and tablet layouts are verified.
- Live scoring stays operable with one hand and without fine pointer control.
- Reduced motion, keyboard focus, visible errors, and semantic announcements pass.
