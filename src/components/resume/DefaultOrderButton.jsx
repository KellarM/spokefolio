import React from 'react';
import { Star } from 'lucide-react';

// Saves the job order the candidate arranged as the standing order every new résumé starts
// from. Individual résumés can still be rearranged for one posting without touching it.
export default function DefaultOrderButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="New tailored résumés will start in this job order"
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
    >
      <Star className="h-3 w-3" /> Use as my default order
    </button>
  );
}