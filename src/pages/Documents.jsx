import React, { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import DocumentUploader from '@/components/documents/DocumentUploader';
import { useTour } from '@/lib/TourContext';
import DocumentRow from '@/components/documents/DocumentRow';
import { useStudioLanguage } from '@/lib/StudioLanguage';
import InstructionPopover from '@/components/guide/InstructionPopover';
import { guideLabel } from '@/content/guideLabels';
import { referenceFilesGuide } from '@/content/referenceFilesGuide';

export default function Documents() {
  const { t, language } = useStudioLanguage();
  const guide = referenceFilesGuide(language);
  const [guideOpen, setGuideOpen] = useState(false);
  const tour = useTour();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const records = await base44.entities.SupportingDocument.list('-created_date', 100);
    setDocuments(records || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const unsubscribe = base44.entities.SupportingDocument.subscribe(() => {
      load();
    });
    return unsubscribe;
  }, [load]);

  // The journey's files step celebrates the moment a real document exists -
  // detected live from the page (and the subscription above), not from a
  // stale snapshot.
  useEffect(() => {
    if (tour.active && (tour.step === 'files' || tour.step === 'files_add') && documents.length > 0) {
      tour.announce('files_done');
    }
  }, [documents, tour]);

  const remove = async (doc) => {
    if (!window.confirm(t('documents.deleteConfirm', { name: doc.name }))) return;
    await base44.entities.SupportingDocument.delete(doc.id);
    await load();
  };

  return (
    <div className="animate-rise">
      <header className="max-w-2xl">
        <div className="mt-3 flex items-start gap-3">
          <h1 className="font-heading text-[30px] leading-tight tracking-tight sm:text-[36px]">{t('documents.title')}</h1>
          <InstructionPopover
              open={guideOpen}
              onOpenChange={setGuideOpen}
              label={guideLabel(language)}
              className="mt-2"
            title={guide.title}
            intro={guide.intro}
            sections={guide.sections}
          />
        </div>
        <p className="mt-2 font-mono text-[16px] font-semibold uppercase tracking-[0.1em] text-white">{t('steps.one')}</p>
        <p className="mt-3 text-[14.5px] leading-relaxed text-muted-foreground">
          {t('documents.lede')}
        </p>
      </header>

      <div className="mt-8 space-y-10">
        <div data-tour="uploader">
          <DocumentUploader onChanged={load} />
        </div>

        <section>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-heading text-[20px]">
              {t('documents.yourFiles')}
              {documents.length > 0 && (
                <span className="ml-2 font-mono text-[12px] text-muted-foreground">{documents.length}</span>
              )}
            </h2>
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
          {documents.length === 0 && !loading ? (
            <div className="mt-4 rounded-2xl border border-dashed border-border px-6 py-10 text-center">
              <p className="text-[14px] text-muted-foreground">{t('documents.nothingYet')}</p>
              <GuidePrompt
                className="mt-4"
                label={guideLabel(language)}
                onClick={() => setGuideOpen(true)}
              />
            </div>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {documents.map((doc) => (
                <DocumentRow key={doc.id} doc={doc} onDelete={remove} />
              ))}
            </ul>
          )}
        </section>
      </div>

    </div>
  );
}