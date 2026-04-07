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
// Label positions — calculated from SVG path bounding-box centers
// Small NE states use offset labels with leader lines
const STATE_LABEL_COORDS: Record<string, { x: number; y: number; anchor?: { x: number; y: number } }> = {
  // Licensed states
  TX: { x: 409, y: 448 }, FL: { x: 723, y: 480 }, LA: { x: 572, y: 449 },
  MS: { x: 601, y: 412 }, GA: { x: 719, y: 400 },
  KS: { x: 444, y: 290 }, WA: { x: 125, y: 50 }, OR: { x: 105, y: 118 },
  HI: { x: 290, y: 546 },
  // PSYPACT states — large enough for inline labels
  AL: { x: 660, y: 409 }, AZ: { x: 201, y: 364 }, AR: { x: 551, y: 370 },
  CO: { x: 322, y: 271 }, ID: { x: 200, y: 112 }, IL: { x: 592, y: 259 },
  IN: { x: 646, y: 255 }, KY: { x: 662, y: 298 }, ME: { x: 895, y: 88 },
  MI: { x: 670, y: 180 }, MN: { x: 523, y: 117 },
  MO: { x: 545, y: 293 }, NE: { x: 424, y: 223 }, NV: { x: 140, y: 251 },
  NC: { x: 770, y: 328 }, ND: { x: 419, y: 93 }, OH: { x: 702, y: 234 },
  OK: { x: 438, y: 359 }, PA: { x: 785, y: 209 }, SC: { x: 756, y: 376 },
  SD: { x: 417, y: 164 }, TN: { x: 660, y: 338 }, UT: { x: 224, y: 248 },
  VA: { x: 771, y: 279 }, WI: { x: 576, y: 152 }, WY: { x: 300, y: 181 },
  WV: { x: 753, y: 261 },
  // Small states — offset labels with leader lines
  CT: { x: 920, y: 195, anchor: { x: 859, y: 179 } },
  RI: { x: 920, y: 208, anchor: { x: 878, y: 170 } },
  NJ: { x: 920, y: 230, anchor: { x: 836, y: 216 } },
  DE: { x: 920, y: 243, anchor: { x: 830, y: 239 } },
  MD: { x: 920, y: 256, anchor: { x: 801, y: 247 } },
  DC: { x: 920, y: 269, anchor: { x: 805, y: 249 } },
  NH: { x: 920, y: 140, anchor: { x: 869, y: 122 } },
  VT: { x: 920, y: 127, anchor: { x: 847, y: 127 } },
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
              r={hoveredPin === clinic.id ? 7 : 6}
              fill="hsla(230, 40%, 17%, 0.3)"
            />
            {/* Pin circle */}
            <circle
              cx={clinic.svgX}
              cy={clinic.svgY}
              r={hoveredPin === clinic.id ? 6.5 : 5}
              fill="hsl(230, 40%, 17%)"
              stroke="hsl(0, 0%, 100%)"
              strokeWidth="1.5"
            />
            {/* Pin inner dot */}
            <circle
              cx={clinic.svgX}
              cy={clinic.svgY}
              r={hoveredPin === clinic.id ? 2.5 : 2}
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
