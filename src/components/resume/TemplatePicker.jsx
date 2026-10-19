import React, { useState } from 'react';
import { Camera, Check, ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RESUME_TEMPLATES, getTemplate } from '@/lib/resumeTemplates';

// A miniature of a style's look: the accent, the name rule and a couple of text lines.
function MiniStyle({ template, className = '' }) {
  return (
    <span className={`block shrink-0 rounded border border-border/60 p-1 ${template.mini.sheet} ${className}`}>
      <span className="flex items-center gap-0.5">
        <span className={`h-1.5 w-1 rounded-[1px] ${template.mini.accent}`} />
        <span className={`h-1 w-4 rounded-full ${template.mini.ink}`} />
      </span>
      <span className={`mt-1 block h-px w-full ${template.mini.rule}`} />
      <span className="mt-1 block">
        <span className={`block h-0.5 w-full rounded-full ${template.mini.line}`} />
        <span className={`mt-0.5 block h-0.5 w-3/4 rounded-full ${template.mini.line}`} />
      </span>
    </span>
  );
}

// The whole catalogue in one dropdown, so choosing a style costs a single line on the page.
export default function TemplatePicker({ value, onChange, variant = 'default', className = '' }) {
  const [open, setOpen] = useState(false);
  const selected = getTemplate(value);

  const choose = (id) => {
    setOpen(false);
    if (id !== selected.id) onChange(id);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {variant === 'executive' ? (
          <button type="button" className={`mec-style ${className}`}>
            <p>{selected.name}</p>
            <small>{selected.blurb}</small>
          </button>
        ) : (
          <button
            type="button"
            className={`flex w-full items-center justify-between gap-3 rounded-lg border border-input bg-transparent px-2.5 py-2 text-left shadow-sm transition-colors hover:border-accent/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${className}`}
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <MiniStyle template={selected} className="h-7 w-6" />
              <span className="min-w-0">
                <span className="block truncate text-[15px] font-medium lg:text-[13.5px]">{selected.name}</span>
                <span className="block truncate text-[13px] text-muted-foreground lg:text-[11.5px]">{selected.blurb}</span>
              </span>
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </button>
        )}
      </PopoverTrigger>

      <PopoverContent align="start" className="w-[340px] max-w-[calc(100vw-2rem)] p-1.5">
        <p className="eyebrow px-2 py-1.5">Résumé style</p>
        <div className="max-h-[330px] overflow-y-auto pr-0.5">
          {RESUME_TEMPLATES.map((template) => {
            const isSelected = template.id === selected.id;
            return (
              <button
                key={template.id}
                type="button"
                onClick={() => choose(template.id)}
                className={`flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors ${
                  isSelected ? 'bg-accent/10' : 'hover:bg-secondary'
                }`}
              >
                <MiniStyle template={template} className="h-9 w-7" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium lg:text-[13px]">{template.name}</span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-[13px] text-muted-foreground lg:text-[11px]">
                    {template.config.photo && <Camera className="h-2.5 w-2.5 shrink-0" strokeWidth={2} />}
                    <span className="truncate">{template.blurb}</span>
                  </span>
                </span>
                {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-accent" strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}