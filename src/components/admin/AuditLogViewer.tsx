import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronRight, RefreshCw } from 'lucide-react';

type AuditEntry = {
  id: string;
  table_name: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  record_id: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  changed_by: string | null;
  changed_by_email: string | null;
  changed_at: string;
};

const TABLE_LABEL: Record<string, string> = {
  clinic_locations: 'Clinic location',
  state_configs: 'State config',
};

const ACTION_LABEL: Record<AuditEntry['action'], string> = {
  INSERT: 'Added',
  UPDATE: 'Edited',
  DELETE: 'Removed',
};

const ACTION_TONE: Record<AuditEntry['action'], string> = {
  INSERT: 'text-emerald-600',
  UPDATE: 'text-amber-600',
  DELETE: 'text-destructive',
};

const formatTimestamp = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
};

/** Returns the keys that changed between old and new, with both values. */
const diffFields = (
  oldData: Record<string, unknown> | null,
  newData: Record<string, unknown> | null,
) => {
  const keys = new Set<string>([
    ...Object.keys(oldData ?? {}),
    ...Object.keys(newData ?? {}),
  ]);
  // Skip noisy timestamp / id columns
  const skip = new Set(['created_at', 'updated_at']);
  const changes: { field: string; before: unknown; after: unknown }[] = [];
  keys.forEach((k) => {
    if (skip.has(k)) return;
    const before = oldData?.[k];
    const after = newData?.[k];
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      changes.push({ field: k, before, after });
    }
  });
  return changes;
};

const renderValue = (v: unknown) => {
  if (v === null || v === undefined) return <span className="text-muted-foreground">—</span>;
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
};

const AuditLogViewer = () => {
  const [tableFilter, setTableFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');

  const { data: entries = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['audit_log'],
    queryFn: async (): Promise<AuditEntry[]> => {
      // audit_log isn't in the generated types yet; cast through unknown.
      const { data, error } = await (supabase as unknown as {
        from: (t: string) => {
          select: (s: string) => {
            order: (c: string, o: { ascending: boolean }) => {
              limit: (n: number) => Promise<{ data: AuditEntry[] | null; error: Error | null }>;
            };
          };
        };
      })
        .from('audit_log')
        .select('*')
        .order('changed_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (tableFilter !== 'all' && e.table_name !== tableFilter) return false;
      if (actionFilter !== 'all' && e.action !== actionFilter) return false;
      return true;
    });
  }, [entries, tableFilter, actionFilter]);

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Audit Log</h2>
          <p className="text-sm text-muted-foreground">
            Most recent 200 changes to clinic locations and state configurations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={tableFilter} onValueChange={setTableFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All tables" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tables</SelectItem>
              <SelectItem value="clinic_locations">Clinic locations</SelectItem>
              <SelectItem value="state_configs">State configs</SelectItem>
            </SelectContent>
          </Select>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              <SelectItem value="INSERT">Added</SelectItem>
              <SelectItem value="UPDATE">Edited</SelectItem>
              <SelectItem value="DELETE">Removed</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No audit entries match these filters yet.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead>When</TableHead>
              <TableHead>Who</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Table</TableHead>
              <TableHead>Record</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((entry) => (
              <AuditRow key={entry.id} entry={entry} />
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

const AuditRow = ({ entry }: { entry: AuditEntry }) => {
  const [open, setOpen] = useState(false);
  const changes = diffFields(entry.old_data, entry.new_data);

  return (
    <>
      <TableRow className="cursor-pointer" onClick={() => setOpen((v) => !v)}>
        <TableCell>
          <ChevronRight
            className={`h-4 w-4 transition-transform ${open ? 'rotate-90' : ''}`}
          />
        </TableCell>
        <TableCell className="whitespace-nowrap text-sm">
          {formatTimestamp(entry.changed_at)}
        </TableCell>
        <TableCell className="text-sm">
          {entry.changed_by_email ?? (
            <span className="text-muted-foreground">System</span>
          )}
        </TableCell>
        <TableCell>
          <span className={`text-sm font-medium ${ACTION_TONE[entry.action]}`}>
            {ACTION_LABEL[entry.action]}
          </span>
        </TableCell>
        <TableCell className="text-sm">
          {TABLE_LABEL[entry.table_name] ?? entry.table_name}
        </TableCell>
        <TableCell className="font-mono text-xs">{entry.record_id}</TableCell>
      </TableRow>
      {open && (
        <TableRow>
          <TableCell colSpan={6} className="bg-muted/30">
            <Collapsible open={open}>
              <CollapsibleContent>
                <AuditDetails entry={entry} changes={changes} />
              </CollapsibleContent>
            </Collapsible>
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

const AuditDetails = ({
  entry,
  changes,
}: {
  entry: AuditEntry;
  changes: { field: string; before: unknown; after: unknown }[];
}) => {
  if (entry.action === 'INSERT') {
    return (
      <div className="py-2 text-sm">
        <p className="font-medium mb-2">New record values</p>
        <FieldGrid data={entry.new_data} />
      </div>
    );
  }

  if (entry.action === 'DELETE') {
    return (
      <div className="py-2 text-sm">
        <p className="font-medium mb-2">Removed record values</p>
        <FieldGrid data={entry.old_data} />
      </div>
    );
  }

  // UPDATE — show field-level diff
  if (changes.length === 0) {
    return <p className="py-2 text-sm text-muted-foreground">No tracked field changes.</p>;
  }

  return (
    <div className="py-2 text-sm">
      <p className="font-medium mb-2">Changed fields</p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-32">Field</TableHead>
            <TableHead>Before</TableHead>
            <TableHead>After</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {changes.map((c) => (
            <TableRow key={c.field}>
              <TableCell className="font-mono text-xs">{c.field}</TableCell>
              <TableCell className="text-muted-foreground">{renderValue(c.before)}</TableCell>
              <TableCell>{renderValue(c.after)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

const FieldGrid = ({ data }: { data: Record<string, unknown> | null }) => {
  if (!data) return null;
  const skip = new Set(['created_at', 'updated_at']);
  const entries = Object.entries(data).filter(([k]) => !skip.has(k));
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-1">
      {entries.map(([k, v]) => (
        <div key={k} className="flex gap-2">
          <span className="font-mono text-xs text-muted-foreground">{k}:</span>
          <span className="text-sm">{renderValue(v)}</span>
        </div>
      ))}
    </div>
  );
};

export default AuditLogViewer;
