import React from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

// What one "add to résumé" pass would change. Shown before anything lands, so the candidate
// reads every line first — and told straight when their history holds nothing to add.
export default function RunFixProposal({ proposal, onAccept, onDiscard }) {
  if (!proposal) return null;
  const ready = proposal.outcome === 'ready';

  return (
    <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/5 p-4">
      <p className="text-[13.5px] font-medium leading-snug text-foreground">
        Add to résumé — {proposal.fix.title}
      </p>

      {proposal.explanation && (
        <p className="mt-2 text-[13px] leading-relaxed text-foreground/80">{proposal.explanation}</p>
      )}

      {ready && (
        <ul className="mt-3 space-y-2.5">
          {proposal.items.map((item, index) => (
            <li key={index} className="rounded-xl border border-border/60 bg-card/60 p-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-[12.5px] font-medium text-foreground">{item.label}</p>
                <p className="text-[12px] text-muted-foreground">{item.detail}</p>
              </div>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">{item.preview}</p>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {ready && (
          <Button size="sm" className="rounded-full" onClick={onAccept}>
            <Check className="mr-1.5 h-3.5 w-3.5" /> Add it to the résumé
          </Button>
        )}
        <Button size="sm" variant="ghost" className="rounded-full" onClick={onDiscard}>
          <X className="mr-1.5 h-3.5 w-3.5" /> {ready ? 'Leave it' : 'Close'}
        </Button>
        {ready && (
          <p className="text-[12px] text-muted-foreground">
            Nothing here is invented — every line comes from your own history.
          </p>
        )}
      </div>
    </div>
  );
}