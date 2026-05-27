---
name: Gourmet Pulse Minimalist
colors:
  surface: '#fbf8fc'
  surface-dim: '#dcd9dd'
  surface-bright: '#fbf8fc'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f2f7'
  surface-container: '#f0edf1'
  surface-container-high: '#eae7eb'
  surface-container-highest: '#e4e1e6'
  on-surface: '#1b1b1e'
  on-surface-variant: '#584235'
  inverse-surface: '#303033'
  inverse-on-surface: '#f3f0f4'
  outline: '#8c7263'
  outline-variant: '#e0c0af'
  surface-tint: '#994700'
  primary: '#994700'
  on-primary: '#ffffff'
  primary-container: '#ff7a00'
  on-primary-container: '#5c2800'
  inverse-primary: '#ffb68b'
  secondary: '#5d5e66'
  on-secondary: '#ffffff'
  secondary-container: '#e3e1ec'
  on-secondary-container: '#63646c'
  tertiary: '#5d5e60'
  on-tertiary: '#ffffff'
  tertiary-container: '#9fa0a1'
  on-tertiary-container: '#353738'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbc8'
  primary-fixed-dim: '#ffb68b'
  on-primary-fixed: '#321200'
  on-primary-fixed-variant: '#753400'
  secondary-fixed: '#e3e1ec'
  secondary-fixed-dim: '#c6c5cf'
  on-secondary-fixed: '#1a1b22'
  on-secondary-fixed-variant: '#46464e'
  tertiary-fixed: '#e2e2e3'
  tertiary-fixed-dim: '#c6c6c7'
  on-tertiary-fixed: '#1a1c1d'
  on-tertiary-fixed-variant: '#454748'
  background: '#fbf8fc'
  on-background: '#1b1b1e'
  surface-variant: '#e4e1e6'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 16px
  margin-mobile: 20px
  margin-desktop: 48px
  container-max: 1200px
---

## Brand & Style

The brand personality is sophisticated yet approachable, focusing on high-end culinary discovery through a lens of extreme clarity and effortless utility. The target audience consists of discerning food enthusiasts who value efficiency and aesthetic calm. 

The design style is **Minimalism** with a **Corporate/Modern** influence. It prioritizes expansive white space, light-weight strokes, and a rhythmic use of typography to create a sense of order. The visual mood is "airy and precise," stripping away unnecessary ornamentation to let food photography and curated data take center stage. Every element serves a functional purpose, with a strong emphasis on "quiet" navigation and "loud" content.

## Colors

The palette is anchored by a high-brightness **#FAFAFA** background to establish a clean, gallery-like canvas. 

- **Primary (#FF7A00):** Reserved exclusively for high-intent actions (e.g., "Book Now", "Add Restaurant") and critical status indicators. Use sparingly to maintain its "accent" status.
- **Warm Gray Surface (#F4F4F5):** Used for subtle container fills, secondary backgrounds, and card strokes to distinguish content zones without adding visual weight.
- **Text & UI Neutral:** Secondary information uses a muted zinc-gray (**#71717A**) to ensure hierarchy, while primary headings and icons utilize a deep charcoal (**#18181B**) for legibility.

## Typography

This design system utilizes **Plus Jakarta Sans** across all levels to maintain a cohesive, contemporary feel. The typographic hierarchy relies on significant weight contrast rather than size variety. 

Large display titles use a bold weight with tight letter-spacing for a modern editorial look. Secondary metadata, such as cuisine type or price ranges, utilizes a light or regular weight in a smaller size to recede visually. Always maintain generous line-height to ensure the interface feels breathable and easy to scan.

## Layout & Spacing

The layout follows a **Fluid Grid** model with a soft 4px base unit. 

- **Desktop:** A 12-column grid with wide 48px margins to emphasize the minimalist aesthetic. Gutters are kept at a consistent 24px.
- **Mobile:** A 4-column grid with 20px side margins.
- **Spacing Rhythm:** Use large vertical padding (64px+) between major sections to reinforce the sense of "luxury through space." Elements within cards should use 8px or 12px spacing to maintain tight functional relationships while remaining legible.

## Elevation & Depth

To align with the minimalist goal, depth is primarily conveyed through **Tonal Layers** and **Low-Contrast Outlines**.

- **Surfaces:** Cards and inputs use a 1px solid border in `#E4E4E7` instead of heavy shadows. 
- **Soft Shadows:** Only used for floating elements (like dropdowns or modals). These should be extremely diffused: `0px 12px 32px rgba(0, 0, 0, 0.04)`.
- **Active State:** When an item is selected or hovered, a subtle background shift to the warm gray (`#F4F4F5`) is preferred over a shadow increase.

## Shapes

The shape language is **Rounded**, providing a soft, approachable counterpoint to the clean typography. 

- **Default (0.5rem):** Standard for cards, input fields, and image thumbnails.
- **Large (1rem):** Used for featured containers or top-level navigational cards.
- **Pill:** Reserved for status tags (e.g., "Open Now") and filter chips to differentiate them from actionable buttons.

## Components

- **Buttons:** Primary buttons are filled with the accent orange, using white text. Secondary buttons use a ghost style (border-only) or simple text links with a chevron to minimize visual noise.
- **Input Fields:** Minimalist design with a 1px light gray border. Labels should sit above the field in a small, semi-bold weight.
- **Cards:** Content should be displayed with high-quality imagery taking up at least 40% of the card area. Metadata (rating, price, distance) should be grouped horizontally with thin dividers or ample spacing.
- **Chips/Tags:** Use the warm gray background with dark text for inactive states, and a subtle border with accent text for active filter states.
- **Icons:** Exclusively use 1.5px or 2px "Material Outlined" style icons. Avoid filled icons unless they represent an active "saved" or "favorited" state.
- **Lists:** Clean rows with 1px bottom dividers, maximizing the horizontal space for restaurant names and key status indicators.