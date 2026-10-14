import React from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import useHistoryReview from '@/components/history/review/useHistoryReview';
import ReviewEntryPicker from '@/components/history/review/ReviewEntryPicker';
import ReviewWorkspace from '@/components/history/review/ReviewWorkspace';
export default function HistoryReviewDialog({ anchor, initialReview, onChanged, onClose }) {
  const state = useHistoryReview({ anchor, initialReview, onChanged, onClose });
  return <Dialog open onOpenChange={open => { if (!open && !state.busy) onClose(); }}><DialogContent className="max-h-[92dvh] w-[96vw] max-w-6xl overflow-y-auto" onInteractOutside={e => e.preventDefault()}>
    <DialogHeader><DialogTitle>Review & organize career history</DialogTitle><DialogDescription>Build a clear picture of what you did, where, and when, without losing your original writing.</DialogDescription></DialogHeader>
    {state.error && <p role="alert" className="rounded-lg border border-destructive/30 p-3 text-sm text-destructive">{state.error}</p>}
    {state.busy && <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Working on your review. Please keep this window open.</p>}
    {state.review ? <ReviewWorkspace state={state} /> : <fieldset disabled={state.busy}><ReviewEntryPicker anchor={anchor} selected={state.selected} onChange={state.setSelected} onStart={state.start} busy={state.busy} /></fieldset>}
  </DialogContent></Dialog>;
}