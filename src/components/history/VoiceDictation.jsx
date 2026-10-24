import React from 'react';
import { Loader2, Mic, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useDictation from '@/hooks/useDictation';
import { useStudioLanguage } from '@/lib/StudioLanguage';

export default function VoiceDictation({ onTranscript }) {
  const { t } = useStudioLanguage();
  const { recording, busy, seconds, error, canRetry, start, stop, retry } = useDictation(onTranscript);
  const clock = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

  return (
    <div data-tour="dictation" className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-border/70 bg-secondary/40 px-4 py-3">
      {recording ? (
        <Button type="button" onClick={stop} disabled={busy} className="rounded-full">
          <Square className="mr-2 h-3.5 w-3.5" /> {t('history.vstop')}
        </Button>
      ) : (
        <Button type="button" variant="secondary" className="rounded-full" onClick={start} disabled={busy}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mic className="mr-2 h-4 w-4" />}
          {busy ? t('history.vwriting') : seconds ? t('history.vrecordAnother') : t('history.vdictate')}
        </Button>
      )}

      {recording && (
        <span className="flex items-center gap-2 text-[12.5px] text-foreground/80">
          <span className="h-2 w-2 animate-pulse rounded-full bg-destructive" />
          {t('history.vrecording')} {clock}
        </span>
      )}

      {busy && <p role="status" className="text-xs text-muted-foreground">Turning your recording into text. Please keep this page open.</p>}
      {error && !busy && (
        <div role="alert" className="w-full space-y-2 text-sm text-destructive">
          <p>{error}</p>
          {canRetry && <Button type="button" variant="outline" size="sm" onClick={retry}>{t('history.vretry')}</Button>}
        </div>
      )}
      {!recording && !busy && !error && (
        <span className="text-[11.5px] text-muted-foreground">
          {t('history.vtapHint')}
        </span>
      )}
    </div>
  );
}