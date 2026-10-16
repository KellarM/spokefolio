import React from 'react';
import { Link } from 'react-router-dom';
import { Check, FolderOpen, List, Lock, Mic, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function Stat({ value, label, icon: Icon, tone }) {
  return (
    <div className={cn('rounded-xl border px-3 py-2.5', tone)}>
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
        <p className="font-heading text-xl leading-none">{value}</p>
      </div>
      <p className="mt-1.5 text-[11px] uppercase tracking-[0.12em] opacity-80">{label}</p>
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
        <span
          className={cn(
            'mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
            historyComplete ? 'bg-accent/12 text-accent' : 'bg-primary/12 text-primary'
          )}
        >
          {historyComplete ? <Lock className="h-4 w-4" strokeWidth={1.75} /> : <Mic className="h-4 w-4" strokeWidth={1.75} />}
        </span>
      </div>

      <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
        {historyComplete
          ? 'Every tailored résumé is drawn from this history, so nothing you write can contradict your real experience.'
          : 'Dictate one entry at a time and answer the follow-up prompts. When you are done, say “Resume History is Complete”.'}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Stat value={entryCount} label="Entries" icon={List} tone="border-primary/30 bg-primary/10 text-primary" />
        <Stat value={confirmedCount} label="Confirmed" icon={Check} tone="border-accent/30 bg-accent/10 text-accent" />
        <Stat
          value={documentCount}
          label="Files"
          icon={FolderOpen}
          tone="border-resume-brass/40 bg-resume-brass/10 text-resume-brass"
        />
        <Stat
          value={applicationCount}
          label="Résumés"
          icon={Sparkles}
          tone="border-foreground/15 bg-foreground/5 text-foreground"
        />
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