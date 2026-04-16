import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  CLINIC_LOCATIONS as FALLBACK_CLINICS,
  type ClinicLocation,
  type StateTier,
  LICENSED_STATES,
  PSYPACT_STATES,
  EXCLUDED_STATES,
  LICENSE_ONLY_STATES,
} from '@/data/locations';

export interface StateConfig {
  state_code: string;
  tier: StateTier;
  is_license_only: boolean;
}

export function useClinicLocations() {
  return useQuery({
    queryKey: ['clinic_locations'],
    queryFn: async (): Promise<ClinicLocation[]> => {
      const { data, error } = await supabase
        .from('clinic_locations')
        .select('*');
      if (error) throw error;
      return data.map((r) => ({
        id: r.id,
        name: r.name,
        city: r.city,
        state: r.state,
        slug: r.slug,
        externalUrl: r.external_url ?? undefined,
        svgX: Number(r.svg_x),
        svgY: Number(r.svg_y),
      }));
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: FALLBACK_CLINICS,
  });
}

export function useStateConfigs() {
  return useQuery({
    queryKey: ['state_configs'],
    queryFn: async (): Promise<StateConfig[]> => {
      const { data, error } = await supabase
        .from('state_configs')
        .select('*');
      if (error) throw error;
      return data.map((r) => ({
        state_code: r.state_code,
        tier: r.tier as StateTier,
        is_license_only: r.is_license_only,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Build lookup helpers from state configs (with fallback to hardcoded data) */
export function useStateLookups() {
  const { data: stateConfigs } = useStateConfigs();

  if (!stateConfigs || stateConfigs.length === 0) {
    // Fallback to hardcoded
    return {
      getStateTier: (code: string): StateTier => {
        if (EXCLUDED_STATES.has(code)) return 'excluded';
        if (LICENSED_STATES.has(code)) return 'licensed';
        if (PSYPACT_STATES.has(code)) return 'psypact';
        return 'none';
      },
      isLicenseOnly: (code: string) => LICENSE_ONLY_STATES.has(code),
    };
  }

  const map = new Map(stateConfigs.map((s) => [s.state_code, s]));
  return {
    getStateTier: (code: string): StateTier => map.get(code)?.tier ?? 'none',
    isLicenseOnly: (code: string) => map.get(code)?.is_license_only ?? false,
  };
}
