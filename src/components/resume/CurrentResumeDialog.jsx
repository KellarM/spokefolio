import { useEffect, useState } from 'react';
import { X, Loader2, FileText } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import useProfile from '@/hooks/useProfile';
import { useStudioLanguage } from '@/lib/StudioLanguage';
import { buildMasterResume } from '@/lib/masterResume';
import { DEFAULT_RESUME_LAYOUT } from '@/lib/resumeLayout';
import PreviewDocument from '@/components/resume/PreviewDocument';
import ResumeDownloadButtons from '@/components/resume/ResumeDownloadButtons';

// One fixed, ATS-safe format for the current résumé. It parses cleanly in
// employer portals while still looking like a real document on screen.
const MASTER_TEMPLATE = 'editorial';

// The current résumé runs summary first, then the career story, education and
// certifications, with the skill list at the bottom: the profile default style
// with this document's own fixed section order. Tailored applications are
// untouched; each carries its own layout.
const MASTER_LAYOUT = {
  ...DEFAULT_RESUME_LAYOUT,
  order: ['summary', 'experience', 'education', 'certifications', 'skills']
};

// The current résumé, composed live from the knowledge base each time it
// opens: profile identity, master summary, core skills and every captured
// entry, with no job posting and no generation involved.
export default function CurrentResumeDialog({ open, onClose }) {
  const { t } = useStudioLanguage();
  const { profile, loadingProfile } = useProfile();
  const [entries, setEntries] = useState(null);

  // Reload on every open, so the document always shows the last save.
  useEffect(() => {
    if (!open) {
      setEntries(null);
      return;
    }
    let active = true;
    base44.entities.CareerEntry.list('-created_date', 500)
      .then((records) => {
        if (active) setEntries(records || []);
      })
      .catch(() => {
        if (active) setEntries([]);
      });
    return () => {
      active = false;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const resume = entries ? buildMasterResume(profile, entries) : null;
  const hasContent = Boolean(
    resume &&
      (resume.headline ||
        resume.summary ||
        (resume.experience || []).length ||
        (resume.education || []).length ||
        (resume.skills || []).length ||
        (resume.certifications || []).length)
  );
  const loading = loadingProfile || entries === null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div>
            <h2 className="font-heading text-[20px] leading-tight">{t('masterResume.title')}</h2>
            <p className="mt-1 text-[13px] text-muted-foreground">{t('masterResume.subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={t('masterResume.close')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : hasContent ? (
            <PreviewDocument
              profile={profile}
              resume={resume}
              template={MASTER_TEMPLATE}
              layout={MASTER_LAYOUT}
              overrides={{}}
              onUpdateOverride={() => {}}
            />
          ) : (
            <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
              <FileText className="h-8 w-8 text-muted-foreground" />
              <p className="max-w-sm text-[14px] leading-relaxed text-muted-foreground">
                {t('masterResume.empty')}
              </p>
            </div>
          )}
        </div>

        {hasContent && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/40 px-6 py-4">
            <p className="text-[12.5px] text-muted-foreground">{t('masterResume.alwaysCurrent')}</p>
            <ResumeDownloadButtons
              profile={profile}
              resume={resume}
              template={MASTER_TEMPLATE}
              layout={MASTER_LAYOUT}
              styleOverrides={{}}
              label={t('masterResume.download')}
            />
          </div>
        )}
      </div>
    </div>
  );
}
