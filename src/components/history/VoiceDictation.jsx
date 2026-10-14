import React from 'react';
import { Loader2, Mic, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useDictation from '@/hooks/useDictation';

export default function VoiceDictation({ onTranscript }) {
  const { recording, busy, seconds, start, stop } = useDictation(onTranscript);
  const clock = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-border/70 bg-secondary/40 px-4 py-3">
      {recording ? (
        <Button onClick={stop} className="rounded-full">
          <Square className="mr-2 h-3.5 w-3.5" /> Stop and write it in
        </Button>
      ) : (
        <Button variant="secondary" className="rounded-full" onClick={start} disabled={busy}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mic className="mr-2 h-4 w-4" />}
          {busy ? 'Writing your words…' : seconds ? 'Record another take' : 'Dictate with your voice'}
        </Button>
      )}

      {recording && (
        <span className="flex items-center gap-2 text-[12.5px] text-foreground/80">
          <span className="h-2 w-2 animate-pulse rounded-full bg-destructive" />
          Recording {clock}
        </span>
      )}

      {!recording && !busy && (
        <span className="text-[11.5px] text-muted-foreground">
          Tap, talk through the role, then stop — your words land in the box below.
        </span>
      )}
    </div>
  );
}