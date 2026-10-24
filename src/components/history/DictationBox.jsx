import React from 'react';
import { Check, Loader2, Mic, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import VoiceDictation from '@/components/history/VoiceDictation';
import { useStudioLanguage } from '@/lib/StudioLanguage';

export default function DictationBox({ value, onChange, onSubmit, busy, firstHint = false }) {
  const { t } = useStudioLanguage();
  const appendTranscript = (transcript) => {
    const current = value.trim();
    onChange(current ? `${current}\n${transcript}` : transcript);
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

      <p className="mt-3 flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
        <Check className="h-3.5 w-3.5 text-accent" />
        {t('history.savedAsYouType')}
      </p>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11.5px] text-muted-foreground">
          {t('history.finishPhrase')}
        </p>
        <Button onClick={onSubmit} disabled={busy || !value.trim()} className="rounded-full">
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          {t('history.captureEntry')}
        </Button>
      </div>
    </div>
  );
}