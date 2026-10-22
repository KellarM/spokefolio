import React, { useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';
import { isTestAccount } from '@/lib/testAccount';
import { useStudioLanguage } from '@/lib/StudioLanguage';


// Testing account only — nobody else ever sees this button. It empties this account's own
// career history, so a new persona can be built from a blank slate.
export default function ClearHistoryButton({ entries = 0, disabled, onCleared }) {
  const { t } = useStudioLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  if (!isTestAccount(user)) return null;

  const clear = async () => {
    if (!window.confirm(t('history.clearConfirm'))) return;
    setBusy(true);
    try {
      const mine = { created_by_id: user.id };
      await base44.entities.CareerEntry.deleteMany(mine);
      await base44.entities.CareerHistoryReview.deleteMany(mine);
      await onCleared();
      toast({
        title: t('history.cleared'),
        description: t('history.clearedDesc', { count: entries })
      });
    } catch (error) {
      toast({
        title: t('history.clearFailed'),
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
      {t('history.clearHistory')}
    </Button>
  );
}