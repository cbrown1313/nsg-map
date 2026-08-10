// State tier classifications
export type StateTier = 'licensed' | 'psypact' | 'none' | 'excluded';

export const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', DC: 'District of Columbia',
  FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois',
  IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana',
  ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota',
  MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada',
  NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York',
  NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma',
  OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
};

// Licensed provider states (dark teal)
export const LICENSED_STATES = new Set([
  'TX', 'FL', 'LA', 'MS', 'GA', // with clinics
  'KS', 'WA', 'OR', 'HI',       // without clinics
]);

// States with physical clinics
export const CLINIC_STATES = new Set(['TX', 'FL', 'LA', 'MS', 'GA']);

// Licensed states without clinics (navigate to /our-providers/)
export const LICENSE_ONLY_STATES = new Set(['KS', 'WA', 'OR', 'HI']);

// PSYPACT coverage states (medium blue)
export const PSYPACT_STATES = new Set([
  'AL', 'AZ', 'AR', 'CO', 'CT', 'DE', 'DC', 'ID', 'IL', 'IN',
  'KY', 'ME', 'MD', 'MI', 'MN', 'MO', 'NE', 'NV', 'NH', 'NJ',
  'NC', 'ND', 'OH', 'OK', 'PA', 'RI', 'SC', 'SD', 'TN', 'UT',
  'VT', 'VA', 'WV', 'WI', 'WY',
]);

// Excluded states — no fill, no interaction, no reference
export const EXCLUDED_STATES = new Set(['CA', 'NY']);

// Non-PSYPACT states — no fill, not clickable
export const NO_COVERAGE_STATES = new Set(['AK', 'IA', 'MA', 'MT', 'NM']);

export function getStateTier(stateCode: string): StateTier {
  if (EXCLUDED_STATES.has(stateCode)) return 'excluded';
  if (LICENSED_STATES.has(stateCode)) return 'licensed';
  if (PSYPACT_STATES.has(stateCode)) return 'psypact';
  return 'none';
}

export interface ClinicLocation {
  id: string;
  name: string;
  city: string;
  state: string;
  slug: string;
  /** If set, clicking this clinic navigates to an external URL instead of /locations/:slug/ */
  externalUrl?: string;
  /** Real-world coordinates — svgX/svgY are derived from these via the Albers USA projection */
  latitude?: number;
  longitude?: number;
  // SVG coordinates (960x600 viewBox)
  svgX: number;
  svgY: number;
}

export const CLINIC_LOCATIONS: ClinicLocation[] = [
  { id: 'league-city', name: 'Houston – League City', city: 'League City', state: 'TX', slug: 'houston-league-city', externalUrl: 'https://neurocognitivespecialtygroup.com/location/houston-tx/', latitude: 29.5075, longitude: -95.0949, svgX: 502.4, svgY: 485.8 },
  { id: 'missouri-city', name: 'Houston – Missouri City', city: 'Missouri City', state: 'TX', slug: 'houston-missouri-city', externalUrl: 'https://neurocognitivespecialtygroup.com/location/houston-tx/', latitude: 29.6186, longitude: -95.5377, svgX: 493.9, svgY: 483.5 },
  { id: 'plano', name: 'Dallas – Plano', city: 'Plano', state: 'TX', slug: 'dallas-plano', externalUrl: 'https://neurocognitivespecialtygroup.com/location/dallas-tx/', latitude: 33.0198, longitude: -96.6989, svgX: 472.4, svgY: 409.7 },
  { id: 'pensacola', name: 'Pensacola', city: 'Pensacola', state: 'FL', slug: 'pensacola', externalUrl: 'https://neurocognitivespecialtygroup.com/location/pensacola-fl/', latitude: 30.4213, longitude: -87.2169, svgX: 650.5, svgY: 458.6 },
  { id: 'slidell', name: 'New Orleans – Slidell', city: 'Slidell', state: 'LA', slug: 'new-orleans-slidell', externalUrl: 'https://neurocognitivespecialtygroup.com/location/new-orleans-la/', latitude: 30.2752, longitude: -89.7812, svgX: 602.5, svgY: 465.5 },
  { id: 'ridgeland', name: 'Jackson – Ridgeland', city: 'Ridgeland', state: 'MS', slug: 'jackson-ridgeland', externalUrl: 'https://neurocognitivespecialtygroup.com/location/jackson-ms/', latitude: 32.4285, longitude: -90.1323, svgX: 593, svgY: 419.3 },
  { id: 'alpharetta', name: 'Atlanta – Alpharetta', city: 'Alpharetta', state: 'GA', slug: 'atlanta-alpharetta', externalUrl: 'https://neurocognitivespecialtygroup.com/location/atlanta-ga/', latitude: 34.0754, longitude: -84.2941, svgX: 695.4, svgY: 373.9 },
  { id: 'fort-lauderdale', name: 'Fort Lauderdale', city: 'Fort Lauderdale', state: 'FL', slug: 'fort-lauderdale', latitude: 26.1224, longitude: -80.1373, svgX: 798.4, svgY: 532.9 },
];

