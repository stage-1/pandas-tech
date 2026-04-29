# Panda Automotriz — Design System

> **Centro de Mantenimiento.** Repair-order management for small mechanic shops.
> Mobile-first. Used one-handed on greasy phones in sunlit bays. Spanish-speaking users (Colombia).

A panda mechanic in red overalls — that's the brand in one image. Bold red, warm charcoal, denim blue. Industrial but friendly. High contrast so status colors pop in direct sunlight. Dense like Linear, warm like Shopmonkey.

---

## Index

| File / folder | What it is |
|---|---|
| `README.md` | This file. Brand context + guidelines. |
| `DESIGN_BRIEF.md` | Original handoff brief — token tables, priority system, dark surfaces. |
| `colors_and_type.css` | All CSS variables (color, type, spacing, radii, shadow) + semantic classes (`.h-display`, `.label`, `.brand-subtitle`, etc). |
| `SKILL.md` | Agent-Skill manifest so this folder is portable to Claude Code. |
| `tokens/tokens.panda.w3c.json` | W3C Design Tokens spec. Source of truth. |
| `tokens/tokens.panda.figma.json` | Tokens Studio / Figma import. |
| `assets/panda_logo.png` | Original wordmark + mascot lockup. |
| `assets/reference/` | Original brief PNGs (palette, badges, cards, light/dark, spacing). |
| `preview/` | Cards rendered in the Design System tab. |
| `ui_kits/pandas_app/` | Mobile UI kit — kanban board, RO detail, line-item editor, PDF preview. |

## Sources we were given

- Design brief: `DESIGN_BRIEF.md` (uploaded)
- Token files: `tokens.panda.w3c.json`, `tokens.panda.figma.json` (uploaded)
- Logo: `panda_logo.png` (uploaded)
- 5 reference PNGs (palette, badges, cards, light/dark, spacing)

No Figma link, no codebase. Visual recreations in `ui_kits/` are inferred from the brief + tokens — flag for the user to attach the real Figma or repo if pixel-perfect parity matters.

---

## CONTENT FUNDAMENTALS

**Language.** Spanish (Colombia). Tone is warm-utilitarian — speak to a mechanic, not a marketer. Short. Direct. No fluff.

**Voice.**
- **Second person, formal-ish but friendly:** "Crea una cotización", not "Crear cotización". Verbs in imperative.
- **No "tú" vs "usted" mixing** — default to imperative ("Agrega ítem", "Confirma pago").
- **English terms allowed** for industry words that aren't really translated: VIN, kanban, OK. But prefer Spanish: *cotización* over *quote*, *taller* over *shop*.

**Casing.**
- **UPPERCASE** for display/heading lockups in Barlow Condensed (matches the wordmark "PANDA AUTOMOTRIZ"). Tracked +0.06em.
- **Sentence case** for everything else — buttons, list items, labels, body. Never Title Case.
- **UPPERCASE labels** only for tracked metadata (`PRIORIDAD`, `VIN`, `TÉCNICO`) — small + tracked +0.04em.

**Numbers + units.**
- Currency: `$ 240.000` (Colombian peso, period as thousands sep, no decimals).
- Time: `14:30` (24h).
- VIN, plates, part numbers always in JetBrains Mono.

**Microcopy examples (use as a guide).**
- Empty state: *"Sin cotizaciones todavía. Crea la primera."*
- Critical badge: `CRÍTICO` · *"Frenos sin pastillas — no entregar el vehículo."*
- Confirm destructive: *"¿Eliminar este ítem? No se puede deshacer."*
- Success toast: *"Cotización enviada a Diego."*
- Inline error: *"VIN inválido. Debe tener 17 caracteres."*

**Tone never.** No exclamation marks unless the system literally needs to shout (errors, "VEHÍCULO LISTO"). No emoji. No "let's", no "we're excited". This is a tool, not a content site.

**I vs you.** Always *you* (the mechanic). The system is invisible — it doesn't refer to itself.

---

## VISUAL FOUNDATIONS

**Palette.** Three brand colors do all the heavy lifting. **Panda Red** (`#C01E1E` primary, `#E03535` hover) for primary CTAs, critical priority, links. **Charcoal** ramp from `#141412` (text) through `#706D66` (labels) to `#B2AFA8` (borders). **Warm whites** — `#F8F6F2` page, `#F0EDE8` subtle surface, `#FFFFFF` raised cards. **Denim blue** (`#30597C`) is the supporting voice — low-priority, info, secondary buttons. Plus **amber** (`#C48A08`) for medium priority and **forest green** (`#2E8B36`) for done/success. **No pastels. No purple. No blue-black.** All status colors are saturated enough to read in direct sun.

**Type.** Three families, max three weights each.
- **Barlow Condensed** — Bold, UPPERCASE, +0.06em tracking. Display only (page titles, brand lockup, big numbers like the quote total). Echoes the wordmark on the logo banner.
- **Montserrat** — Regular/Medium/Semibold. Everything else: UI headings, body, buttons, labels. (Brand font, uploaded by team — lives in `fonts/`.)
- **JetBrains Mono** — Regular only. VINs, part numbers, plate numbers, code.
Body never goes below 13px on mobile (15px ideal). Touch targets never below 44px.

**Spacing.** 4px base grid (4·8·12·16·20·24·32·40·48·64·80·96). 8px is the rhythm — cards have 16px or 24px internal padding, list rows 12px gap, page gutters 16px on mobile / 24px on tablet+.

**Backgrounds.** Mostly flat warm white (`#F8F6F2`). **No gradients.** No textures. No hand-drawn illustration. The only "image" in chrome is the panda logo (used at small sizes as an avatar/badge or full-size on splash and PDF header). Imagery, when it appears, is photographic — vehicles, parts, repair photos uploaded by mechanics. Photos render with `border-radius: 8px` and a 1px `#E6E2DB` border, no filter, no warm overlay — keep them honest.

**Animation.** Minimal and fast. **150ms** for hover/press color changes. **200ms** for menu/modal enter (ease-out cubic-bezier(0.2, 0, 0, 1)). **No bounces, no spring physics.** Page transitions are crossfades, not slides. Kanban cards slide between columns at 240ms with a slight scale-on-pickup (1.0 → 1.02) and shadow bump (`sm` → `lg`).

**Hover.** On red CTAs: bg shifts `#C01E1E` → `#E03535` (lighter red). On neutral surfaces: bg shifts `transparent` → `#F0EDE8`. On text links: color → `#E03535`. **Never** opacity-based hovers — they look broken in sunlight.

**Press / active.** No shrink. Bg darkens one step (`#C01E1E` → `#7A1010` for red CTAs; `#F0EDE8` → `#E6E2DB` for neutrals). Inner shadow `inset 0 2px 4px rgba(20,20,18,0.06)` on press for tactile feel.

**Focus.** 2px solid `#E03535` outline, 2px offset. High contrast — required for keyboard nav and accessibility.

**Borders.** Always 1px solid. Default `#E6E2DB`, strong `#B2AFA8`, focus `#E03535`. Never use border to indicate priority — that's the badge's job.

**Shadows.** Five-step elevation. `xs` for resting list rows, `sm` for cards, `md` for raised totals, `lg` for active drag / popover, `inner` for pressed state and input wells. Shadows are charcoal-tinted (`rgba(20,20,18,…)`), not pure black — keeps the warm palette intact.

**Corner radii.** `4px` chips/inputs, `6px` small buttons, `8px` subtle cards, `12px` default cards (the workhorse), `16px` raised totals/modals, `9999px` (pill) only for badges. Quote cards are `12px`. **No fully-rounded buttons** — this is a tool, not a consumer app.

**Cards.**
- **Default** — `#FFFFFF` bg, `#E6E2DB` border, `r-xl` 12px, `sh-sm`, padding 24. Line items, RO list rows.
- **Raised** — `#FFFFFF` bg, `#B2AFA8` (strong) border, `r-xl`, `sh-md`. Quote totals, featured / sticky cards.
- **Subtle** — `#F0EDE8` bg, no border, `r-lg` 8px, no shadow. Tech notes, secondary info, sidebar groupings.
- **Brand accent** — `#C01E1E` bg, white text, `r-xl`, no shadow. Urgent banners, "Pago pendiente".

**Layout rules.** Mobile-first. Sticky bottom bar (always 56px tall, `#FFFFFF` with `sh-md`) for primary actions on detail screens. Sticky top app bar (56px, `#FFFFFF`, 1px bottom border). Kanban columns use horizontal snap-scroll, one column wide on phones.

**Transparency / blur.** Used sparingly. The only blur surface: the bottom-bar safe-area on iOS uses `backdrop-filter: blur(12px)` over `rgba(255,255,255,0.85)`. Modals use a flat `rgba(20,20,18,0.4)` scrim — no blur (perf on cheap Android phones).

**Imagery vibe.** Warm. Vehicle photos kept color-true (no filter), repair-process photos are utilitarian — well-lit but not styled. Avoid stock-photo polish. Avoid grayscale.

---

## ICONOGRAPHY

**Source.** No icon set was provided in the codebase or Figma (none was attached). We use **[Lucide](https://lucide.dev/)** via CDN as the closest match — same stroke weight (`1.75`), same flat geometric style, same MIT license. **Flag this as a substitution** — if Panda has its own icon SVGs in their codebase, swap them in.

**Loading.**
```html
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
<i data-lucide="wrench" class="icon-md"></i>
<script>lucide.createIcons();</script>
```

**Sizes.** `xs=12 · sm=16 · md=20 · lg=24 · xl=32`. Default in UI is `md` (20px). Status icons in priority badges are `sm` (16px). Header logo is its own raster.

**Stroke + fill.** Lucide outline-only. Never fill an icon to indicate state — use the badge bg color instead. Stroke colors come from `--icon-default` (= `--fg2`), `--icon-muted` (= `--fg3`), or the matching `--{status}-icon` token.

**Common icons → use.**
- `wrench` — tools, services, settings
- `car` — vehicle (RO list row leading icon)
- `clipboard-list` — quote / RO
- `alert-triangle` — critical
- `clock` — medium / pending
- `info` — low / informational
- `check-circle-2` — done
- `dollar-sign` — totals, payment
- `printer` — PDF / print
- `plus`, `chevron-right`, `more-vertical`, `search`, `filter`, `x`

**Emoji.** Not used. Never.

**Unicode chars as icons.** Avoided. Use Lucide. The only exception: `→` (U+2192) inline in copy where appropriate.

**Logo.** `assets/panda_logo.png` is the full mascot+wordmark lockup. Use it on splash, PDF header, login. **Don't** pull the panda head out as an avatar — it pixelates badly. For chrome avatars use a 1-letter monogram on `--charcoal-800` bg with white text.

---

## Quick start

```html
<link rel="stylesheet" href="colors_and_type.css">
<h1 class="h-display">Panda Automotriz</h1>
<p class="brand-subtitle">Centro de mantenimiento</p>
<button class="btn-primary">Crear cotización</button>
```

See `preview/` cards in the Design System tab and `ui_kits/pandas_app/index.html` for a live click-thru.

---

## Caveats / open questions

- **Fonts** — Brand font is **Montserrat** (variable weight + italic, in `fonts/`). Barlow Condensed and JetBrains Mono still come from Google Fonts CDN — swap in licensed cuts if you have them.
- **Icons** — Lucide substitution. Replace with your codebase's own set if one exists.
- **Codebase / Figma** — none was attached. UI kit is inferred from the brief + tokens. Reattach via the Import menu for pixel parity.
