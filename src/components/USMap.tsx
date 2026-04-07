import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { US_STATES } from '@/data/us-states';
import {
  getStateTier,
  CLINIC_LOCATIONS,
  LICENSE_ONLY_STATES,
  STATE_NAMES,
  type StateTier,
} from '@/data/locations';
import MapTooltip from './MapTooltip';

const STATE_FILL: Record<StateTier, string> = {
  licensed: 'hsl(180, 55%, 23%)',
  psypact: 'hsl(210, 50%, 53%)',
  none: 'hsl(0, 0%, 94%)',
  excluded: 'hsl(0, 0%, 94%)',
};

const STATE_HOVER: Record<StateTier, string> = {
  licensed: 'hsl(180, 55%, 30%)',
  psypact: 'hsl(210, 50%, 60%)',
  none: '',
  excluded: '',
};

const USMap = () => {
  const navigate = useNavigate();
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [hoveredPin, setHoveredPin] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{
    stateCode: string;
    position: { x: number; y: number };
  } | null>(null);

  const handleStateClick = useCallback(
    (stateCode: string, e: React.MouseEvent) => {
      const tier = getStateTier(stateCode);

      if (tier === 'none' || tier === 'excluded') return;

      if (tier === 'licensed') {
        if (LICENSE_ONLY_STATES.has(stateCode)) {
          navigate('/our-providers/');
        }
        // Licensed states with clinics — clicking the state itself does nothing special
        // Users click pins for clinic navigation
        return;
      }

      if (tier === 'psypact') {
        const rect = (e.currentTarget as Element).closest('svg')?.getBoundingClientRect();
        if (rect) {
          setTooltip({
            stateCode,
            position: {
              x: e.clientX - rect.left,
              y: e.clientY - rect.top,
            },
          });
        }
      }
    },
    [navigate]
  );

  const handlePinClick = useCallback(
    (slug: string) => {
      navigate(`/locations/${slug}/`);
    },
    [navigate]
  );

  const isInteractive = (tier: StateTier) =>
    tier === 'licensed' || tier === 'psypact';

  return (
    <div className="relative w-full">
      <svg
        ref={svgRef}
        viewBox="0 0 960 600"
        className="w-full h-auto"
        role="img"
        aria-label="Interactive map of NSG service coverage across the United States"
      >
        {/* State paths */}
        {US_STATES.map((state) => {
          const tier = getStateTier(state.id);
          const interactive = isInteractive(tier);
          const isHovered = hoveredState === state.id;
          const fill = isHovered && STATE_HOVER[tier]
            ? STATE_HOVER[tier]
            : STATE_FILL[tier];

          return (
            <path
              key={state.id}
              d={state.shape}
              fill={fill}
              stroke="hsl(0, 0%, 100%)"
              strokeWidth="1.5"
              className={interactive ? 'cursor-pointer transition-colors duration-150' : ''}
              onMouseEnter={() => interactive && setHoveredState(state.id)}
              onMouseLeave={() => setHoveredState(null)}
              onClick={(e) => interactive && handleStateClick(state.id, e)}
              aria-label={interactive ? STATE_NAMES[state.id] : undefined}
              role={interactive ? 'button' : undefined}
              tabIndex={interactive ? 0 : undefined}
            >
              {interactive && (
                <title>{STATE_NAMES[state.id]}</title>
              )}
            </path>
          );
        })}

        {/* Clinic pins */}
        {CLINIC_LOCATIONS.map((clinic) => (
          <g
            key={clinic.id}
            className="cursor-pointer"
            onClick={() => handlePinClick(clinic.slug)}
            onMouseEnter={() => setHoveredPin(clinic.id)}
            onMouseLeave={() => setHoveredPin(null)}
            role="button"
            tabIndex={0}
            aria-label={`${clinic.name} clinic`}
          >
            {/* Pin shadow */}
            <circle
              cx={clinic.svgX}
              cy={clinic.svgY + 1}
              r="6"
              fill="hsla(230, 40%, 17%, 0.3)"
            />
            {/* Pin circle */}
            <circle
              cx={clinic.svgX}
              cy={clinic.svgY}
              r="5"
              fill="hsl(230, 40%, 17%)"
              stroke="hsl(0, 0%, 100%)"
              strokeWidth="1.5"
              className="transition-transform duration-150 hover:scale-125 origin-center"
            />
            {/* Pin inner dot */}
            <circle
              cx={clinic.svgX}
              cy={clinic.svgY}
              r="2"
              fill="hsl(0, 0%, 100%)"
            />
            {/* Hover label */}
            {hoveredPin === clinic.id && (
              <g>
                <rect
                  x={clinic.svgX + 10}
                  y={clinic.svgY - 12}
                  width={clinic.name.length * 6.5 + 12}
                  height={20}
                  rx="4"
                  fill="hsl(230, 40%, 17%)"
                  opacity="0.95"
                />
                <text
                  x={clinic.svgX + 16}
                  y={clinic.svgY + 2}
                  fill="hsl(0, 0%, 100%)"
                  fontSize="11"
                  fontFamily="system-ui, sans-serif"
                  fontWeight="500"
                >
                  {clinic.name}
                </text>
              </g>
            )}
          </g>
        ))}
      </svg>

      {/* PSYPACT tooltip */}
      {tooltip && (
        <MapTooltip
          stateCode={tooltip.stateCode}
          position={tooltip.position}
          onClose={() => setTooltip(null)}
        />
      )}
    </div>
  );
};

export default USMap;
