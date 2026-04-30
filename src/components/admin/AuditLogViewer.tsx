import { useMemo, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Collapsible, CollapsibleContent,
} from '@/components/ui/collapsible';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

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

const PAGE_SIZE_OPTIONS = [25, 50, 100];

const formatTimestamp = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
};

const diffFields = (
  oldData: Record<string, unknown> | null,
  newData: Record<string, unknown> | null,
) => {
  const keys = new Set<string>([
    ...Object.keys(oldData ?? {}),
    ...Object.keys(newData ?? {}),
  ]);
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

type PageResult = { rows: AuditEntry[]; count: number };

const AuditLogViewer = () => {
  const [tableFilter, setTableFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [pageSize, setPageSize] = useState<number>(25);
  const [page, setPage] = useState<number>(0);

  const resetAndSet = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(0);
  };

  const { data, isLoading, refetch, isFetching } = useQuery<PageResult>({
    queryKey: ['audit_log', tableFilter, actionFilter, page, pageSize],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const from = page * pageSize;
      const to = from + pageSize - 1;

      const client = supabase as unknown as {
        from: (t: string) => {
          select: (s: string, opts?: { count?: 'exact' | 'planned' | 'estimated' }) => {
            order: (c: string, o: { ascending: boolean }) => {
              range: (f: number, t: number) => Promise<{
                data: AuditEntry[] | null;
                error: Error | null;
                count: number | null;
              }>;
              eq: (col: string, val: string) => {
                order: (c: string, o: { ascending: boolean }) => {
                  range: (f: number, t: number) => Promise<{
                    data: AuditEntry[] | null;
                    error: Error | null;
                    count: number | null;
                  }>;
                };
              };
            };
            eq: (col: string, val: string) => {
              eq: (col: string, val: string) => {
                order: (c: string, o: { ascending: boolean }) => {
                  range: (f: number, t: number) => Promise<{
                    data: AuditEntry[] | null;
                    error: Error | null;
                    count: number | null;
                  }>;
                };
              };
              order: (c: string, o: { ascending: boolean }) => {
                range: (f: number, t: number) => Promise<{
                  data: AuditEntry[] | null;
                  error: Error | null;
                  count: number | null;
                }>;
              };
            };
          };
        };
      };

      // Build the query dynamically with filters applied server-side.
      let query: any = client.from('audit_log').select('*', { count: 'exact' });
      if (tableFilter !== 'all') query = query.eq('table_name', tableFilter);
      if (actionFilter !== 'all') query = query.eq('action', actionFilter);
      const { data: rows, error, count } = await query
        .order('changed_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      return { rows: rows ?? [], count: count ?? 0 };
    },
  });

  const rows = data?.rows ?? [];
  const totalCount = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const showingFrom = totalCount === 0 ? 0 : page * pageSize + 1;
  const showingTo = Math.min(totalCount, page * pageSize + rows.length);

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Audit Log</h2>
          <p className="text-sm text-muted-foreground">
            All recorded changes to clinic locations and state configurations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={tableFilter} onValueChange={resetAndSet(setTableFilter)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All tables" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tables</SelectItem>
              <SelectItem value="clinic_locations">Clinic locations</SelectItem>
              <SelectItem value="state_configs">State configs</SelectItem>
            </SelectContent>
          </Select>
          <Select value={actionFilter} onValueChange={resetAndSet(setActionFilter)}>
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
          <Select
            value={String(pageSize)}
            onValueChange={(v) => resetAndSet(setPageSize)(Number(v))}
          >
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>{n} / page</SelectItem>
              ))}
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

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No audit entries match these filters yet.
        </p>
      ) : (
        <>
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
              {rows.map((entry) => (
                <AuditRow key={entry.id} entry={entry} />
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-muted-foreground">
              Showing {showingFrom}–{showingTo} of {totalCount}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0 || isFetching}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <span className="text-sm tabular-nums">
                Page {page + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1 || isFetching}
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const AuditRow = ({ entry }: { entry: AuditEntry }) => {
  const [open, setOpen] = useState(false);
  const changes = useMemo(
    () => diffFields(entry.old_data, entry.new_data),
    [entry.old_data, entry.new_data],
  );

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
