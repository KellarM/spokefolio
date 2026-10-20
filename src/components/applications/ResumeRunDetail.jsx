import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, Check, X } from 'lucide-react';

const REQUIREMENT_STATUS = {
  covered: { label: 'Covered', className: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200' },
  partial: { label: 'Partly', className: 'border-amber-400/40 bg-amber-400/10 text-amber-200' },
  missing: { label: 'Missing', className: 'border-rose-400/40 bg-rose-400/10 text-rose-200' }
};

const IMPORTANCE = { critical: 'Critical', important: 'Important', nice: 'Nice to have' };

const CHECK_MARK = {
  pass: { Icon: Check, className: 'text-emerald-300' },
  warn: { Icon: AlertTriangle, className: 'text-amber-300' },
  fail: { Icon: X, className: 'text-rose-300' }
};

// The two lists behind the grade: what the posting asked for and how the résumé answered, and
// the format checks the screening software makes for itself.
export default function ResumeRunDetail({ requirements = [], checks = [] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex items-center gap-2 rounded-full border border-border/70 px-3.5 py-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
      >
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        Posting requirements and format checks ({requirements.length + checks.length})
      </button>

      {open && (
        <div className="mt-4 grid gap-5 lg:grid-cols-2">
          <div>
            <p className="eyebrow">What the posting asks for</p>
            <ul className="mt-3 space-y-3">
              {requirements.map((item, index) => {
                const style = REQUIREMENT_STATUS[item.status] || REQUIREMENT_STATUS.partial;
                return (
                  <li key={index} className="rounded-xl border border-border/60 bg-secondary/40 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-2 py-0.5 text-[11.5px] font-medium ${style.className}`}>
                        {style.label}
                      </span>
                      <span className="text-[11.5px] uppercase tracking-[0.14em] text-muted-foreground">
                        {IMPORTANCE[item.importance] || IMPORTANCE.important}
                      </span>
                    </div>
                    <p className="mt-2 text-[13.5px] leading-snug text-foreground/90">{item.requirement}</p>
                    {(item.evidence || item.note) && (
                      <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
                        {item.note || item.evidence}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <p className="eyebrow">Format & screening checks</p>
            <ul className="mt-3 space-y-2.5">
              {checks.map((check, index) => {
                const mark = CHECK_MARK[check.status] || CHECK_MARK.warn;
                return (
                  <li key={index} className="flex gap-2.5">
                    <mark.Icon className={`mt-0.5 h-4 w-4 shrink-0 ${mark.className}`} />
                    <div>
                      <p className="text-[13.5px] leading-snug text-foreground/90">{check.label}</p>
                      <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">{check.detail}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}