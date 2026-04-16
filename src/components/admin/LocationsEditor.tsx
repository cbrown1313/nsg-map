import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

type ClinicRow = Tables<'clinic_locations'>;

const emptyForm: TablesInsert<'clinic_locations'> = {
  id: '', name: '', city: '', state: '', slug: '', external_url: '', svg_x: 0, svg_y: 0,
};

const LocationsEditor = () => {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TablesInsert<'clinic_locations'>>(emptyForm);

  const { data: locations = [], isLoading } = useQuery({
    queryKey: ['admin_clinic_locations'],
    queryFn: async () => {
      const { data, error } = await supabase.from('clinic_locations').select('*').order('name');
      if (error) throw error;
      return data;
    },
  });

  const upsert = useMutation({
    mutationFn: async (row: TablesInsert<'clinic_locations'>) => {
      if (editingId) {
        const { error } = await supabase.from('clinic_locations').update({
          name: row.name, city: row.city, state: row.state, slug: row.slug,
          external_url: row.external_url || null, svg_x: row.svg_x, svg_y: row.svg_y,
        }).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('clinic_locations').insert(row);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin_clinic_locations'] });
      qc.invalidateQueries({ queryKey: ['clinic_locations'] });
      toast({ title: editingId ? 'Location updated' : 'Location added' });
      closeDialog();
    },
    onError: (e) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('clinic_locations').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin_clinic_locations'] });
      qc.invalidateQueries({ queryKey: ['clinic_locations'] });
      toast({ title: 'Location deleted' });
    },
    onError: (e) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const openEdit = (loc: ClinicRow) => {
    setEditingId(loc.id);
    setForm({
      id: loc.id, name: loc.name, city: loc.city, state: loc.state, slug: loc.slug,
      external_url: loc.external_url ?? '', svg_x: loc.svg_x, svg_y: loc.svg_y,
    });
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    upsert.mutate(form);
  };

  const set = (field: keyof typeof form, value: string | number) =>
    setForm((f) => ({ ...f, [field]: value }));

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Clinic Locations</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Add Location</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Location' : 'Add Location'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>ID</Label><Input value={form.id} onChange={(e) => set('id', e.target.value)} required disabled={!!editingId} /></div>
                <div><Label>Name</Label><Input value={form.name} onChange={(e) => set('name', e.target.value)} required /></div>
                <div><Label>City</Label><Input value={form.city} onChange={(e) => set('city', e.target.value)} required /></div>
                <div><Label>State</Label><Input value={form.state} onChange={(e) => set('state', e.target.value.toUpperCase())} maxLength={2} required /></div>
                <div><Label>Slug</Label><Input value={form.slug} onChange={(e) => set('slug', e.target.value)} required /></div>
                <div><Label>External URL</Label><Input value={form.external_url ?? ''} onChange={(e) => set('external_url', e.target.value)} /></div>
                <div><Label>SVG X</Label><Input type="number" value={form.svg_x} onChange={(e) => set('svg_x', Number(e.target.value))} required /></div>
                <div><Label>SVG Y</Label><Input type="number" value={form.svg_y} onChange={(e) => set('svg_y', Number(e.target.value))} required /></div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
                <Button type="submit" disabled={upsert.isPending}>{editingId ? 'Save' : 'Add'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>City</TableHead>
            <TableHead>State</TableHead>
            <TableHead>External URL</TableHead>
            <TableHead>SVG (X, Y)</TableHead>
            <TableHead className="w-24">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {locations.map((loc) => (
            <TableRow key={loc.id}>
              <TableCell className="font-medium">{loc.name}</TableCell>
              <TableCell>{loc.city}</TableCell>
              <TableCell>{loc.state}</TableCell>
              <TableCell className="max-w-[200px] truncate text-xs">{loc.external_url || '—'}</TableCell>
              <TableCell>{loc.svg_x}, {loc.svg_y}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(loc)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(loc.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default LocationsEditor;
