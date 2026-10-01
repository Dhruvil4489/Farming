# SMARTFARM AI — UI / UX SPECIFICATION

---

## 1. Design System & Tokens

SmartFarm AI employs a modern, natural, accessible AgTech visual identity.

### Palette Design Tokens
- `--color-brand-deep`: `#143D2A` (Deep Forest Green — primary brand/navigation)
- `--color-brand-leaf`: `#2F7D4F` (Leaf Green — primary buttons, active states)
- `--color-brand-light`: `#E4F1E8` (Light Mint Surface — subtle highlights)
- `--color-earth-dark`: `#7A5A3A` (Warm Soil Brown — secondary accents)
- `--color-earth-sand`: `#FAF6EF` (Sand Background — warm, low-eyestrain app background)
- `--color-surface`: `#FFFFFF` (Card surfaces, modals)

### Typography
- Base font: **Inter** / Humanist Sans
- Fallback fonts per locale: **Noto Sans Devanagari** (Hindi), **Noto Sans Gujarati** (Gujarati)
- Mobile touch targets: Minimum $\ge 48\text{px}$ height and width.

---

## 2. Shared Domain UI Components

1. `<DataState>`: Shared container wrapping server state. Enforces four explicit states across all screens:
   - **Loading State**: Skeleton cards and spinners.
   - **Success State**: Loaded UI content.
   - **Empty State**: Clear explanation of missing data + call-to-action button.
   - **Error State**: User-friendly message + Retry button.

2. `<ProvenanceChip>`: Renders data source badge on metrics:
   - `Measured` (Green)
   - `User Entered` (Blue)
   - `Weather Service` (Sky)
   - `AI Analysis` (Purple)
   - `Estimate` (Amber)
   - `Demo Data` (Orange Banner)

3. `<CropStageBar>`: Interactive visual timeline displaying crop lifecycle progression.

4. `<FieldCard>`: Interactive field display card showing crop badge color, area, status, and health summary.

---

## 3. Mobile Navigation & Dashboard Layout

- **Mobile View (<640px)**: Bottom Navigation Bar with 5 slots: `Home`, `My Farm`, `Crops`, `Assistant`, `More`. Plus a floating Quick Action button for `+ Photo / Task / Activity`.
- **Desktop View (≥1024px)**: Left collapsible sidebar with global Farm Switcher on the top header.
