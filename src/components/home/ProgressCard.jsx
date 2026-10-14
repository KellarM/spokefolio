import React from 'react';
import { Link } from 'react-router-dom';
import { Check, Lock, Mic, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

function Stat({ value, label }) {
  return (
    <div className="rounded-xl border border-border/70 bg-background/60 px-3 py-2.5">
      <p className="font-heading text-xl leading-none">{value}</p>
      <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
    </div>
  );
}

export default function ProgressCard({ historyComplete, entryCount, confirmedCount, documentCount, applicationCount, onUnlock }) {
  return (
    <div className="paper animate-rise rounded-2xl p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Your foundation</p>
          <h3 className="mt-2 font-heading text-[22px] leading-snug">
            {historyComplete ? 'Career history locked in' : 'Build your career history'}
          </h3>
        </div>
        <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary">
          {historyComplete ? <Lock className="h-4 w-4" strokeWidth={1.75} /> : <Mic className="h-4 w-4" strokeWidth={1.75} />}
        </span>
      </div>

      <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
        {historyComplete
          ? 'Every tailored résumé is drawn from this history, so nothing you write can contradict your real experience.'
          : 'Dictate one entry at a time and answer the follow-up prompts. When you are done, say “Resume History is Complete”.'}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Stat value={entryCount} label="Entries" />
        <Stat value={confirmedCount} label="Confirmed" />
        <Stat value={documentCount} label="Files" />
        <Stat value={applicationCount} label="Résumés" />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {historyComplete ? (
          <>
            <Button asChild className="rounded-full">
              <Link to="/new-application">
                <Sparkles className="mr-2 h-4 w-4" />
                Tailor a résumé
              </Link>
            </Button>
            <Button variant="ghost" className="rounded-full" onClick={onUnlock}>
              Add more history
            </Button>
          </>
        ) : (
          <>
            <Button asChild className="rounded-full">
              <Link to="/history">
                <Mic className="mr-2 h-4 w-4" />
                Continue capturing
              </Link>
            </Button>
            {confirmedCount > 0 && (
              <span className="flex items-center gap-1.5 self-center text-[12.5px] text-muted-foreground">
                <Check className="h-3.5 w-3.5" />
                {confirmedCount} {confirmedCount === 1 ? 'entry' : 'entries'} ready to use
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}