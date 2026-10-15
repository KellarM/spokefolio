import React from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DictateButton from '@/components/common/DictateButton';
import { appendLine } from '@/hooks/useDictation';

// The words this entry started from, kept where you can still read, edit and extend them.
export default function OriginalCapture({ value, onChange, onRefresh, busy }) {
  return (
    <details open className="rounded-xl border border-border/70 bg-secondary/40 px-4 py-3">
      <summary className="eyebrow cursor-pointer">Your original capture</summary>
      <textarea
        value={value || ''}
        onChange={(event) => onChange(event.target.value)}
        rows={5}
        placeholder="What you said the first time. Add anything you missed, then update the entry below."
        className="mt-3 w-full resize-y rounded-xl border border-border/70 bg-background/70 p-3 text-[14px] leading-relaxed outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-accent/50"
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <DictateButton onText={(transcript) => onChange(appendLine(value, transcript))} label="Add more by voice" />
        <Button variant="secondary" size="sm" className="rounded-full" onClick={onRefresh} disabled={busy || !String(value || '').trim()}>
          {busy ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-2 h-3.5 w-3.5" />}
          Update entry from my words
        </Button>
      </div>
      <p className="mt-2 text-[11.5px] text-muted-foreground">
        These words stay with the entry. Updating only ever adds detail — nothing you have already captured is lost.
      </p>
    </details>
  );
}