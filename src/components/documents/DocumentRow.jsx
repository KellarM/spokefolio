import React, { useState } from 'react';
import { ChevronDown, Loader2, Pencil, Trash2, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { useStudioLanguage } from '@/lib/StudioLanguage';

const TYPES = {
  previous_resume: 'documents.typePreviousResume',
  project: 'documents.typeProjectShort',
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
  return <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] text-emerald-800">{t('documents.read')}</span>;
}

export default function DocumentRow({ doc, onDelete }) {
  const { t } = useStudioLanguage();
  const [open, setOpen] = useState(false);
  const [opening, setOpening] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  // The studio's reading of an uploaded file is an interpretation, not a
  // verdict - the record belongs to Michael, so the reading is editable.
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
    <li className="rounded-2xl border border-border/70 bg-card px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10.5px] uppercase tracking-[0.1em] text-muted-foreground">
              {t(TYPES[doc.doc_type] || 'documents.typeOther')}
            </span>
            <StatusChip status={doc.status} t={t} />
          </div>
          <p className="mt-2 truncate font-heading text-[16.5px]">{doc.name}</p>
          {doc.notes && <p className="mt-0.5 text-[12.5px] text-muted-foreground">{doc.notes}</p>}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="rounded-full" onClick={view} disabled={opening}>
            {opening ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : t('documents.open')}
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
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground transition-colors hover:text-foreground"
            >
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
              {open ? t('documents.hideRead') : t('documents.showRead')}
            </button>
            {open && !editing && (
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
          {open && !editing && (
            <p className="mt-2 whitespace-pre-line rounded-xl bg-secondary/60 px-4 py-3 text-[13px] leading-relaxed text-foreground/85">
              {doc.extracted_summary}
            </p>
          )}
          {open && editing && (
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
    </li>
  );
}
