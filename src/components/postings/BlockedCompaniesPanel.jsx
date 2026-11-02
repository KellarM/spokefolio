import React, { useState } from 'react';
import { Flag, Loader2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { flagCompany, normaliseCompany } from '@/lib/blockedCompanies';

// The list behind the flags. Every employer here is skipped by the job search
// and refused by the importer. It fills itself from the flag buttons; the
// manual field exists for the ones that never surface in a search at all.
export default function BlockedCompaniesPanel({ blocked, onChange }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const active = (blocked || []).filter((entry) => entry?.active !== false);

  const add = async (event) => {
    event.preventDefault();
    const value = name.trim();
    if (!value || busy) return;
    setBusy(true);
    try {
      const saved = await flagCompany({ company: value, url: '', title: '', reason: reason.trim(), source: 'manual', blocked });
      onChange?.(saved);
      setName('');
      setReason('');
      toast({ title: `${saved.name || value} blocked` });
    } catch (error) {
      toast({ title: 'Could not add that employer', description: error?.message, variant: 'destructive' });
    }
    setBusy(false);
  };

  const remove = async (entry) => {
    setBusy(true);
    try {
      await base44.entities.BlockedCompany.delete(entry.id);
      onChange?.(null);
      toast({ title: `${entry.name} can appear in searches again` });
    } catch (error) {
      toast({ title: 'Could not remove that employer', description: error?.message, variant: 'destructive' });
    }
    setBusy(false);
  };

  return (
    <section className="rounded-2xl border border-border/70 bg-card px-4 py-4 sm:px-5" data-tour="blocked-employers">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow">Employers you never want to see again</p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
            {active.length === 0
              ? 'Flag a posting and that employer stops appearing in searches. Use the flag on any result.'
              : `${active.length} blocked. The search skips them and the importer refuses them.`}
          </p>
        </div>
        <Button variant="secondary" size="sm" className="rounded-full" onClick={() => setOpen((value) => !value)}>
          <Flag className="mr-1.5 h-3.5 w-3.5" /> {open ? 'Hide list' : 'Manage list'}
        </Button>
      </div>

      {open && (
        <div className="mt-4 space-y-3">
          <form onSubmit={add} className="flex flex-wrap items-center gap-2">
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Employer name"
              className="h-9 w-[220px]"
            />
            <Input
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Why (optional)"
              className="h-9 w-[220px]"
            />
            <Button type="submit" size="sm" className="rounded-full" disabled={busy || !name.trim()}>
              {busy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Plus className="mr-1.5 h-3.5 w-3.5" />}
              Add
            </Button>
          </form>

          {active.length > 0 ? (
            <ul className="divide-y divide-border/60 rounded-xl border border-border/60">
              {active.map((entry) => (
                <li key={entry.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-medium text-foreground">{entry.name}</p>
                    <p className="text-[11.5px] text-muted-foreground">
                      {[
                        normaliseCompany(entry.name),
                        entry.domains?.[0] || '',
                        entry.reason || '',
                        Number(entry.flagged_count || 1) > 1 ? `flagged ${entry.flagged_count} times` : '',
                        (entry.aliases || []).length ? `${(entry.aliases || []).length} variant${(entry.aliases || []).length === 1 ? '' : 's'}` : ''
                      ].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full text-muted-foreground hover:text-destructive"
                    onClick={() => remove(entry)}
                    disabled={busy}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[12.5px] text-muted-foreground">Nothing on the list yet.</p>
          )}
        </div>
      )}
    </section>
  );
}
