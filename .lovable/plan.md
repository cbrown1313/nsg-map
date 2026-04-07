

# NSG Interactive US Locations Map — Revised Plan

## Overview
A single-page interactive SVG map of the United States showing NSG's service coverage across three tiers, with clickable clinic pins, state-level interactions, and a detail panel.

## State Tiers (3 visual layers)

### 1. Licensed Provider States — Dark teal fill
States where NSG holds a direct license:
- **With clinics**: TX, FL, LA, MS, GA (8 physical clinic pins)
- **Without clinics**: KS, WA, OR, HI (provider licenses only)

### 2. PSYPACT Coverage States — Medium blue fill
All active PSYPACT member states NOT in the Licensed Provider tier:
AL, AZ, AR, CO, CT, DE, DC, ID, IL, IN, KY, ME, MD, MI, MN, MO, NE, NV, NH, NJ, NC, ND, OH, OK, PA, RI, SC, SD, TN, UT, VT, VA, WV, WI, WY

### 3. No Coverage — No fill, not interactive
- Non-PSYPACT: AK, IA, MA, MT, NM
- Excluded entirely: CA, NY — no fill, no tooltip, no hover, no reference anywhere on the page

## Clinic Pins — Dark navy dots
8 pins plotted by city coordinates on the SVG:
1. League City, TX
2. Missouri City, TX
3. Plano, TX
4. Pensacola, FL
5. Slidell, LA
6. Ridgeland, MS
7. Alpharetta, GA
8. Fort Lauderdale, FL

## Click Behavior

| Element | Action |
|---|---|
| Clinic pin | Navigate to clinic location page (e.g. `/locations/houston-league-city/`) |
| Teal state without clinic (KS, WA, OR, HI) | Navigate to `/our-providers/` |
| Blue PSYPACT state | Show tooltip/modal with PSYPACT copy (see below) |
| Blank/white state (non-PSYPACT, CA, NY) | No interaction at all — no click, no hover, no tooltip |

### PSYPACT Tooltip Copy
> "Telehealth neuropsychology services are available in [State] through NSG's PSYPACT-credentialed providers. Services in states where NSG does not hold a direct state license are private pay only. Contact us to learn more and get started."

`[State]` is replaced with the full state name.

## Technical Approach

### Files to create/modify
1. **`src/data/locations.ts`** — Clinic data (name, city, state, coordinates, route slug) and state tier classifications (licensed, PSYPACT, excluded)
2. **`src/components/USMap.tsx`** — SVG map component using inline US state paths. Renders states with tier-based fill colors, pins as positioned circles, and handles all click/hover logic.
3. **`src/components/MapTooltip.tsx`** — Popover/modal for PSYPACT state clicks with the templated copy and a close button.
4. **`src/components/MapLegend.tsx`** — Color legend: Licensed Provider (teal), PSYPACT (blue), Clinic Pin (navy dot).
5. **`src/pages/Index.tsx`** — Replace placeholder with page layout: header bar with NSG branding + "Our Locations" title, the map component centered, and the legend.

### SVG Map
- Use a standard US states SVG path dataset (embedded directly, no external dependency)
- Each state is a `<path>` with a data attribute for the state code
- Fill color determined by tier lookup
- Cursor changes: pointer on interactive states, default on non-interactive
- Hover: subtle brightness shift on teal and blue states only

### Navigation
- Clinic pin clicks and teal-state clicks use React Router `useNavigate`
- Target routes (`/locations/...`, `/our-providers/`) will render placeholder pages for now since scope is map-only

### Responsive
- Desktop: large centered map with legend beside it
- Mobile: map scales down, pins remain tappable, tooltip becomes a bottom drawer

## Color Palette
- **Licensed Provider states**: dark teal `#1a5c5c`
- **PSYPACT states**: medium blue `#4a90c4`
- **Clinic pins**: dark navy `#1a1a3e`
- **No-coverage states**: `#f0f0f0` (light gray, or no fill/white)
- **CA, NY**: same as background — invisible, no interaction

