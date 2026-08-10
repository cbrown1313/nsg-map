# Fix precise placement of clinic city dots

## The problem

Pin positions were hand-estimated, so several are visibly wrong: Pensacola sits inside Alabama, Fort Lauderdale is too far north and west, Jackson is slightly north and east of its real spot.

## The fix

Stop eyeballing pixel coordinates. The map artwork uses the standard Albers USA projection on a 960x600 canvas, so every real-world latitude/longitude has one exact pixel position on it. We compute each clinic's dot from its actual coordinates instead of guessing.

Steps:

1. Store real latitude/longitude for each of the 8 clinics (verified street-level coordinates, not just city centers where a clinic is in a suburb - League City, Missouri City, Plano, Slidell, Ridgeland, Alpharetta).
2. Convert those coordinates to map pixels with the same projection that generated the state shapes, so dots land exactly where the cities are.
3. Update the saved dot positions for all 8 clinics with the computed values.
4. Visually verify each pin against its state outline and correct any remaining drift.

## Admin experience

Right now the admin form asks for raw SVG X/Y numbers, which is why positions drift whenever a location is added or edited. The form will instead take latitude and longitude, and calculate the map position automatically on save. Existing X/Y fields stay in the database so the map keeps working unchanged; they just get filled in for you.

If you'd rather keep manual control, we can leave the X/Y inputs visible as an optional override.

## Technical notes

- Add `src/lib/projection.ts` exporting `project(lon, lat): {x, y}` using `d3-geo`'s `geoAlbersUsa().scale(1280).translate([480, 300])`, matching the viewBox of `us-states.ts`.
- Add `latitude` / `longitude` columns to `clinic_locations` (nullable), backfilled for the 8 existing rows; `svg_x` / `svg_y` remain the render source and are derived on write.
- Update fallback data in `src/data/locations.ts` with the recomputed coordinates so the pre-fetch placeholder matches the live data.
- `LocationsEditor` gains lat/lng inputs and computes `svg_x`/`svg_y` in the mutation.
- Alaska/Hawaii insets are handled by `geoAlbersUsa` automatically, which matters if a licensed-state clinic is ever added in Hawaii.
