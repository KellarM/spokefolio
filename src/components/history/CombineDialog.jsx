import React, { useState } from 'react';
import { Layers, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';

const mostCommon = (values) => {
  const counts = new Map();
  (values || []).filter(Boolean).forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
  let best = '';
  let bestCount = 0;
  counts.forEach((count, value) => {
    if (count > bestCount) {
      best = value;
      bestCount = count;
    }
  });
  return best;
};

const roleDates = (entry) => [entry.start_date, entry.end_date].filter(Boolean).join(' – ');

export default function CombineDialog({ entries = [], busy, onClose, onConfirm }) {
  const [organization, setOrganization] = useState(() => mostCommon((entries || []).map((entry) => entry.organization)));
  const [title, setTitle] = useState(() =>
    (entries || []).map((entry) => entry.title).filter(Boolean).join(' / ')
  );
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Combine {entries.length} positions</DialogTitle>
          <DialogDescription>
            These roles become one employer block with each role kept inside it. The entries you selected are replaced by the
            combined one.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="eyebrow">Employer</Label>
              <Input className="mt-2" value={organization} onChange={(e) => setOrganization(e.target.value)} />
            </div>
            <div>
              <Label className="eyebrow">Combined role line</Label>
              <Input className="mt-2" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <Label className="eyebrow">Timeframe from</Label>
              <Input
                className="mt-2"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="2012"
              />
            </div>
            <div>
              <Label className="eyebrow">Timeframe to</Label>
              <Input
                className="mt-2"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="2019"
              />
            </div>
          </div>

          <p className="text-[12.5px] leading-relaxed text-muted-foreground">
            Rough dates are fine, even just a year. Leave both blank and the combined role shows no timeframe at all.
          </p>

          <div className="rounded-xl border border-border/70 px-4 py-3">
            <p className="eyebrow">Roles kept inside</p>
            <ul className="mt-2 space-y-1.5">
              {entries.map((entry) => (
                <li key={entry.id} className="flex flex-wrap items-baseline justify-between gap-2 text-[13px]">
                  <span className="text-foreground">{entry.title || 'Untitled role'}</span>
                  <span className="text-muted-foreground">{roleDates(entry) || 'no dates'}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" className="rounded-full" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            className="rounded-full"
            disabled={busy || !organization.trim()}
            onClick={() => onConfirm({ organization, title, startDate, endDate })}
          >
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Layers className="mr-2 h-4 w-4" />}
            Combine positions
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}