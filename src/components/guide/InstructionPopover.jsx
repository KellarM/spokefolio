import React, { useEffect, useId, useRef, useState } from 'react';
import { HelpCircle } from 'lucide-react';

// The help control. Two looks, deliberately:
//
// - steps: a compact dark card for a three-step action.
// - sections: a résumé sheet, because a page guide is a document about the
//   page. It borrows the Editorial Navy template exactly - cream sheet, brass
//   rule, navy uppercase section headings, body underneath - so the guide
//   looks like the thing the app produces rather than like a tooltip.
//
// Either way it opens in place: click the symbol again, click outside, or
// press Escape, and it closes. The work stays visible behind it.
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

  const isDocument = sections.length > 0;
  if (!isDocument && !steps.length) return null;

  const anchor = align === 'end' ? 'right-0' : 'left-0';

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

      {/* A page, not a popup: the sheet matches the 1200px content column the
          rest of the app is laid out on, so it reads the same width as the page
          behind it. Fixed and centred, because a page-width panel cannot hang
          off a 22px icon without crossing the viewport edge. */}
      {open && isDocument && (
        <div
          id={panelId}
          role="dialog"
          aria-label={title || 'How this works'}
          className="fixed left-1/2 top-[96px] z-[60] max-h-[80vh] w-[min(1200px,calc(100vw-2rem))] -translate-x-1/2 overflow-y-auto rounded-lg border border-[#B0854A]/45 bg-[#FDFCFA] px-8 py-7 text-left shadow-[0_40px_90px_rgba(0,0,0,0.7)] sm:px-12 sm:py-10"
        >
          {/* The résumé header: serif name, brass bar, brass italic line. */}
          <div className="border-l-[5px] border-l-[#B0854A] pl-4">
            <p className="font-heading text-[30px] leading-tight tracking-tight text-[#1B4159] sm:text-[36px]">{title}</p>
            {intro && (
              <p className="mt-1.5 text-[12.5px] italic leading-relaxed text-[#8A6531]">{intro}</p>
            )}
          </div>

          <div className="mt-6 grid gap-x-12 gap-y-5 lg:grid-cols-2">
            {sections.map((section) => (
              <section key={section.heading}>
                <div className="border-b border-b-[#B0854A]/60 pb-1.5">
                  <h3 className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[#1B4159]">
                    {section.heading}
                  </h3>
                </div>
                <div className="mt-2 space-y-1.5">
                  {section.items.map((item) => (
                    <p key={item} className="text-[14.5px] leading-relaxed text-[#1F2937]">
                      {item}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}

      {open && !isDocument && (
        <div
          id={panelId}
          role="dialog"
          aria-label={title || 'How this works'}
          className={`absolute top-[30px] z-50 w-[320px] max-w-[86vw] rounded-xl border border-[#D4AF37]/70 bg-[#0B0F17] p-4 text-left shadow-[0_0_28px_-10px_rgba(212,175,55,0.55),0_24px_60px_rgba(0,0,0,0.65)] ${anchor}`}
        >
          {title && (
            <p className="font-heading text-[14px] leading-snug text-[#F9FAFB]">{title}</p>
          )}
          {intro && (
            <p className="mt-1 font-body text-[12.5px] leading-relaxed text-[#A0AAB8]">{intro}</p>
          )}
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
        </div>
      )}
    </span>
  );
}
