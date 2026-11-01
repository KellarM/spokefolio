import React from 'react';
import { Clock, Eye, EyeOff, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useStudioLanguage } from '@/lib/StudioLanguage';

const TYPES = {
  work: 'history.typeWork',
  project: 'history.typeProject',
  education: 'history.typeEducation',
  certification: 'history.typeCertification',
  achievement: 'history.typeAchievement',
  testimonial: 'history.typeTestimonial',
  skill: 'history.typeSkill',
  other: 'history.typeOther'
};

export default function EntryList({ entries = [], activeId, selectedIds = [], onToggle, onEdit, onDelete, onReview, onHide }) {
  const { t } = useStudioLanguage();
  if (!entries.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border px-6 py-10 text-center">
        <p className="text-[14px] text-muted-foreground">
          {t('history.nothingCaptured')}
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-2.5">
      {entries.map((entry) => {
        const bullets = entry.grouped
          ? (entry.roles || []).flatMap((role) => role.accomplishments || [])
          : entry.accomplishments || [];
        const dates = [entry.start_date, entry.end_date].filter(Boolean).join(' – ');
        const selected = selectedIds.includes(entry.id);
        const hidden = Boolean(entry.hidden);
        return (
          <li
            key={entry.id}
            className={`group flex items-start gap-4 rounded-2xl border-[6px] border-white bg-gold px-5 py-4 shadow-lg shadow-black/30 transition-shadow ${
              entry.id === activeId ? 'ring-4 ring-accent/70' : ''
            } ${hidden ? 'opacity-60' : ''}`}
          >
            <Checkbox
              checked={selected}
              onCheckedChange={() => onToggle(entry)}
              aria-label={t('history.typeOther')}
              className="mt-1 shrink-0 border-2 border-black data-[state=checked]:border-black data-[state=checked]:bg-black data-[state=checked]:text-gold"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-black/10 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[#33280A] ring-1 ring-black/15">
                  {t(TYPES[entry.entry_type] || 'history.typeOther')}
                </span>
                {entry.grouped && (
                  <span className="rounded-full bg-black/10 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[#33280A] ring-1 ring-black/15">
                    {(entry.roles || []).length} {t('history.rolesInside')}
                  </span>
                )}
                {hidden && (
                  <span className="rounded-full bg-[#1A1A1A] px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-gold">
                    {t('history.hiddenTag')}
                  </span>
                )}
                {entry.status === 'draft' ? (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-amber-950 ring-1 ring-black/20">
                    {t('history.inProgress')}
                  </span>
                ) : (
                  <span className="rounded-full bg-black/10 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[#33280A] ring-1 ring-black/15">
                    {t('history.confirmed')}
                  </span>
                )}
              </div>
              <p className="mt-2 truncate font-heading text-[17px] font-bold text-black">{entry.title || t('history.untitledEntry')}</p>
              <p className="mt-0.5 truncate text-[13px] text-[#33280A]">
                {[entry.organization, entry.location, dates].filter(Boolean).join(' · ')}
              </p>
              {bullets[0] && <p className="mt-2 line-clamp-1 text-[13px] text-black/75">• {bullets[0]}</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                {entry.status === 'draft' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full border-[3px] border-black bg-transparent text-black hover:bg-black/10 hover:text-black"
                    onClick={() => onEdit(entry)}
                  >
                    <Clock className="mr-1.5 h-3.5 w-3.5" strokeWidth={3} /> {t('history.continueEntry')}
                  </Button>
                )}
                {onReview && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full border-[3px] border-black bg-transparent text-black hover:bg-black/10 hover:text-black"
                    onClick={() => onReview(entry)}
                  >
                    {t('history.reviewOrganize')}
                  </Button>
                )}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <span className="mr-1 hidden text-[11.5px] font-semibold text-black/70 sm:inline">
                {bullets.length} {bullets.length === 1 ? t('history.bullet') : t('history.bullets')}
              </span>
              {onHide && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-black hover:bg-black/10 hover:text-black"
                  aria-label={hidden ? t('history.unhideEntry') : t('history.hideEntry')}
                  title={hidden ? t('history.unhideEntry') : t('history.hideEntry')}
                  onClick={() => onHide(entry)}
                >
                  {hidden ? <Eye className="h-4 w-4" strokeWidth={3} /> : <EyeOff className="h-4 w-4" strokeWidth={3} />}
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-black hover:bg-black/10 hover:text-black"
                onClick={() => onEdit(entry)}
              >
                <Pencil className="h-4 w-4" strokeWidth={3} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-black hover:bg-black/10 hover:text-black"
                onClick={() => onDelete(entry)}
              >
                <Trash2 className="h-4 w-4" strokeWidth={3} />
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}