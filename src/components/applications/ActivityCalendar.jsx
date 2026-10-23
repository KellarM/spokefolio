import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useStudioLanguage } from '@/lib/StudioLanguage';

// One colour per status, in the studio's own palette: gold marks the ones
// still moving forward, reds and greys close the story out.
const STATUS_COLORS = {
  ready: 'bg-primary',
  not_applied: 'bg-slate-400',
  applied: 'bg-blue-400',
  contacted: 'bg-sky-300',
  interviewing: 'bg-violet-400',
  offer: 'bg-emerald-400',
  declined: 'bg-orange-300',
  not_hired: 'bg-rose-400',
  rejected: 'bg-zinc-500'
};

const STATUS_ORDER = Object.keys(STATUS_COLORS);

// The language the studio speaks, as a BCP-47 locale: month names and the
// weekday initials follow it, so the calendar reads natively everywhere.
const LOCALES = {
  English: 'en-CA', Español: 'es-ES', Français: 'fr-CA', Deutsch: 'de-DE',
  Italiano: 'it-IT', 'Português': 'pt-BR'
};

// One application, per local day, with its status colour and its count.
const dayCounts = (applications) => {
  const byDay = new Map();
  for (const application of applications || []) {
    if (!application.created_date) continue;
    const date = new Date(application.created_date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const bucket = byDay.get(key) || {};
    bucket[application.status] = (bucket[application.status] || 0) + 1;
    byDay.set(key, bucket);
  }
  return byDay;
};

export default function ActivityCalendar({ applications }) {
  const { t, language } = useStudioLanguage();
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selected, setSelected] = useState(null);

  const locale = LOCALES[language] || 'en-CA';
  const byDay = useMemo(() => dayCounts(applications), [applications]);

  // Escape closes the box, as everywhere else in the studio.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // S M T W T F S, in the studio's language; Sunday first, as specified.
  const weekdays = useMemo(() => {
    const names = [];
    const formatter = new Intl.DateTimeFormat(locale, { weekday: 'narrow' });
    for (let day = 0; day < 7; day += 1) {
      names.push(formatter.format(new Date(2026, 9, 4 + day)));
    }
    return names;
  }, [locale]);

  // The cells: the month's own days, each stamped with its weekday slot.
  const cells = useMemo(() => {
    const year = month.getFullYear();
    const index = month.getMonth();
    const daysInMonth = new Date(year, index + 1, 0).getDate();
    const leading = new Date(year, index, 1).getDay();
    const list = [];
    for (let blank = 0; blank < leading; blank += 1) list.push(null);
    for (let day = 1; day <= daysInMonth; day += 1) {
      const key = `${year}-${String(index + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      list.push({ day, key, weekday: (leading + day - 1) % 7 });
    }
    return list;
  }, [month]);

  const todayKey = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  })();

  const monthLabel = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(month);
  const selectedApplications = (applications || []).filter((application) => {
    if (!application.created_date || !selected) return false;
    const date = new Date(application.created_date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return key === selected;
  });

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 text-[13px] font-medium text-primary transition-colors hover:bg-primary/20"
      >
        <CalendarDays className="h-4 w-4" /> {t('applications.calendarButton')}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={t('applications.calendarButton')}
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div className="mx-auto w-full max-w-4xl rounded-2xl border border-primary/30 bg-card p-5 text-card-foreground shadow-2xl sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-heading text-[22px] tracking-tight sm:text-[26px]">
                {t('applications.calendarTitle')}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t('common.close')}
                className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <button
                type="button"
                aria-label={t('applications.previousMonth')}
                onClick={() => {
                  setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1));
                  setSelected(null);
                }}
                className="rounded-full border border-border/70 p-1.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <p className="font-heading text-[18px] tracking-tight">{monthLabel}</p>
              <button
                type="button"
                aria-label={t('applications.nextMonth')}
                onClick={() => {
                  setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1));
                  setSelected(null);
                }}
                className="rounded-full border border-border/70 p-1.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {weekdays.map((name, index) => (
                <span key={`${name}-${index}`}>{name}</span>
              ))}
            </div>

            <div className="mt-1 grid grid-cols-7 gap-1">
              {cells.map((cell, index) => {
                if (!cell) return <span key={`blank-${index}`} className="min-h-[72px]" />;
                const counts = byDay.get(cell.key) || {};
                const marks = STATUS_ORDER.filter((status) => counts[status]);
                const isToday = cell.key === todayKey;
                const isSelected = cell.key === selected;
                return (
                  <button
                    key={cell.key}
                    type="button"
                    onClick={() => setSelected(isSelected ? null : cell.key)}
                    className={`flex min-h-[72px] flex-col rounded-lg border p-1.5 text-left transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-border/50 hover:border-primary/40 hover:bg-accent/50'
                    } ${isToday ? 'ring-1 ring-primary' : ''}`}
                  >
                    <span className={`text-[12.5px] ${marks.length ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {cell.day}
                    </span>
                    <span className="mt-auto flex flex-wrap gap-1 pt-1">
                      {marks.map((status) => (
                        <span
                          key={status}
                          className="inline-flex items-center gap-0.5 rounded-full bg-background/60 px-1 text-[10px] leading-4 text-foreground"
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${STATUS_COLORS[status]}`} />
                          {counts[status]}
                        </span>
                      ))}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-border/60 pt-3 text-[12px] text-muted-foreground">
              {STATUS_ORDER.map((status) => (
                <span key={status} className="inline-flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${STATUS_COLORS[status]}`} />
                  {t(`status.${status}`)}
                </span>
              ))}
            </div>

            {selected && (
              <div className="mt-4 border-t border-border/60 pt-3">
                <p className="text-[13px] font-semibold text-foreground">
                  {new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(
                    new Date(`${selected}T12:00:00`)
                  )}
                </p>
                {selectedApplications.length === 0 ? (
                  <p className="mt-1 text-[12.5px] text-muted-foreground">{t('applications.nothingThatDay')}</p>
                ) : (
                  <ul className="mt-2 space-y-1.5">
                    {selectedApplications.map((application) => (
                      <li key={application.id} className="flex items-center gap-2 text-[13px]">
                        <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_COLORS[application.status] || 'bg-muted-foreground'}`} />
                        <span className="font-medium text-foreground">{application.job_title || application.title || t('applications.untitled')}</span>
                        <span className="text-muted-foreground">· {application.company || ''}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
