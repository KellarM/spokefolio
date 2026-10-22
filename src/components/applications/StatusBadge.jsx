import React from 'react';
import { useStudioLanguage } from '@/lib/StudioLanguage';

const STYLES = {
  draft: 'bg-secondary text-secondary-foreground',
  ready: 'bg-primary/12 text-primary',
  not_applied: 'bg-secondary text-secondary-foreground',
  applied: 'bg-resume-brass/15 text-resume-brass',
  contacted: 'bg-sky-500/20 text-sky-300',
  interviewing: 'bg-amber-100 text-amber-800',
  offer: 'bg-accent text-accent-foreground',
  declined: 'bg-orange-500/20 text-orange-300',
  not_hired: 'bg-muted text-muted-foreground',
  rejected: 'bg-rose-100 text-rose-700'
};

export default function StatusBadge({ status }) {
  const { t } = useStudioLanguage();
  const key = STYLES[status] ? status : 'ready';
  return (
    <span className={`shrink-0 rounded-full px-3 py-1 font-body text-[12.5px] font-semibold ${STYLES[key]}`}>
      {t(`status.${key}`)}
    </span>
  );
}