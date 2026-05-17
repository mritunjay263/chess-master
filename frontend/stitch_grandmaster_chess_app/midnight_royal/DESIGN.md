---
name: Midnight Royal
colors:
  surface: '#011230'
  surface-dim: '#011230'
  surface-bright: '#293958'
  surface-container-lowest: '#000d27'
  surface-container-low: '#091b39'
  surface-container: '#0e1f3d'
  surface-container-high: '#192a48'
  surface-container-highest: '#253453'
  on-surface: '#d8e2ff'
  on-surface-variant: '#c5c6cd'
  inverse-surface: '#d8e2ff'
  inverse-on-surface: '#20304f'
  outline: '#8f9097'
  outline-variant: '#44474d'
  surface-tint: '#b9c7e4'
  primary: '#b9c7e4'
  on-primary: '#233148'
  primary-container: '#0a192f'
  on-primary-container: '#74829d'
  inverse-primary: '#515f78'
  secondary: '#95d3ba'
  on-secondary: '#003829'
  secondary-container: '#0b513d'
  on-secondary-container: '#83c2a9'
  tertiary: '#c1c7cf'
  on-tertiary: '#2b3137'
  tertiary-container: '#141a1f'
  on-tertiary-container: '#7c838a'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d6e3ff'
  primary-fixed-dim: '#b9c7e4'
  on-primary-fixed: '#0d1c32'
  on-primary-fixed-variant: '#39475f'
  secondary-fixed: '#b0f0d6'
  secondary-fixed-dim: '#95d3ba'
  on-secondary-fixed: '#002117'
  on-secondary-fixed-variant: '#0b513d'
  tertiary-fixed: '#dde3eb'
  tertiary-fixed-dim: '#c1c7cf'
  on-tertiary-fixed: '#161c22'
  on-tertiary-fixed-variant: '#41474e'
  background: '#011230'
  on-background: '#d8e2ff'
  surface-variant: '#253453'
typography:
  headline-xl:
    fontFamily: EB Garamond
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: EB Garamond
    fontSize: 32px
    fontWeight: '500'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: EB Garamond
    fontSize: 28px
    fontWeight: '500'
    lineHeight: 36px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.1em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 8px
  container-padding: 24px
  gutter: 16px
  board-margin: 32px
---

## Brand & Style

The design system is crafted to evoke the hushed, high-stakes atmosphere of a private members' club at midnight. It targets an elite audience of chess enthusiasts who value precision, tradition, and intellectual competition. The aesthetic is a sophisticated blend of **Corporate Modern** and **Minimalism**, stripping away distractions to focus entirely on the strategic landscape of the board.

The emotional response should be one of quiet confidence and focused intensity. Every interaction is designed to feel deliberate and weighted, mirroring the gravity of a grandmaster’s move. Sharp silver accents and deep shadows provide a sense of physical depth, as if the interface were a bespoke table in a dimly lit library.

## Colors

The palette is anchored in a deep, nocturnal Navy (`#0a192f`) that serves as the canvas for the entire experience. This is complemented by a rich Emerald Green (`#064e3b`), used sparingly for high-value interactions, success states, and key board elements to signify growth and tactical advantage.

Silver (`#e2e8f0`) and Cool White (`#f8fafc`) provide the necessary "cutting edge" to the UI, used for borders and primary text to ensure legibility against the dark backgrounds. A secondary neutral Navy (`#112240`) is utilized for surface layering and container backgrounds to create subtle structural hierarchy without breaking the dark-mode immersion.

## Typography

This design system utilizes a dual-font strategy to balance heritage with modern utility. 

**EB Garamond** is the primary serif used for headlines and titles. It brings a literary, scholarly authority to the app, reminiscent of classic chess manuscripts. It should be typeset with slightly tighter letter-spacing in larger sizes to maintain its "elite" character.

**Hanken Grotesk** serves as the functional workhorse for all UI elements, data points, and body copy. Its sharp, contemporary geometry ensures that coordinate systems and move notations remain perfectly legible at any scale. Labels should often be displayed in uppercase with generous letter-spacing to reinforce the premium, "silver-etched" aesthetic.

## Layout & Spacing

The layout philosophy follows a **Fixed Grid** model centered on the chess board—the hearth of the experience. On desktop, the board is flanked by asymmetric panels for move history and player statistics. On mobile, the layout reflows to a vertical stack with the board occupying the upper two-thirds of the viewport.

A rigorous 8px spatial rhythm is maintained. Margins and paddings should be generous to create a sense of "breathing room" typical of luxury environments. The chessboard itself should always have a clear safety margin (`board-margin`) to separate the field of play from the surrounding UI controls.

## Elevation & Depth

Visual hierarchy is established through **Tonal Layers** and **Ambient Shadows**. Instead of traditional drop shadows that can look muddy on dark backgrounds, this design system uses deep, navy-tinted shadows (`rgba(2, 12, 27, 0.8)`) with a high blur radius to lift components off the base surface.

Surfaces are distinguished by subtle shifts in navy saturation. The most important interactive elements (like the current move or active card) are "caged" in a ultra-thin 1px Silver border with low opacity (15-20%). This creates a "silver-rimmed" effect that feels tactile and high-end.

## Shapes

The shape language is disciplined and professional. A **Soft** roundedness level (0.25rem) is applied to most UI components, such as buttons and cards. This provides a subtle hint of modernity without sacrificing the "serious" nature of the game.

The chessboard squares should remain perfectly sharp (0px radius) to respect the mathematical precision of the game. Larger containers, like the player dashboard or modal windows, can scale up to a 0.75rem (`rounded-xl`) radius to feel more approachable as "furniture" within the app.

## Components

### Buttons
Primary buttons use the Emerald Green fill with Cool White text. Secondary buttons are "Ghost" style, featuring a 1px Silver border and Silver text. All buttons have a high-gloss hover state where the silver border increases in opacity.

### Chessboard & Pieces
The board uses alternating squares of Deep Navy and a slightly desaturated Emerald. Selected pieces or move hints are indicated by a "Silver Glow"—a subtle outer glow effect rather than a solid color fill—maintaining the "Midnight Royal" aesthetic.

### Cards & Panels
Cards use a slightly lighter navy background than the main canvas. They must feature a thin silver top-border to catch the "overhead light" of the interface, reinforcing the feeling of physical objects on a dark table.

### Input Fields & Controls
Inputs are minimal, featuring only a Silver bottom-border (underline) that glows Emerald when focused. Checkboxes and radio buttons use the Emerald Green as the "active" fill, encased in a Silver ring.

### Move Notation List
The list of moves should be styled with monospaced precision using Hanken Grotesk. Current moves are highlighted with a soft Emerald background tint (10% opacity) and a Silver left-border accent.