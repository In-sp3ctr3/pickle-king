# Frontend Asset Manifest

Status: ready

## Asset Register

| ID               | Placement              | Type               | Source                  | License                   | Status   | Optimization           | Notes                  |
| ---------------- | ---------------------- | ------------------ | ----------------------- | ------------------------- | -------- | ---------------------- | ---------------------- |
| brand-mark       | header, results, icons | generated raster   | OpenAI image generation | Pickle King project asset | accepted | 512px stripped PNG     | text-free crowned ball |
| hero-art         | home hero              | generated raster   | OpenAI image generation | Pickle King project asset | accepted | 1536×1024 WebP, 272KB  | text-free night court  |
| splatter-mask    | home hero reveal       | generated raster   | OpenAI image generation | Pickle King project asset | accepted | 1536×1024 indexed PNG  | alpha matte, 16KB      |
| social-card      | metadata               | generated raster   | OpenAI image generation | Pickle King project asset | accepted | exact 1200×630 PNG     | product-specific       |
| Barlow Condensed | score/display          | WOFF2              | Fontsource              | SIL Open Font License     | accepted | local Latin subset     | no remote request      |
| Manrope          | body/UI                | WOFF2              | Fontsource              | SIL Open Font License     | accepted | local Latin subset     | no remote request      |
| icons            | controls/status        | React icon package | Lucide                  | ISC                       | accepted | tree-shaken components | no hand-authored SVG   |
| bracket          | tournament draw        | DOM/CSS            | original implementation | MIT project code          | accepted | no canvas/WebGL        | no Skiper Pro source   |

## Catalog and Library Research

| Query/source                             | Candidate                                                        | License/provenance              | React 19 fit          | Product fit                    | Decision                         |
| ---------------------------------------- | ---------------------------------------------------------------- | ------------------------------- | --------------------- | ------------------------------ | -------------------------------- |
| 21st.dev `animated number score counter` | Animated Counter `1844`; Count Up `20068`; Animate Count `20060` | registry examples               | compatible            | score motion only              | use Number Flow directly         |
| 21st.dev Skiper37 mirror                 | `reuno-ui/animated-number/default`                               | Skiper attribution required     | excess dependencies   | partial                        | reference only                   |
| Skiper v37                               | animated number                                                  | public reference                | Motion + Number Flow  | strong for changing numerals   | adapt behavior; retain notice    |
| Skiper v107                              | knockout bracket Pro                                             | source unavailable              | unknown               | visual category only           | reject source; original bracket  |
| 21st.dev `tournament bracket` variants   | no complete elimination-tree result                              | n/a                             | n/a                   | no match                       | original DOM/CSS implementation  |
| 21st.dev / Magic UI Animated Beam        | measured SVG connection beam                                     | MIT                             | compatible            | integration diagram, not sport | reject source                    |
| 21st.dev / Magic UI Animated List        | AnimatePresence list pattern                                     | MIT                             | compatible            | generic auto-reveal demo       | pattern reference only           |
| 21st.dev ShadcnSpace Animated List       | registry returned unauthenticated 403                            | provenance not fully verifiable | unknown               | generic                        | reject                           |
| 21st.dev Reveal Text                     | clipped spring-based line reveal                                 | registry example                | Motion compatible     | strong for one-shot hero type  | adapt behavior; no source copied |
| React Bits Splash Cursor                 | fluid cursor splash                                              | MIT plus Commons Clause         | WebGL and pointer-led | poor for touch/PWA constraints | reject                           |
| React Bits Magnet                        | pointer-proximity button motion                                  | MIT plus Commons Clause         | pointer-led           | weak on courtside touch        | reject; retain tactile press     |
| MDN CSS masking guide                    | multiple composited raster/gradient masks                        | browser platform documentation  | native CSS            | exact hero reveal capability   | accepted                         |
| React Bits AnimatedList                  | keyboard-controlled scrolling list                               | MIT plus Commons Clause         | compatible            | wrong behavior                 | reject for public MIT repository |
| Motion layout / AnimatePresence          | layout and presence transitions                                  | MIT                             | compatible            | strong                         | accepted                         |

## Dependencies

| Package                    | Purpose                        | Rationale                                   |
| -------------------------- | ------------------------------ | ------------------------------------------- |
| `@number-flow/react`       | changing scores/clocks         | stable digit layout and accessible text     |
| `motion`                   | meaningful spatial transitions | bracket, dialog, and crown state continuity |
| `lucide-react`             | consistent controls            | avoids ad hoc raw SVG                       |
| `serwist` / `@serwist/cli` | versioned precache worker      | deterministic post-Vinext injection         |

## Generated Assets

| Asset                   | Tool                                           | Prompt/derivation                                                                                             | Dimensions       | Repository path                                                            | License/status          | Visual review                                   |
| ----------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------- | -------------------------------------------------------------------------- | ----------------------- | ----------------------------------------------- |
| Crowned pickleball mark | OpenAI image generation + ImageMagick          | original text-free, transparent, acid-lime pickleball character with angular gold crown; resized and stripped | 512×512          | `public/brand/pickle-king-mark.png`                                        | project asset; accepted | silhouette and transparency inspected           |
| Home court artwork      | OpenAI image generation + ImageMagick          | original text-free analog sports-poster night court, acid-lime ball, restrained gold crown; stripped WebP     | 1536×1024        | `public/brand/pickle-king-hero.webp`                                       | project asset; accepted | crop, texture, and absence of text checked      |
| Paint splatter mask     | OpenAI image generation + local chroma removal | organic opaque white wet-paint shape on removable magenta; reused at three scales with CSS droplet mattes     | 1536×1024        | `public/brand/pickle-king-splatter-mask.png`                               | project asset; accepted | staged alpha silhouette and 16KB output checked |
| Social card             | OpenAI image generation + local composition    | near-black court, crowned-ball mark, Pickle King launch copy                                                  | 1200×630         | `public/social/pickle-king-card.png`                                       | project asset; accepted | exact size and copy legibility inspected        |
| Standard icons          | ImageMagick derivation                         | accepted mark on court background                                                                             | 192×192, 512×512 | `public/icons/icon-192.png`, `public/icons/icon-512.png`                   | project asset; accepted | standard install sizes inspected                |
| Maskable icons          | ImageMagick derivation                         | accepted mark with maskable safe area                                                                         | 192×192, 512×512 | `public/icons/icon-maskable-192.png`, `public/icons/icon-maskable-512.png` | project asset; accepted | safe area inspected                             |
| Apple touch icon        | ImageMagick derivation                         | accepted mark on court background                                                                             | 180×180          | `public/apple-touch-icon.png`                                              | project asset; accepted | iOS size inspected                              |

No raw-asset exceptions are approved. React Bits source was not copied.
