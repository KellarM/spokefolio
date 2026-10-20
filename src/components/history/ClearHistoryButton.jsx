import React, { useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';
import { isTestAccount } from '@/lib/testAccount';

const CONFIRM =
  'Clear this account’s whole career history?\n\nEvery entry, saved draft and review is deleted and the master history is reset. This cannot be undone.';

// Testing account only — nobody else ever sees this button. It empties this account's own
// career history, so a new persona can be built from a blank slate.
export default function ClearHistoryButton({ entries = 0, disabled, onCleared }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  if (!isTestAccount(user)) return null;

  const clear = async () => {
    if (!window.confirm(CONFIRM)) return;
    setBusy(true);
    try {
      const mine = { created_by_id: user.id };
      await base44.entities.CareerEntry.deleteMany(mine);
      await base44.entities.CareerHistoryReview.deleteMany(mine);
      await onCleared();
      toast({
        title: 'Career history cleared',
        description: `${entries} ${entries === 1 ? 'entry' : 'entries'} and any saved reviews removed. Start again whenever you like.`
      });
    } catch (error) {
      toast({
        title: 'The history could not be cleared',
        description: error?.response?.data?.error || error.message,
        variant: 'destructive'
      });
    }
    setBusy(false);
  };

  return (
    <Button
      variant="ghost"
      className="rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
      onClick={clear}
      disabled={disabled || busy}
    >
      {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
      Clear history
    </Button>
  );
}