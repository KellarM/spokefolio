import React, { useEffect, useId, useRef, useState } from 'react';
import { HelpCircle } from 'lucide-react';

// The small help symbol that sits beside an action.
// Click it and a window opens with the steps in order. Click the symbol
// again, click anywhere outside, or press Escape, and it closes. It never
// takes over the page - the work stays visible behind it.
export default function InstructionPopover({
  steps = [],
  sections = [],
  title,
  intro,
  align = 'start',
  className = ''
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const buttonRef = useRef(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        if (buttonRef.current) buttonRef.current.focus();
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const hasContent = steps.length > 0 || sections.length > 0;
  if (!hasContent) return null;

  return (
    <span ref={wrapRef} className={`relative inline-flex align-middle ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={title || 'How this works'}
        onClick={() => setOpen((value) => !value)}
        className={`grid h-[22px] w-[22px] place-items-center rounded-full border transition-colors ${
          open
            ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#D4AF37]'
            : 'border-border/70 text-muted-foreground hover:border-[#D4AF37]/60 hover:text-[#D4AF37]'
        }`}
      >
        <HelpCircle className="h-[13px] w-[13px]" aria-hidden="true" />
      </button>

      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label={title || 'How this works'}
          className={`absolute top-[30px] z-50 max-w-[92vw] rounded-xl border border-[#D4AF37]/30 bg-[#0B0F17] p-4 text-left shadow-[0_18px_50px_rgba(0,0,0,0.55)] ${
            sections.length ? 'max-h-[70vh] w-[440px] overflow-y-auto pr-3' : 'w-[320px]'
          } ${align === 'end' ? 'right-0' : 'left-0'}`}
        >
          {title && (
            <p className="font-heading text-[14px] leading-snug text-[#F9FAFB]">{title}</p>
          )}
          {intro && (
            <p className="mt-1 font-body text-[12.5px] leading-relaxed text-[#F9FAFB]/60">{intro}</p>
          )}
          {sections.length > 0 && (
            <div className="mt-3 space-y-3.5">
              {sections.map((section) => (
                <div key={section.heading}>
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#D4AF37]/85">
                    {section.heading}
                  </p>
                  <ul className="mt-1.5 space-y-1.5">
                    {section.items.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span aria-hidden="true" className="mt-[7px] h-[3px] w-[3px] shrink-0 rounded-full bg-[#F9FAFB]/45" />
                        <span className="font-body text-[12.5px] leading-relaxed text-[#F9FAFB]/85">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {steps.length > 0 && (
          <ol className="mt-3 space-y-2.5">
            {steps.map((step, index) => (
              <li key={step} className="flex gap-2.5">
                <span className="mt-[1px] grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border border-[#D4AF37]/40 font-mono text-[10px] text-[#D4AF37]">
                  {index + 1}
                </span>
                <span className="font-body text-[13px] leading-relaxed text-[#F9FAFB]/85">{step}</span>
              </li>
            ))}
          </ol>
          )}
        </div>
      )}
    </span>
  );
}
