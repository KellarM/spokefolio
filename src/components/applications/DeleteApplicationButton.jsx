import React, { useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';

// Removes one tailored résumé, and unhooks any kept posting that pointed at it.
export default function DeleteApplicationButton({ application, onDeleted }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const title = application.job_title || 'This tailored résumé';

  const remove = async () => {
    setBusy(true);
    setError('');
    try {
      const linked = await base44.entities.JobPosting.filter({ application_id: application.id }, { limit: 20 });
      await base44.entities.JobApplication.delete(application.id);
      await Promise.all(
        linked.items.map((posting) =>
          base44.entities.JobPosting.update(posting.id, { application_id: '', status: 'saved' })
        )
      );
      setOpen(false);
      onDeleted(application.id);
    } catch (err) {
      setError('That résumé could not be deleted. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!busy) setOpen(next);
      }}
    >
      <AlertDialogTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="self-start rounded-full px-2.5 text-muted-foreground hover:text-destructive"
          aria-label={`Delete ${title}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this tailored résumé?</AlertDialogTitle>
          <AlertDialogDescription>
            {title} and its cover letter are removed for good. The posting you kept stays in your postings.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && <p className="text-[13px] text-destructive">{error}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Keep it</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={(event) => {
              event.preventDefault();
              remove();
            }}
          >
            {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}