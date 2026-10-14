import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

const TYPES = {
  work: 'Work',
  project: 'Project',
  education: 'Education',
  certification: 'Certification',
  achievement: 'Achievement',
  testimonial: 'Praise',
  skill: 'Skill',
  other: 'Entry'
};

export default function EntryList({ entries = [], activeId, selectedIds = [], onToggle, onEdit, onDelete, onReview }) {
  if (!entries.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border px-6 py-10 text-center">
        <p className="text-[14px] text-muted-foreground">
          Nothing captured yet. Dictate your first role above and it will appear here.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-2.5">
      {entries.map((entry) => {
        const bullets = entry.grouped
          ? (entry.roles || []).flatMap((role) => role.accomplishments || [])
          : entry.accomplishments || [];
        const dates = [entry.start_date, entry.end_date].filter(Boolean).join(' – ');
        const selected = selectedIds.includes(entry.id);
        return (
          <li
            key={entry.id}
            className={`group flex items-start gap-4 rounded-2xl border bg-card px-5 py-4 transition-colors ${
              entry.id === activeId ? 'border-accent/50' : 'border-border/70 hover:border-border'
            }`}
          >
            <Checkbox
              checked={selected}
              onCheckedChange={() => onToggle(entry)}
              aria-label={`Select ${entry.title || 'entry'}`}
              className="mt-1 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[10.5px] uppercase tracking-[0.1em] text-muted-foreground">
                  {TYPES[entry.entry_type] || 'Entry'}
                </span>
                {entry.grouped && (
                  <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10.5px] uppercase tracking-[0.1em] text-accent">
                    {(entry.roles || []).length} roles inside
                  </span>
                )}
                {entry.status === 'draft' && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10.5px] uppercase tracking-[0.1em] text-amber-800">
                    Draft
                  </span>
                )}
              </div>
              <p className="mt-2 truncate font-heading text-[17px]">{entry.title || 'Untitled entry'}</p>
              <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
                {[entry.organization, entry.location, dates].filter(Boolean).join(' · ')}
              </p>
              {bullets[0] && <p className="mt-2 line-clamp-1 text-[13px] text-muted-foreground/90">• {bullets[0]}</p>}
              {onReview && <Button variant="secondary" size="sm" className="mt-3 rounded-full" onClick={() => onReview(entry)}>Review & organize</Button>}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <span className="mr-1 hidden text-[11.5px] text-muted-foreground sm:inline">
                {bullets.length} {bullets.length === 1 ? 'bullet' : 'bullets'}
              </span>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => onEdit(entry)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive"
                onClick={() => onDelete(entry)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}