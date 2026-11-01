import React, { useState } from 'react';
import { ChevronDown, ExternalLink, Loader2, Pencil, Trash2, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { useStudioLanguage } from '@/lib/StudioLanguage';

const TYPES = {
  previous_resume: 'documents.typePreviousResume',
  project: 'documents.typeProject',
  testimonial: 'documents.typePraise',
  certification: 'documents.typeCertification',
  other: 'documents.typeOther'
};

function StatusChip({ status, t }) {
  if (status === 'processing') {
    return (
      <span className="animate-soft-pulse flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-[11px] text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" /> {t('documents.reading')}
      </span>
    );
  }
  if (status === 'unreadable') {
    return (
      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] text-amber-800">
        {t('documents.keptAsReference')}
      </span>
    );
  }
  return (
    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] text-emerald-800">
      {t('documents.read')}
    </span>
  );
}

// One row per file. Closed, it says what the file is and nothing else, so a
// long list stays scannable. Open, it holds everything: the note, the file
// itself and the studio's reading of it.
export default function DocumentRow({ doc, onDelete }) {
  const { t } = useStudioLanguage();
  const [open, setOpen] = useState(false);
  const [opening, setOpening] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    setDraft(doc.extracted_summary || '');
    setEditing(true);
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      await base44.entities.SupportingDocument.update(doc.id, { extracted_summary: draft });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

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
    <li className="overflow-hidden rounded-2xl border border-border/70 bg-card">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-secondary/30"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10.5px] uppercase tracking-[0.1em] text-muted-foreground">
              {t(TYPES[doc.doc_type] || 'documents.typeOther')}
            </span>
            <StatusChip status={doc.status} t={t} />
          </div>
          <p className="mt-1.5 truncate font-heading text-[15.5px]">{doc.name}</p>
        </div>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div className="border-t border-border/60 px-5 py-4">
          {doc.notes && (
            <p className="text-[13px] leading-relaxed text-muted-foreground">{doc.notes}</p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" className="rounded-full" onClick={view} disabled={opening}>
              {opening ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
              )}
              {t('documents.open')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(doc)}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              {t('common.delete')}
            </Button>
          </div>

          {doc.extracted_summary && (
            <div className="mt-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  {t('documents.whatWasRead')}
                </p>
                {!editing && (
                  <button
                    type="button"
                    onClick={startEdit}
                    className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    {t('documents.editRead')}
                  </button>
                )}
              </div>

              {!editing ? (
                <p className="mt-2 whitespace-pre-line rounded-xl bg-secondary/60 px-4 py-3 text-[13px] leading-relaxed text-foreground/85">
                  {doc.extracted_summary}
                </p>
              ) : (
                <div className="relative mt-2">
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Escape') setEditing(false);
                    }}
                    rows={7}
                    className="w-full rounded-xl border border-border/60 bg-secondary/60 px-4 py-3 pr-10 text-[13px] leading-relaxed text-foreground/85 outline-none focus:border-[#D4AF37]/50"
                  />
                  <button
                    type="button"
                    aria-label={t('common.clearField')}
                    onClick={() => setDraft('')}
                    className="absolute right-2 top-2.5 flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <div className="mt-2 flex items-center gap-2">
                    <Button variant="default" size="sm" className="rounded-full" onClick={saveEdit} disabled={saving}>
                      {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : t('common.save')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full"
                      onClick={() => setEditing(false)}
                      disabled={saving}
                    >
                      {t('common.cancel')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {!doc.extracted_summary && doc.status === 'unreadable' && (
            <p className="mt-3 text-[12.5px] leading-relaxed text-muted-foreground">
              {t('documents.keptAsReference')}
            </p>
          )}
        </div>
      )}
    </li>
  );
}
