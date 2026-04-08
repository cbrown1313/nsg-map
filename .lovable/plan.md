

# Improve Mobile Tap Targets for Clinic Pins

## Problem
On mobile screens, the SVG map scales down significantly, making the clinic pins (5px radius) too small to tap reliably. Standard accessibility guidelines recommend a minimum 44×44px tap target.

## Proposed Changes

### 1. Invisible hit area per pin
Add a transparent `<circle>` with a larger radius (~15–18 SVG units) behind each pin group. This expands the tappable area without changing the visual design.

### 2. Larger pin radius on mobile
Use the `useIsMobile()` hook to bump the base pin radius from 5 → 8 on small screens, with proportional increases to the shadow and inner dot.

### 3. Optional: List view below the map on mobile
Render a simple clickable list of clinic locations beneath the map on mobile only, giving users a second way to navigate without needing to precisely tap a pin.

## Technical Details

**File: `src/components/USMap.tsx`**

- Import `useIsMobile` hook
- For each clinic pin `<g>`, prepend a transparent hit-area circle:
  ```tsx
  <circle cx={clinic.svgX} cy={clinic.svgY} r={isMobile ? 18 : 12} fill="transparent" />
  ```
- Conditionally increase visible pin radii on mobile (base 8, hover 9.5)
- Optionally render a `<div>` list of clinic names below the `<svg>` when `isMobile` is true, each linking to the clinic's detail page

All changes are confined to `USMap.tsx`. No new files needed.

