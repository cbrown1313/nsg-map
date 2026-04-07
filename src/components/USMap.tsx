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

// Approximate center coordinates for labeled states on 960x600 viewBox
// Label positions — offset labels use leader lines for small states
const STATE_LABEL_COORDS: Record<string, { x: number; y: number; anchor?: { x: number; y: number } }> = {
  // Licensed states
  TX: { x: 460, y: 440 }, FL: { x: 735, y: 480 }, LA: { x: 590, y: 440 },
  MS: { x: 615, y: 410 }, GA: { x: 710, y: 390 },
  KS: { x: 430, y: 320 }, WA: { x: 140, y: 105 }, OR: { x: 115, y: 165 },
  HI: { x: 305, y: 535 },
  // PSYPACT states — large enough for inline labels
  AL: { x: 660, y: 400 }, AZ: { x: 200, y: 390 }, AR: { x: 545, y: 385 },
  CO: { x: 300, y: 300 }, ID: { x: 195, y: 180 }, IL: { x: 600, y: 300 },
  IN: { x: 640, y: 290 }, KY: { x: 680, y: 320 }, ME: { x: 895, y: 120 },
  MI: { x: 660, y: 230 }, MN: { x: 500, y: 180 },
  MO: { x: 545, y: 330 }, NE: { x: 420, y: 270 }, NV: { x: 160, y: 280 },
  NC: { x: 770, y: 345 }, ND: { x: 430, y: 170 }, OH: { x: 695, y: 275 },
  OK: { x: 460, y: 370 }, PA: { x: 795, y: 240 }, SC: { x: 745, y: 370 },
  SD: { x: 420, y: 215 }, TN: { x: 670, y: 350 }, UT: { x: 230, y: 300 },
  VA: { x: 780, y: 310 }, WI: { x: 560, y: 195 }, WY: { x: 290, y: 230 },
  // Small states — offset labels with leader lines from state center (anchor) to label position
  CT: { x: 920, y: 205, anchor: { x: 872, y: 205 } },
  RI: { x: 920, y: 218, anchor: { x: 878, y: 215 } },
  NJ: { x: 920, y: 257, anchor: { x: 855, y: 255 } },
  DE: { x: 920, y: 270, anchor: { x: 843, y: 273 } },
  MD: { x: 920, y: 283, anchor: { x: 820, y: 280 } },
  DC: { x: 920, y: 296, anchor: { x: 828, y: 290 } },
  NH: { x: 920, y: 155, anchor: { x: 878, y: 160 } },
  VT: { x: 920, y: 142, anchor: { x: 862, y: 148 } },
  WV: { x: 740, y: 300 },
};

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

        {/* State abbreviation labels */}
        {Object.entries(STATE_LABEL_COORDS).map(([code, pos]) => {
          const tier = getStateTier(code);
          if (tier === 'none' || tier === 'excluded') return null;
          const hasLeader = 'anchor' in pos && pos.anchor;
          const textAnchor = hasLeader ? 'start' : 'middle';
          return (
            <g key={`label-${code}`}>
              {/* Leader line for offset labels */}
              {hasLeader && pos.anchor && (
                <line
                  x1={pos.anchor.x}
                  y1={pos.anchor.y}
                  x2={pos.x - 2}
                  y2={pos.y}
                  stroke="hsl(0, 0%, 55%)"
                  strokeWidth="0.75"
                  className="pointer-events-none"
                />
              )}
              {/* Text shadow/outline for readability */}
              <text
                x={pos.x}
                y={pos.y}
                textAnchor={textAnchor}
                dominantBaseline="central"
                fill="none"
                stroke={hasLeader ? 'hsla(0, 0%, 100%, 0.8)' : 'hsla(0, 0%, 0%, 0.4)'}
                strokeWidth="3"
                fontSize="10"
                fontWeight="600"
                fontFamily="system-ui, sans-serif"
                className="pointer-events-none select-none"
                paintOrder="stroke"
              >
                {code}
              </text>
              <text
                x={pos.x}
                y={pos.y}
                textAnchor={textAnchor}
                dominantBaseline="central"
                fill={hasLeader ? 'hsl(0, 0%, 30%)' : 'hsl(0, 0%, 100%)'}
                fontSize="10"
                fontWeight="600"
                fontFamily="system-ui, sans-serif"
                className="pointer-events-none select-none"
              >
                {code}
              </text>
            </g>
          );
        })}

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
