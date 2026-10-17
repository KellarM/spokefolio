import React from 'react';

const STYLES = {
  draft: 'bg-secondary text-secondary-foreground',
  ready: 'bg-primary/12 text-primary',
  not_applied: 'bg-secondary text-secondary-foreground',
  applied: 'bg-resume-brass/15 text-resume-brass',
  contacted: 'bg-sky-500/20 text-sky-300',
  interviewing: 'bg-amber-100 text-amber-800',
  offer: 'bg-accent text-accent-foreground',
  not_hired: 'bg-muted text-muted-foreground',
  rejected: 'bg-rose-100 text-rose-700'
};

const LABELS = {
  draft: 'Draft',
  ready: 'Ready to send',
  not_applied: 'Not Applied',
  applied: 'Applied',
  contacted: 'Contacted',
  interviewing: 'Interviewing',
  offer: 'Offer',
  not_hired: 'Not Hired',
  rejected: 'Closed'
};

export default function StatusBadge({ status }) {
  const key = STYLES[status] ? status : 'ready';
  return (
    <span className={`shrink-0 rounded-full px-3 py-1 font-body text-[12.5px] font-semibold ${STYLES[key]}`}>
      {LABELS[key]}
    </span>
  );
}