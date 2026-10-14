import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function BulletListEditor({ items = [], onChange, placeholder = 'Add a bullet' }) {
  const [draft, setDraft] = useState('');

  const update = (index, value) => {
    const next = [...items];
    next[index] = value;
    onChange(next);
  };

  const remove = (index) => onChange(items.filter((_, i) => i !== index));

  const add = () => {
    const value = draft.trim();
    if (!value) return;
    onChange([...items, value]);
    setDraft('');
  };

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="group flex items-start gap-2">
          <span className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent/60" />
          <textarea
            rows={Math.max(1, Math.ceil((item || '').length / 78))}
            value={item}
            onChange={(e) => update(index, e.target.value)}
            className="w-full resize-none rounded-md border border-transparent bg-transparent px-2 py-1.5 text-[14.5px] leading-relaxed hover:border-border/70 focus:border-accent/40 focus:bg-card focus:outline-none"
          />
          <button
            type="button"
            onClick={() => remove(index)}
            className="mt-1.5 rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
            aria-label="Remove bullet"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <div className="flex items-center gap-2 pl-4">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className="h-9 text-sm"
        />
        <Button type="button" size="sm" variant="secondary" onClick={add} className="shrink-0">
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}