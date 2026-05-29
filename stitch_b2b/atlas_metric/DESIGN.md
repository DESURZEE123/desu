# Design System Specification: The Executive Architect

## 1. Overview & Creative North Star
The "Executive Architect" philosophy moves away from the utilitarian "SaaS-in-a-box" aesthetic toward a **High-End Editorial** experience. In B2B marketing, data is often overwhelming; our role is to act as the "Digital Curator." 

This system rejects the rigid, boxy constraints of traditional mobile dashboards. Instead, it utilizes **intentional asymmetry, tonal depth, and breathless whitespace** to guide the user’s eye. We replace heavy structural lines with sophisticated layering and typographic weight. The result is a platform that feels less like a tool and more like a high-performance workspace—authoritative, serene, and exceptionally precise.

---

## 2. Colors & Surface Philosophy
The palette is anchored by **Trustworthy Deep Blue** (`primary`), but its execution is layered and atmospheric.

### The "No-Line" Rule
Explicitly prohibited: 1px solid borders for sectioning content. Boundaries must be defined through **Background Color Shifts**. For example, a `surface-container-low` section sitting on a `surface` background provides all the separation needed without the "noise" of a stroke.

### Surface Hierarchy & Nesting
Treat the mobile UI as a series of physical layers. We use the Material surface tiers to create "nested" depth:
*   **Base Layer:** `surface` (#f8f9fb)
*   **Sub-Sectioning:** `surface-container-low` (#f3f4f6)
*   **Active Cards:** `surface-container-lowest` (#ffffff)
*   **Elevated Overlays:** `surface-bright` (#f8f9fb)

### The Glass & Gradient Rule
To move beyond a flat interface, utilize **Glassmorphism** for floating headers or navigation bars. Use semi-transparent `surface` colors with a 20px-40px backdrop-blur. 
*   **Signature Textures:** Main CTAs or data-heavy Hero backgrounds should utilize a subtle linear gradient: `primary` (#003d9b) to `primary-container` (#0052cc) at a 135-degree angle. This adds a "lithographic" soul to the UI.

---

## 3. Typography
We utilize a dual-font strategy to balance editorial authority with data clarity.

*   **Display & Headline (Manrope):** The "Voice." Used for high-level metrics and screen titles. The wider apertures and geometric builds of Manrope feel modern and premium.
*   **Title, Body & Labels (Inter):** The "Engine." Inter’s high x-height and neutral personality are reserved for the "work" of the platform—data tables, filter labels, and logs.

**Hierarchy as Identity:**
*   **Large Metrics:** Use `display-md` or `display-sm` with `on-surface` to make numbers feel like "statements."
*   **Data density:** Use `body-sm` for secondary metadata to ensure the screen can breathe even when data-rich.

---

## 4. Elevation & Depth
Depth is achieved through **Tonal Layering** rather than structural geometry.

### The Layering Principle
Never use a shadow where a color shift can work. A `surface-container-lowest` card placed on a `surface-container-low` background creates a natural, soft lift that mimics fine stationery.

### Ambient Shadows
When a "floating" effect is mandatory (e.g., a Bottom Sheet or FAB):
*   **Blur:** 24px–40px.
*   **Opacity:** 4%–8%.
*   **Color:** Tint the shadow with `on-surface` (#191c1e) to create an organic, ambient light effect.

### The "Ghost Border" Fallback
If accessibility requirements demand a border, use the **Ghost Border**: `outline-variant` (#c3c6d6) at **15% opacity**. High-contrast, 100% opaque borders are strictly forbidden as they break the editorial flow.

---

## 5. Components

### Cards & Lists
*   **Style:** `DEFAULT` (0.5rem / 8px) rounded corners.
*   **Separation:** Forbid the use of divider lines. Separate list items using `spacing-md` or by alternating backgrounds between `surface-container-lowest` and `surface-container-low`.

### Buttons
*   **Primary:** High-contrast `primary` container with a subtle 2px inner-glow gradient on the top edge. 
*   **Secondary:** No background; `primary` text with a `Ghost Border`.
*   **Tertiary:** Text-only, using `label-md` for a crisp, professional look.

### Search & Multi-select Filters
*   **Search:** Use a `surface-container-high` background with no border. The search icon should be `outline` (#737685).
*   **Filters:** Chips should use `secondary-container` when active and `surface-variant` when inactive.

### Activity Timeline & Steppers
*   **Visual Style:** Use 2px vertical tracks in `surface-variant`. Completed steps utilize the `primary` blue; pending steps use `secondary-fixed-dim`. 
*   **Log Entry:** Nested within `surface-container-low` to distinguish the log from the primary page surface.

### Status Badges
*   **High Priority:** `error-container` background with `on-error-container` text.
*   **Pending:** `tertiary-container` (orange-hue) with `on-tertiary-fixed-variant`.
*   **Success:** A custom muted green (derived from the "functional green" request) using `secondary` tones for a more professional, less "neon" look.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** embrace negative space. If a view feels "empty," it’s likely working correctly.
*   **Do** use `headline-sm` for section headers to create a rhythmic, magazine-like flow.
*   **Do** use `Glassmorphism` on bottom navigation bars to maintain a sense of content continuity.

### Don't:
*   **Don't** use 100% black text. Always use `on-surface` (#191c1e) for a softer, premium reading experience.
*   **Don't** use standard 1px gray lines to separate content; use background tone shifts instead.
*   **Don't** crowd charts. Data visualizations should always have a "Safe Zone" of at least `1.5rem` (`xl`) of whitespace around them.