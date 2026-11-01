import React from 'react';
import { Check, Loader2, Mic, Plus, Sparkles, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import VoiceDictation from '@/components/history/VoiceDictation';
import { useStudioLanguage } from '@/lib/StudioLanguage';
import { splitSegments, boundariesIn, removeBoundary } from '@/lib/historySegments';

export default function DictationBox({ value, onChange, onSubmit, busy, firstHint = false }) {
  const { t } = useStudioLanguage();
  const appendTranscript = (transcript) => {
    const current = value.trim();
    onChange(current ? `${current}\n${transcript}` : transcript);
  };

  // The box reads the buffer as it fills, so the client sees the jobs being
  // separated instead of discovering it after a save. Same pure functions the
  // capture path uses, so what is shown and what is saved can never disagree.
  const segments = splitSegments(value);
  const boundaries = boundariesIn(value);
  const multiple = segments.length > 1;

  // Tapping this writes the phrase the client would say, so the dates can be
  // typed over the spot. Voice stays the fast path; this is the fallback for a
  // recogniser that swallowed the sentence.
  const insertBoundary = () => {
    const current = value.replace(/\s+$/, '');
    onChange(`${current}${current ? '\n\n' : ''}${t('history.newJobPhrase')} `);
  };

  const undoBoundary = (boundary) => {
    onChange(removeBoundary(value, boundary.start, boundary.end));
  };

  return (
    <div className="paper animate-rise rounded-2xl p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="eyebrow flex items-center gap-2">
          <Mic className="h-3.5 w-3.5" /> {t('history.dictateEntry')}
        </span>
        <span className="text-[11.5px] text-muted-foreground">{t('history.talkOrType')}</span>
      </div>

      <VoiceDictation onTranscript={appendTranscript} />

      {firstHint && (
        <p className="mt-3 rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/5 px-4 py-2.5 text-[13.5px] leading-snug text-foreground/85">
          {t('history.firstMicHint')}
        </p>
      )}

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={7}
        placeholder={t('history.dictationPlaceholder')}
        className="mt-4 w-full resize-y rounded-xl border border-border/70 bg-background/60 p-4 text-[15px] leading-relaxed outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-accent/50 focus:ring-4 focus:ring-accent/5"
      />

      {/* The split, made visible. Each job shows the dates it will be saved
          with, and every boundary can be undone - a split the client cannot
          see or reverse is worse than no split at all. */}
      {multiple && (
        <div className="mt-3 rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/[0.04] p-3">
          <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-accent">
            {t('history.segmentsFound', { count: segments.length })}
          </p>
          <ul className="mt-2 space-y-1.5">
            {segments.map((segment, i) => (
              <li key={i} className="flex items-start justify-between gap-3 text-[13px] leading-snug text-foreground/85">
                <span className="min-w-0">
                  <span className="font-mono text-[11.5px] text-muted-foreground">{i + 1}.</span>{' '}
                  <span className="text-foreground/60">
                    {segment.start_date
                      ? `${segment.start_date} – ${segment.end_date || t('history.segmentOpen')}`
                      : t('history.segmentNoDates')}
                  </span>{' '}
                  <span className="text-foreground/75">{segment.text.slice(0, 70)}{segment.text.length > 70 ? '…' : ''}</span>
                </span>
                {i > 0 && boundaries[i - 1] && (
                  <button
                    type="button"
                    onClick={() => undoBoundary(boundaries[i - 1])}
                    className="shrink-0 rounded-full border border-border/70 px-2 py-0.5 text-[11.5px] text-muted-foreground transition-colors hover:border-accent/50 hover:text-accent"
                  >
                    <Undo2 className="mr-1 inline h-3 w-3" />
                    {t('history.undoSplit')}
                  </button>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11.5px] leading-snug text-muted-foreground">
            {t('history.segmentsNote')}
          </p>
        </div>
      )}

      <p className="mt-3 flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
        <Check className="h-3.5 w-3.5 text-accent" />
        {t('history.savedAsYouType')}
      </p>

      <p className="mt-2 text-[11.5px] leading-snug text-muted-foreground">
        {t('history.splitHint')}
      </p>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11.5px] text-muted-foreground">
          {t('history.finishPhrase')}
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={insertBoundary}
            disabled={busy}
            className="rounded-full"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            {t('history.newJob')}
          </Button>
          <Button onClick={onSubmit} disabled={busy || !value.trim()} className="rounded-full">
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            {multiple ? t('history.captureEntries', { count: segments.length }) : t('history.captureEntry')}
          </Button>
        </div>
      </div>
    </div>
  );
}
