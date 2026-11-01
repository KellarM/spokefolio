import React from 'react';
import { HelpCircle } from 'lucide-react';

// The guide's second entrance: a quiet gold link inside an empty state, so a
// client who has nothing on the page yet can read how the page works before
// they have anything to look at.
export default function GuidePrompt({ label, onClick, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-[#E5C264] underline decoration-[#D4AF37]/40 decoration-1 underline-offset-4 transition-colors hover:text-[#F5D889] hover:decoration-[#D4AF37] ${className}`}
    >
      <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </button>
  );
}
