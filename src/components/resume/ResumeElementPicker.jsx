import React, { useState } from 'react';
import { Palette } from 'lucide-react';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import ElementStylePanel from '@/components/resume/ElementStylePanel';
import { ELEMENTS } from '@/lib/resumeElementStyles';

// One restyleable part of the résumé. In edit mode it carries a small chip — and, for parts
// that are plain text, is clickable across the whole element — which opens the controls for
// that part. Every instance of the same part follows the one setting: restyle one section
// heading and they all change.
export default function ResumeElementPicker({
  elementId,
  token,
  overrides,
  onUpdate,
  surface = false,
  className = '',
  children
}) {
  const [open, setOpen] = useState(false);
  const spec = ELEMENTS[elementId];

  // The read-only preview passes no update handler: there it is plain content.
  if (!onUpdate || !spec) return children;

  const panel = (
    <PopoverContent align="end" side="bottom" sideOffset={6} className="z-[60] w-72 space-y-3.5 p-4">
      <div>
        <p className="font-heading text-[16px] text-foreground">{spec.label}</p>
        <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">{spec.hint}</p>
      </div>
      <ElementStylePanel
        elementId={elementId}
        token={token}
        overrides={overrides}
        onChange={(patch) => onUpdate(elementId, patch)}
      />
    </PopoverContent>
  );

  // No content of its own: a chip that sits beside the section, used where the part is an
  // editing field rather than document text.
  if (!children) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <button
            type="button"
            title={`Restyle the ${spec.label.toLowerCase()}`}
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 px-2.5 py-1 text-[11.5px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <Palette className="h-3 w-3 text-accent" />
            {spec.label}
          </button>
        </PopoverAnchor>
        {panel}
      </Popover>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <span
          className={`group/e relative block max-w-full ${
            surface ? 'cursor-pointer rounded-sm transition-shadow hover:ring-1 hover:ring-accent/40' : ''
          } ${className}`}
          onClick={
            surface
              ? (event) => {
                  // Anything already interactive inside keeps its own click.
                  if (event.target.closest('button, input, textarea, select, a')) return;
                  setOpen(true);
                }
              : undefined
          }
        >
          {children}
          <button
            type="button"
            title={`Restyle the ${spec.label.toLowerCase()}`}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setOpen(true);
            }}
            className="absolute -top-3 right-0 z-20 hidden items-center gap-1 rounded-full border border-accent/50 bg-card px-2 py-0.5 text-[11px] font-medium text-foreground shadow-sm group-hover/e:inline-flex"
          >
            <Palette className="h-3 w-3 text-accent" />
            {spec.label}
          </button>
        </span>
      </PopoverAnchor>
      {panel}
    </Popover>
  );
}