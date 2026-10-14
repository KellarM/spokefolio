import React, { useState } from 'react';
import { ChevronDown, Loader2, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';

const TYPES = {
  previous_resume: 'Previous résumé',
  project: 'Project',
  testimonial: 'Praise',
  certification: 'Certification',
  other: 'Other'
};

function StatusChip({ status }) {
  if (status === 'processing') {
    return (
      <span className="animate-soft-pulse flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-[11px] text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" /> Reading
      </span>
    );
  }
  if (status === 'unreadable') {
    return <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] text-amber-800">Kept as reference</span>;
  }
  return <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] text-emerald-800">Read</span>;
}

export default function DocumentRow({ doc, onDelete }) {
  const [open, setOpen] = useState(false);
  const [opening, setOpening] = useState(false);

  const view = async () => {
    setOpening(true);
    try {
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: doc.file_uri });
      window.open(signed_url, '_blank');
    } finally {
      setOpening(false);
    }
  };

  return (
    <li className="rounded-2xl border border-border/70 bg-card px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10.5px] uppercase tracking-[0.1em] text-muted-foreground">
              {TYPES[doc.doc_type] || 'Other'}
            </span>
            <StatusChip status={doc.status} />
          </div>
          <p className="mt-2 truncate font-heading text-[16.5px]">{doc.name}</p>
          {doc.notes && <p className="mt-0.5 text-[12.5px] text-muted-foreground">{doc.notes}</p>}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="rounded-full" onClick={view} disabled={opening}>
            {opening ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Open'}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(doc)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {doc.extracted_summary && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
            {open ? 'Hide what was read' : 'Show what was read'}
          </button>
          {open && (
            <p className="mt-2 whitespace-pre-line rounded-xl bg-secondary/60 px-4 py-3 text-[13px] leading-relaxed text-foreground/85">
              {doc.extracted_summary}
            </p>
          )}
        </div>
      )}
    </li>
  );
}