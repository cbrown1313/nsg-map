import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { STATE_NAMES } from '@/data/locations';
import type { Database } from '@/integrations/supabase/types';
import StatesPreviewMap from './StatesPreviewMap';

type StateTier = Database['public']['Enums']['state_tier'];
type StateRow = {
  state_code: string;
  tier: StateTier;
  is_license_only: boolean;
};

const TIERS: StateTier[] = ['licensed', 'psypact', 'none', 'excluded'];

const TIER_LABEL: Record<StateTier, string> = {
  licensed: 'Licensed',
  psypact: 'PSYPACT',
  none: 'No coverage',
  excluded: 'Excluded',
};

const StatesEditor = () => {
  const qc = useQueryClient();

  const { data: serverStates = [], isLoading } = useQuery({
    queryKey: ['admin_state_configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('state_configs')
        .select('*')
        .order('state_code');
      if (error) throw error;
      return data as StateRow[];
    },
  });

  // Local draft — initialised from server data, edited locally, published in batch.
  const [draft, setDraft] = useState<StateRow[]>([]);

  useEffect(() => {
    setDraft(serverStates);
  }, [serverStates]);

  const dirtyCodes = useMemo(() => {
    const serverMap = new Map(serverStates.map((s) => [s.state_code, s]));
    return new Set(
      draft
        .filter((d) => {
          const s = serverMap.get(d.state_code);
          return !s || s.tier !== d.tier || s.is_license_only !== d.is_license_only;
        })
        .map((d) => d.state_code),
    );
  }, [draft, serverStates]);

  const tiersForPreview = useMemo(() => {
    const map: Record<string, StateTier> = {};
    for (const s of draft) map[s.state_code] = s.tier;
    return map;
  }, [draft]);

  const updateRow = (code: string, patch: Partial<StateRow>) => {
    setDraft((prev) =>
      prev.map((s) => (s.state_code === code ? { ...s, ...patch } : s)),
    );
  };

  const publish = useMutation({
    mutationFn: async () => {
      const changes = draft.filter((d) => dirtyCodes.has(d.state_code));
      // Sequential updates keep RLS-friendly behaviour and surface the first error clearly.
      for (const row of changes) {
        const { error } = await supabase
          .from('state_configs')
          .update({ tier: row.tier, is_license_only: row.is_license_only })
          .eq('state_code', row.state_code);
        if (error) throw error;
      }
      return changes.length;
    },
    onSuccess: (count) => {
      qc.invalidateQueries({ queryKey: ['admin_state_configs'] });
      qc.invalidateQueries({ queryKey: ['state_configs'] });
      toast({ title: `Published ${count} state ${count === 1 ? 'change' : 'changes'}` });
    },
    onError: (e) =>
      toast({ title: 'Error publishing', description: e.message, variant: 'destructive' }),
  });

  const discard = () => setDraft(serverStates);

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;

  const dirtyCount = dirtyCodes.size;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">State Configuration</h2>
          <p className="text-sm text-muted-foreground">
            Edit tiers below. Changes are previewed live and only saved when you publish.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {dirtyCount === 0 ? 'No unsaved changes' : `${dirtyCount} unsaved`}
          </span>
          <Button variant="outline" size="sm" onClick={discard} disabled={dirtyCount === 0}>
            Discard
          </Button>
          <Button
            size="sm"
            onClick={() => publish.mutate()}
            disabled={dirtyCount === 0 || publish.isPending}
          >
            {publish.isPending ? 'Publishing…' : 'Publish changes'}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-foreground">Live preview</h3>
        <StatesPreviewMap tiers={tiersForPreview} />
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <LegendSwatch color="hsl(180, 55%, 23%)" label="Licensed" />
          <LegendSwatch color="hsl(210, 50%, 53%)" label="PSYPACT" />
          <LegendSwatch color="hsl(0, 0%, 94%)" label="No coverage / Excluded" />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>State</TableHead>
            <TableHead>Tier</TableHead>
            <TableHead>License Only</TableHead>
            <TableHead className="w-20">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {draft.map((s) => {
            const isDirty = dirtyCodes.has(s.state_code);
            return (
              <TableRow key={s.state_code} className={isDirty ? 'bg-accent/40' : ''}>
                <TableCell className="font-mono">{s.state_code}</TableCell>
                <TableCell>{STATE_NAMES[s.state_code] ?? s.state_code}</TableCell>
                <TableCell>
                  <Select
                    value={s.tier}
                    onValueChange={(v) => updateRow(s.state_code, { tier: v as StateTier })}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIERS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {TIER_LABEL[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Checkbox
                    checked={s.is_license_only}
                    onCheckedChange={(v) =>
                      updateRow(s.state_code, { is_license_only: !!v })
                    }
                  />
                </TableCell>
                <TableCell>
                  {isDirty ? (
                    <span className="text-xs font-medium text-primary">Edited</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

const LegendSwatch = ({ color, label }: { color: string; label: string }) => (
  <span className="inline-flex items-center gap-1.5">
    <span
      className="inline-block h-3 w-3 rounded-sm border border-border"
      style={{ backgroundColor: color }}
    />
    {label}
  </span>
);

export default StatesEditor;
