---
name: panda-design
description: Use this skill to generate well-branded interfaces and assets for Panda Automotriz — RO/quote management software for mechanic shops in Colombia (Spanish). Bold red, warm charcoal, denim blue. Industrial but friendly. Mobile-first, high-contrast. Use this skill for production UI or throwaway prototypes/mocks.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files (DESIGN_BRIEF.md, colors_and_type.css, tokens/, assets/, ui_kits/pandas_app/).

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. Pull the panda logo from `assets/panda_logo.png`. Use Lucide for icons via CDN unless the user attaches their own set.

If working on production code, copy `colors_and_type.css` (or the underlying tokens in `tokens/tokens.panda.w3c.json`) and read README.md to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions (audience, surface — mobile/desktop/PDF, in Spanish or English, light/dark, what screens), and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

Key rules to remember:
- Spanish microcopy, sentence case, imperative verbs ("Crea cotización", not "Crear cotización" or "Create quote").
- Barlow Condensed UPPERCASE +0.06em for display only. DM Sans for everything else. JetBrains Mono for VINs/plates/part numbers.
- 4px grid. 44px minimum touch targets. No pastels, no gradients, no emoji.
- Status colors must POP — these are used outdoors in direct sun.
- Cards: 12px radius default, 24px padding, `sh-sm` shadow, `#E6E2DB` border. Raised totals get `sh-md` and `#B2AFA8` border.
- Priority system is the core feature: Crítico (red), Medio (amber), Bajo (denim), Hecho (green).
