---
name: Sleek Intellectualism
colors:
  surface: '#0f141a'
  surface-dim: '#0f141a'
  surface-bright: '#353a40'
  surface-container-lowest: '#0a0f14'
  surface-container-low: '#171c22'
  surface-container: '#1b2026'
  surface-container-high: '#252a31'
  surface-container-highest: '#30353c'
  on-surface: '#dee3eb'
  on-surface-variant: '#d1c5b4'
  inverse-surface: '#dee3eb'
  inverse-on-surface: '#2c3137'
  outline: '#9a8f80'
  outline-variant: '#4e4639'
  surface-tint: '#e9c176'
  primary: '#e9c176'
  on-primary: '#412d00'
  primary-container: '#c5a059'
  on-primary-container: '#4e3700'
  inverse-primary: '#775a19'
  secondary: '#c9c6c1'
  on-secondary: '#31312d'
  secondary-container: '#474743'
  on-secondary-container: '#b7b5af'
  tertiary: '#e7bdb1'
  on-tertiary: '#442a22'
  tertiary-container: '#c39d91'
  on-tertiary-container: '#50342c'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdea5'
  primary-fixed-dim: '#e9c176'
  on-primary-fixed: '#261900'
  on-primary-fixed-variant: '#5d4201'
  secondary-fixed: '#e5e2dc'
  secondary-fixed-dim: '#c9c6c1'
  on-secondary-fixed: '#1c1c18'
  on-secondary-fixed-variant: '#474743'
  tertiary-fixed: '#ffdbd0'
  tertiary-fixed-dim: '#e7bdb1'
  on-tertiary-fixed: '#2c160e'
  on-tertiary-fixed-variant: '#5d4037'
  background: '#0f141a'
  on-background: '#dee3eb'
  surface-variant: '#30353c'
typography:
  display-lg:
    fontFamily: Literata
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Literata
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Literata
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  title-md:
    fontFamily: Manrope
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.1em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-padding-mobile: 20px
  container-padding-desktop: 40px
  gutter: 16px
  board-gap: 2px
---

## Brand & Style

The design system is built around the concept of "Sleek Intellectualism." It targets a sophisticated audience that values focus, strategic depth, and quiet luxury. The UI is designed to disappear, leaving the user in a state of flow, while the surrounding elements evoke the feeling of a high-end physical chess club.

The aesthetic blends **Minimalism** with **Modern Corporate** precision. It utilizes heavy whitespace (or "darkspace"), a restricted but rich color palette, and high-fidelity typography. The goal is to create an atmosphere that feels professional, scholarly, and premium—where every interaction feels intentional and weighted.

## Colors

The palette is anchored by a deep, monochromatic foundation to minimize eye strain during long matches.

- **Primary (Gold):** Used sparingly for high-action states, primary buttons, and victory conditions. It represents the "prestige" of the game.
- **Secondary (Ivory):** Used for "Light" pieces and primary body text. It provides a soft, readable contrast against the dark background without the harshness of pure white.
- **Tertiary (Walnut):** A warm wood tone used for subtle accents, secondary UI elements, and the "Dark" board squares in the classic theme.
- **Neutral (Obsidian):** The primary background color. A deep, desaturated navy-charcoal that provides the canvas for the intellectual experience.

**Surface Tiers:**
- Level 0: `#0F141A` (Main Background)
- Level 1: `#1A1F26` (Cards and Board Container)
- Level 2: `#252A33` (Input fields and elevated overlays)

## Typography

This design system employs a pairing of a literary serif and a technical sans-serif to bridge the gap between tradition and modernity.

- **Literata** is used for headlines, player names, and "Moment of Impact" text (e.g., "Checkmate"). It evokes the feeling of a classic chess manuscript.
- **Manrope** handles all functional UI, move notation, timers, and settings. Its geometric but friendly nature ensures high legibility at small sizes on mobile screens.

**Hierarchy Note:** Use `label-caps` for move notation (e.g., Nf3) and secondary metadata to maintain an organized, tabular feel.

## Layout & Spacing

The layout is governed by a **fixed-aspect grid** for the game board and a **fluid grid** for the supporting UI.

- **The Board:** On mobile, the board is the primary anchor, spanning the full width minus the `container-padding-mobile`. On tablet/desktop, it maintains a 1:1 aspect ratio, centered or slightly offset to allow for the move history sidebar.
- **Safe Areas:** Interactive elements like timers and capture trays are placed in the "Thumb Zone" (bottom 40% of the screen) for ergonomic play.
- **Spacing Rhythm:** An 8px base unit is used for all padding and margins. Vertical rhythm is strictly enforced to keep move history lists looking systematic and clean.

## Elevation & Depth

To achieve "Sleek Intellectualism," depth is handled through **Tonal Layering** and **Ambient Shadows**.

- **Surfaces:** Use subtle shifts in hex value rather than heavy shadows to define hierarchy. The board is recessed (lowest level), while the pieces and active UI cards are slightly elevated.
- **Shadows:** Use a "Large & Soft" approach: `0px 12px 32px rgba(0, 0, 0, 0.4)`. This creates a floating effect for modal dialogues and menus.
- **Glassmorphism:** Use for "In-game Overlays" (e.g., pause menu). A 12px backdrop blur with a 10% white border simulates a premium frosted glass lens over the board.

## Shapes

The design system uses **Level 2 (Rounded)** corners. This provides a "friendly-modern" feel that softens the analytical nature of the game.

- **Standard Elements:** 8px (0.5rem) for small buttons and input fields.
- **Large Elements (Cards/Modals):** 16px (1rem) to create a distinct containerized look.
- **The Board:** The outer container of the board should have a 12px radius, while the individual squares remain sharp (0px) to maintain the geometric integrity of the grid.

## Components

### Buttons
- **Primary:** Solid Gold (#C5A059) with dark text. High-gloss finish optional.
- **Secondary:** Outline style with Ivory (#F2EFE9) borders and text.
- **Actionable Icons:** Circular containers with a subtle Level 1 surface background.

### The Chess Board
- **Slate Theme:** Dark Squares: `#252A33`, Light Squares: `#3D4450`.
- **Wood Theme:** Dark Squares: `#5D4037`, Light Squares: `#D7CCC8`.
- **Active State:** The square of the currently selected piece uses a low-opacity Gold highlight (20%).

### Cards & Overlays
- **Player Card:** Features a small circular avatar, name in Literata, and ELO rating in Manrope. Background is a Level 1 surface.
- **In-Game Timer:** Monospaced numerals for the clock to prevent "jitter" as numbers change. The active player's timer glows subtly in Gold.

### Input Fields
- Underlined or softly boxed with a Level 2 surface. Focus state should transition the border color to Gold.

### Pieces (2D)
- **Minimalist Vector:** Clean, high-contrast silhouettes. "Light" pieces in Ivory, "Dark" pieces in a deep Charcoal with an Ivory stroke for definition against the dark board.