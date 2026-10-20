import React from 'react';

const BANDS = {
  'Strong match': 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200',
  Competitive: 'border-primary/40 bg-primary/10 text-primary',
  'Needs work': 'border-amber-400/40 bg-amber-400/10 text-amber-200',
  'Off target': 'border-rose-400/40 bg-rose-400/10 text-rose-200'
};

// The last Résumé Run score, on the applications list, so the shelf can be scanned at a
// glance. Nothing is shown until that application has been run at least once.
export default function RunScoreBadge({ score, band }) {
  if (typeof score !== 'number') return null;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12.5px] font-medium ${BANDS[band] || BANDS['Needs work']}`}
      title={`Résumé Run: ${score}/100 — ${band || 'not graded'}`}
    >
      <span className="font-heading text-[15px] leading-none">{score}</span>
      {band}
    </span>
  );
}