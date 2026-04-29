# Pandas App — Mobile UI Kit

Mobile RO (repair-order) management for mechanic shops. Spanish (Colombia). Used one-handed in sunlit bays.

## Screens covered

1. **Kanban / Tablero** — home screen. 4 columns: Recibido · En taller · Listo · Entregado. Filter chips at top. RO cards show OT number, vehicle, customer, plate, item count, total, and a top-priority badge.
2. **OT detail** — vehicle header (charcoal-900 panel for max contrast outdoors), line-item list with priority badges per item, sticky totals card (raised variant), and a brand-accent CTA banner for "Pago pendiente".
3. **PDF preview** — what the customer receives. Uses the panda logo + red separator on the document header.

## Components

- `Primitives.jsx` — `StatusBar`, `AppBar`, `BottomBar`, `PrimaryButton`, `SecondaryButton`, `IconButton`, `Icon`, `PriorityBadge`
- `Workshop.jsx` — `ROCard`, `KanbanColumn`, `LineItemRow`, `StickyTotals`, `VehicleHeader`
- `Screens.jsx` — `KanbanScreen`, `ROScreen`, `PDFPreview`, `NavTab`, plus `SEED_ROS` test data

## Notes

- Cosmetic recreation only — no real data layer. Built from `DESIGN_BRIEF.md` + tokens; reattach the codebase or Figma for pixel parity.
- All three screens render side-by-side in `index.html`. Run via the Design System tab or open directly.
- Icons: Lucide CDN (substitution — see top-level README).
