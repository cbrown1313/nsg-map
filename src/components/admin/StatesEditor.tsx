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

type StateTier = Database['public']['Enums']['state_tier'];

const TIERS: StateTier[] = ['licensed', 'psypact', 'none', 'excluded'];

const StatesEditor = () => {
  const qc = useQueryClient();

  const { data: states = [], isLoading } = useQuery({
    queryKey: ['admin_state_configs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('state_configs').select('*').order('state_code');
      if (error) throw error;
      return data;
    },
  });

  const updateTier = useMutation({
    mutationFn: async ({ code, tier }: { code: string; tier: StateTier }) => {
      const { error } = await supabase.from('state_configs').update({ tier }).eq('state_code', code);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin_state_configs'] });
      qc.invalidateQueries({ queryKey: ['state_configs'] });
      toast({ title: 'State tier updated' });
    },
    onError: (e) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const updateLicenseOnly = useMutation({
    mutationFn: async ({ code, val }: { code: string; val: boolean }) => {
      const { error } = await supabase.from('state_configs').update({ is_license_only: val }).eq('state_code', code);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin_state_configs'] });
      qc.invalidateQueries({ queryKey: ['state_configs'] });
      toast({ title: 'State updated' });
    },
    onError: (e) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">State Configuration</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>State</TableHead>
            <TableHead>Tier</TableHead>
            <TableHead>License Only</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {states.map((s) => (
            <TableRow key={s.state_code}>
              <TableCell className="font-mono">{s.state_code}</TableCell>
              <TableCell>{STATE_NAMES[s.state_code] ?? s.state_code}</TableCell>
              <TableCell>
                <Select
                  value={s.tier}
                  onValueChange={(v) => updateTier.mutate({ code: s.state_code, tier: v as StateTier })}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIERS.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Checkbox
                  checked={s.is_license_only}
                  onCheckedChange={(v) => updateLicenseOnly.mutate({ code: s.state_code, val: !!v })}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default StatesEditor;
