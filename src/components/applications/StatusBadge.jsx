import React from 'react';

const STYLES = {
  draft: 'bg-secondary text-secondary-foreground',
  ready: 'bg-accent/10 text-accent',
  not_applied: 'bg-secondary text-secondary-foreground',
  applied: 'bg-amber-100 text-amber-800',
  interviewing: 'bg-blue-100 text-blue-800',
  offer: 'bg-emerald-100 text-emerald-800',
  not_hired: 'bg-slate-200 text-slate-700',
  rejected: 'bg-rose-100 text-rose-700'
};

const LABELS = {
  draft: 'Draft',
  ready: 'Ready to send',
  not_applied: 'Not Applied',
  applied: 'Applied',
  interviewing: 'Interviewing',
  offer: 'Offer',
  not_hired: 'Not Hired',
  rejected: 'Closed'
};

export default function StatusBadge({ status }) {
  const key = STYLES[status] ? status : 'ready';
  return (
    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${STYLES[key]}`}>
      {LABELS[key]}
    </span>
  );
}