import React, { useState } from 'react';
import { X } from 'lucide-react';

export default function TagInput({ tags = [], onChange, placeholder = 'Type and press Enter' }) {
  const [draft, setDraft] = useState('');

  const commit = () => {
    const values = draft
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    if (!values.length) return;
    const next = [...tags];
    values.forEach((value) => {
      if (!next.some((tag) => tag.toLowerCase() === value.toLowerCase())) next.push(value);
    });
    onChange(next);
    setDraft('');
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-transparent p-1 transition-colors focus-within:border-accent/40 hover:border-border/70">
      {tags.map((tag) => (
        <span
          key={tag}
          className="group flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-[12.5px] text-secondary-foreground"
        >
          {tag}
          <button
            type="button"
            onClick={() => onChange(tags.filter((item) => item !== tag))}
            className="text-muted-foreground transition-colors hover:text-destructive"
            aria-label={`Remove ${tag}`}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            commit();
          }
          if (e.key === 'Backspace' && !draft && tags.length) {
            onChange(tags.slice(0, -1));
          }
        }}
        onBlur={commit}
        placeholder={tags.length ? '' : placeholder}
        className="min-w-[130px] flex-1 bg-transparent px-1.5 py-1 text-[13.5px] outline-none placeholder:text-muted-foreground/60"
      />
    </div>
  );
}