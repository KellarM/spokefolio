import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import DictateButton from '@/components/common/DictateButton';

export default function TagInput({
  tags = [],
  onChange,
  placeholder = 'Type and press Enter',
  addLabel = 'Add',
  splitOnComma = true
}) {
  const [draft, setDraft] = useState('');

  const commitValue = (raw) => {
    const parts = (splitOnComma ? raw.split(',') : [raw])
      .map((value) => value.trim())
      .filter(Boolean);
    if (!parts.length) return;
    const next = [...tags];
    parts.forEach((value) => {
      if (!next.some((tag) => tag.toLowerCase() === value.toLowerCase())) {
        next.push(value);
      }
    });
    onChange(next);
    setDraft('');
  };

  const commit = () => commitValue(draft);

  return (
    <div
      className="space-y-2.5"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget) && draft.trim()) {
          commit();
        }
      }}
    >
      {tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="group flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-[12.5px] text-secondary-foreground"
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
        </div>
      )}

      <div className="flex items-center gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || (splitOnComma && e.key === ',')) {
              e.preventDefault();
              commit();
            }
          }}
          placeholder={placeholder}
          className="h-9 bg-background/60 text-[13.5px]"
        />
        <DictateButton
          label={null}
          onText={(transcript) =>
            setDraft((prev) => (prev ? `${prev}${splitOnComma ? ', ' : ' '}${transcript.trim()}` : transcript.trim()))
          }
        />
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={commit}
          disabled={!draft.trim()}
          className="shrink-0 rounded-full"
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          {addLabel}
        </Button>
      </div>
    </div>
  );
}