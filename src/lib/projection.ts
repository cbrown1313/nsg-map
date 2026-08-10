import { geoAlbersUsa } from 'd3-geo';

/**
 * Matches the projection used to generate the state paths in `src/data/us-states.ts`
 * (Albers USA, 960x600 viewBox).
 */
const projection = geoAlbersUsa().scale(1280).translate([480, 300]);

export interface SvgPoint {
  x: number;
  y: number;
}

/** Convert real-world coordinates to map pixel coordinates on the 960x600 viewBox. */
export function projectLatLng(latitude: number, longitude: number): SvgPoint | null {
  const result = projection([longitude, latitude]);
  if (!result) return null;
  return { x: Math.round(result[0] * 10) / 10, y: Math.round(result[1] * 10) / 10 };
}
