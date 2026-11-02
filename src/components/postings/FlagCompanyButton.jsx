import React, { useState } from 'react';
import { Flag, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { flagCompany, isBlocked } from '@/lib/blockedCompanies';

// Flagging is done from the posting, never the application: by the time
// something is an application it has already been tailored to. One click here
// and this employer stops appearing in every future search.
export default function FlagCompanyButton({ company, sourceUrl, title, blocked, onFlagged, compact = false }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const already = isBlocked(company, sourceUrl, blocked);

  const flag = async () => {
    if (busy || already) return;
    setBusy(true);
    try {
      const saved = await flagCompany({ company, url: sourceUrl, title, blocked });
      onFlagged?.(saved);
      toast({
        title: `${saved.name || company} will not show up again`,
        description: 'Future searches skip this employer. Manage the list at the bottom of this page.'
      });
    } catch (error) {
      toast({
        title: 'Could not flag this employer',
        description: error?.message || 'Try again in a moment.',
        variant: 'destructive'
      });
    }
    setBusy(false);
  };

  if (already) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/10 px-2.5 py-1 text-[11.5px] font-medium text-destructive"
        title="This employer is on your blocked list"
      >
        <Flag className="h-3 w-3" /> Blocked
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={flag}
      disabled={busy || !String(company || '').trim()}
      className="inline-flex items-center gap-1 rounded-full border border-border/70 px-2.5 py-1 text-[11.5px] font-medium text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive disabled:opacity-50"
      title={String(company || '').trim() ? 'Never show this employer again' : 'This posting names no employer'}
    >
      {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Flag className="h-3 w-3" />}
      {compact ? 'Flag' : 'Flag employer'}
    </button>
  );
}
