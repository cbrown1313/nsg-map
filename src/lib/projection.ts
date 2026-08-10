import { geoAlbersUsa } from 'd3-geo';

/**
 * The state artwork in `src/data/us-states.ts` is an Albers USA map on a 960x600
 * viewBox that was very slightly rescaled when it was produced. These constants
 * were fitted by comparing the artwork's state bounding boxes against the raw
 * projection, so projected points land inside the drawn shapes.
 */
const CALIBRATION = { ax: 0.98060, bx: 4.286, ay: 0.96762, by: -4.480 };

const projection = geoAlbersUsa().scale(1280).translate([480, 300]);

export interface SvgPoint {
  x: number;
  y: number;
}

const round = (n: number) => Math.round(n * 10) / 10;

/** Convert real-world coordinates to map pixel coordinates on the 960x600 viewBox. */
export function projectLatLng(latitude: number, longitude: number): SvgPoint | null {
  const result = projection([longitude, latitude]);
  if (!result) return null;
  return {
    x: round(CALIBRATION.ax * result[0] + CALIBRATION.bx),
    y: round(CALIBRATION.ay * result[1] + CALIBRATION.by),
  };
}
