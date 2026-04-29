# Panda Automotriz — Design Handoff
> Mechanic shop quoting software. Small business. Spanish-speaking users (Colombia).

## Brand in one sentence
Bold red + warm charcoal + denim blue. Industrial but friendly. Like the logo: a panda mechanic in overalls.

## App
**Quote builder** — create repair quotes per vehicle. Each line item tagged Critical / Medium / Low priority.

Core screens: Quote list → Quote detail → Line item editor → PDF preview

---

## Color tokens

| Token | Value | Use |
|---|---|---|
| `red.400` | `#E03535` | Primary CTA, hover states |
| `red.600` | `#C01E1E` | Primary button bg, links |
| `red.800` | `#7A1010` | Text on red bg |
| `charcoal.900` | `#141412` | Primary text |
| `charcoal.600` | `#3E3C38` | Secondary text |
| `charcoal.400` | `#706D66` | Tertiary / labels |
| `charcoal.200` | `#B2AFA8` | Disabled, borders |
| `white.warm` | `#F8F6F2` | Page background |
| `white.soft` | `#F0EDE8` | Subtle card bg |
| `white.muted` | `#E6E2DB` | Borders, dividers |
| `denim.400` | `#4E7FAD` | Low priority, info |
| `denim.600` | `#30597C` | Low priority icon |

## Priority system (core feature)

| Level | Bg | Border | Text | Icon |
|---|---|---|---|---|
| Critical | `#FDEAEA` | `#F29090` | `#7A1010` | `#C01E1E` |
| Medium | `#FFF6E6` | `#FAD888` | `#7A5205` | `#C48A08` |
| Low | `#EDF2F8` | `#94B5D8` | `#1A3650` | `#30597C` |
| Done | `#EDF7EE` | `#9DD4A2` | `#1D5C22` | `#2E8B36` |

---

## Typography

| Role | Font | Size | Weight | Tracking |
|---|---|---|---|---|
| Display / headings | Barlow Condensed | 36–48px | 700 | +0.06em |
| UI headings | DM Sans | 22–28px | 500 | 0 |
| Body | DM Sans | 15–16px | 400 | 0 |
| Labels / meta | DM Sans | 11–13px | 400 | +0.04em |
| Subtitle (brand) | Barlow Condensed | 12–14px | 500 | +0.10em |
| Code / VIN | JetBrains Mono | 13px | 400 | 0 |

---

## Spacing (4px base grid)
`4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80 · 96`

## Border radius
`none=0 · sm=4 · md=6 · lg=8 · xl=12 · 2xl=16 · full=9999`

## Shadows
```
xs    0 1px 2px rgba(20,20,18,.06)
sm    0 1px 3px rgba(20,20,18,.10)
md    0 4px 6px rgba(20,20,18,.08)
lg    0 10px 15px rgba(20,20,18,.10)
inner inset 0 2px 4px rgba(20,20,18,.06)
```

---

## Card variants
- **Default** — white bg, `#E6E2DB` border, shadow-sm → general line items
- **Raised** — white bg, `#B2AFA8` border, shadow-md → quote totals, featured
- **Subtle** — `#F0EDE8` bg, no shadow → tech notes, secondary info
- **Brand accent** — `#C01E1E` bg → urgent call-to-action

---

## Dark mode surfaces
| Token | Light | Dark |
|---|---|---|
| page bg | `#F8F6F2` | `#141412` |
| surface | `#FFFFFF` | `#1C1B19` |
| subtle | `#F0EDE8` | `#222120` |
| text primary | `#141412` | `#F8F6F2` |
| text secondary | `#3E3C38` | `#9A9790` |
| border | `#E6E2DB` | `#35332F` |

---

## Icon sizes
`xs=12 · sm=16 · md=20 · lg=24 · xl=32`

---

## Attached files
- `01_color_palette.png` — all 4 brand ramps with hex values
- `02_priority_badges.png` — 5 semantic badge states
- `03_card_variants.png` — 4 card types in context
- `04_light_dark_surfaces.png` — both modes side by side
- `05_spacing_radius.png` — spacing scale + radius tokens
- `tokens.panda.w3c.json` — W3C Design Tokens spec
- `tokens.panda.figma.json` — Tokens Studio / Figma import
- `panda_logo.png` — original brand logo

## Prompt for Claude Design
> Build the Panda Automotriz quote builder UI. Use the attached token files. The core interaction is: select a vehicle, add line items (parts + labor), tag each item Critical/Medium/Low, and generate a printable quote. Match the brand palette — red primary CTAs, warm charcoal backgrounds, denim blue for low-priority states. Barlow Condensed for display headings. DM Sans for body. Friendly but utilitarian.
