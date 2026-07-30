# Frontend Asset Manifest

Status: in progress

## Asset register

| ID               | Placement              | Type               | Status       | Provenance/license                                 | Notes                  |
| ---------------- | ---------------------- | ------------------ | ------------ | -------------------------------------------------- | ---------------------- |
| brand-mark       | header, results, icons | generated raster   | pending      | OpenAI image generation; Pickle King project asset | text-free crowned ball |
| social-card      | metadata               | generated raster   | pending      | OpenAI image generation; Pickle King project asset | product-specific       |
| Barlow Condensed | score/display          | WOFF2              | pending      | SIL Open Font License                              | local subset           |
| Manrope          | body/UI                | WOFF2              | pending      | SIL Open Font License                              | local subset           |
| icons            | controls/status        | React icon package | pending      | package license                                    | no hand-authored SVG   |
| bracket          | home/product           | DOM/CSS            | custom-coded | original                                           | no Skiper Pro source   |

## Catalog and library research

| Query/source                             | Candidate                                                        | Compatibility                       | Decision                        |
| ---------------------------------------- | ---------------------------------------------------------------- | ----------------------------------- | ------------------------------- |
| 21st.dev `animated number score counter` | Animated Counter `1844`; Count Up `20068`; Animate Count `20060` | React-compatible                    | use Number Flow directly        |
| 21st.dev Skiper37 mirror                 | `reuno-ui/animated-number/default`                               | React/Tailwind; excess dependencies | reference only                  |
| Skiper v37                               | animated number                                                  | React + Motion + Number Flow        | adapt behavior; retain notice   |
| Skiper v107                              | knockout bracket Pro                                             | source unavailable                  | reject source; original bracket |

## Dependencies

| Package                    | Purpose                        | Rationale                                   |
| -------------------------- | ------------------------------ | ------------------------------------------- |
| `@number-flow/react`       | changing scores/clocks         | stable digit layout and accessible text     |
| `motion`                   | meaningful spatial transitions | bracket, dialog, and crown state continuity |
| `lucide-react`             | consistent controls            | avoids ad hoc raw SVG                       |
| `serwist` / `@serwist/cli` | versioned precache worker      | deterministic post-Vinext injection         |

## Generated assets

Generation prompts, output dimensions, optimized paths, and visual review are
added here when the assets are produced. No raw-asset exceptions are approved.
