import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

const hostOf = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch (error) {
    return '';
  }
};

// The posting the résumé was written from, kept beside it so it can be read back later.
export default function JobPostingPanel({ description, sourceUrl }) {
  const [open, setOpen] = useState(false);
  const text = (description || '').trim();
  if (!text) return null;
  const words = text.split(/\s+/).length;
  const host = hostOf(sourceUrl);

  return (
    <section className="mt-7 rounded-2xl border border-border/70 bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow">The posting you tailored for</p>
          <p className="mt-2 text-[13px] text-muted-foreground">{words} words · saved with this application</p>
          {sourceUrl && (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1.5 inline-flex items-center gap-1.5 text-[12.5px] text-primary underline-offset-4 hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" /> {host || 'Open the original posting'}
            </a>
          )}
        </div>
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="inline-flex items-center gap-1.5 rounded-full border border-border/70 px-3.5 py-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
        >
          {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          {open ? 'Hide posting' : 'Show posting'}
        </button>
      </div>

      {open && (
        <p className="mt-4 max-h-[420px] overflow-y-auto whitespace-pre-wrap rounded-xl bg-secondary/60 p-4 text-[13.5px] leading-relaxed text-foreground/90">
          {text}
        </p>
      )}
    </section>
  );
}