import { US_STATES } from '@/data/us-states';
import { STATE_NAMES, type StateTier } from '@/data/locations';

const STATE_FILL: Record<StateTier, string> = {
  licensed: 'hsl(180, 55%, 23%)',
  psypact: 'hsl(210, 50%, 53%)',
  none: 'hsl(0, 0%, 94%)',
  excluded: 'hsl(0, 0%, 94%)',
};

interface Props {
  /** Map of state_code -> tier (draft values, including unsaved edits) */
  tiers: Record<string, StateTier>;
}

const StatesPreviewMap = ({ tiers }: Props) => {
  return (
    <svg
      viewBox="0 0 960 600"
      className="w-full h-auto rounded-md border border-border bg-card"
      role="img"
      aria-label="State tier preview"
    >
      {US_STATES.map((state) => {
        const tier: StateTier = tiers[state.id] ?? 'none';
        return (
          <path
            key={state.id}
            d={state.shape}
            fill={STATE_FILL[tier]}
            stroke="hsl(0, 0%, 100%)"
            strokeWidth="1.5"
          >
            <title>{`${STATE_NAMES[state.id] ?? state.id} — ${tier}`}</title>
          </path>
        );
      })}
    </svg>
  );
};

export default StatesPreviewMap;
