import React from 'react';
import { Check, Loader2, Mic, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import VoiceDictation from '@/components/history/VoiceDictation';

export default function DictationBox({ value, onChange, onSubmit, busy }) {
  const appendTranscript = (transcript) => {
    const current = value.trim();
    onChange(current ? `${current}\n${transcript}` : transcript);
  };

  return (
    <div className="paper animate-rise rounded-2xl p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="eyebrow flex items-center gap-2">
          <Mic className="h-3.5 w-3.5" /> Dictate an entry
        </span>
        <span className="text-[11.5px] text-muted-foreground">Talk it through, or type it in</span>
      </div>

      <VoiceDictation onTranscript={appendTranscript} />

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={7}
        placeholder="Who you worked for, your title, the dates, what you were responsible for, what changed because of you…"
        className="mt-4 w-full resize-y rounded-xl border border-border/70 bg-background/60 p-4 text-[15px] leading-relaxed outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-accent/50 focus:ring-4 focus:ring-accent/5"
      />

      <p className="mt-3 flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
        <Check className="h-3.5 w-3.5 text-accent" />
        Saved as you type — nothing is lost if the page reloads.
      </p>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11.5px] text-muted-foreground">
          Say or type “Resume History is Complete” when you are finished for good.
        </p>
        <Button onClick={onSubmit} disabled={busy || !value.trim()} className="rounded-full">
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          Capture entry
        </Button>
      </div>
    </div>
  );
}