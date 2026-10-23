import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Loader2, Pencil, StickyNote, Trash2, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { useStudioLanguage } from '@/lib/StudioLanguage';

// One colour per status, each in its own family so no two read alike on
// the dark background: gold for the ones still moving forward, blue and
// cyan for the pipeline, red and magenta for the two ways a story ends.
const STATUS_COLORS = {
  ready: 'bg-primary',
  not_applied: 'bg-slate-400',
  applied: 'bg-blue-400',
  contacted: 'bg-cyan-400',
  interviewing: 'bg-violet-400',
  offer: 'bg-emerald-400',
  declined: 'bg-red-500',
  not_hired: 'bg-fuchsia-500',
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

const localDayKey = (value) => {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export default function ActivityCalendar({ applications }) {
  const { t, language } = useStudioLanguage();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState(null);
  const [notes, setNotes] = useState([]);
  const [events, setEvents] = useState([]);
  const [noteDraft, setNoteDraft] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [navDir, setNavDir] = useState(1);

  const locale = LOCALES[language] || 'en-CA';
  const byDay = useMemo(() => dayCounts(applications), [applications]);
  const notesListByDay = useMemo(() => {
    const map = new Map();
    for (const note of notes || []) {
      if (!note.date) continue;
      const list = map.get(note.date) || [];
      list.push(note);
      map.set(note.date, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0));
    }
    return map;
  }, [notes]);

  // The status history, per day - the log outlives the applications, so
  // deleted ones still tell their story here.
  const eventsByDay = useMemo(() => {
    const map = new Map();
    for (const event of events || []) {
      const key = event.interview_at ? localDayKey(event.interview_at) : localDayKey(event.created_date);
      if (!key) continue;
      const list = map.get(key) || [];
      list.push(event);
      map.set(key, list);
    }
    return map;
  }, [events]);

  // Interview days, for the bold gold marker in the grid.
  const interviewByDay = useMemo(() => {
    const map = new Map();
    for (const event of events || []) {
      if (!event.interview_at) continue;
      const key = localDayKey(event.interview_at);
      const list = map.get(key) || [];
      list.push(event);
      map.set(key, list);
    }
    return map;
  }, [events]);

  // The next interview still ahead of now, if one is scheduled. An
  // application that has moved past Interviewing no longer counts as
  // upcoming; a deleted one cannot be checked, so its moment stays.
  const upcomingInterview = useMemo(() => {
    const now = Date.now();
    const statusById = new Map((applications || []).map((application) => [application.id, application.status]));
    return (events || [])
      .filter((event) => {
        if (!event.interview_at || new Date(event.interview_at).getTime() <= now) return false;
        if (!statusById.has(event.application_id)) return true;
        return statusById.get(event.application_id) === 'interviewing';
      })
      .sort((a, b) => new Date(a.interview_at) - new Date(b.interview_at))[0] || null;
  }, [events, applications]);

  // The day notes load with the calendar, not with the page.
  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const [noteRecords, eventRecords] = await Promise.all([
          base44.entities.DayNote.list('-created_date', 200),
          base44.entities.StatusEvent.list('-created_date', 500)
        ]);
        if (!cancelled) {
          setNotes(noteRecords || []);
          setEvents(eventRecords || []);
        }
      } catch {
        // A sync that has not caught up yet shows no notes, not a broken page.
        if (!cancelled) {
          setNotes([]);
          setEvents([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  // Escape closes the day box first; a second Escape closes the calendar.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key !== 'Escape') return;
      if (selectedDay) setSelectedDay(null);
      else setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, selectedDay]);

  // S/M T W T F S, in the studio's language; Sunday first, as specified.
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
      list.push({ day, key });
    }
    return list;
  }, [month]);

  const todayKey = localDayKey(new Date());

  // The month's story at a glance: how many applications were created this
  // month, how many interviews were scheduled in it, and how many offers
  // landed in it.
  const monthSummary = useMemo(() => {
    const prefix = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
    let applicationsCount = 0;
    for (const [key, counts] of byDay) {
      if (key.startsWith(prefix)) applicationsCount += Object.values(counts).reduce((sum, n) => sum + n, 0);
    }
    let interviews = 0;
    let offers = 0;
    for (const event of events || []) {
      if (event.interview_at && localDayKey(event.interview_at).startsWith(prefix)) interviews += 1;
      if (event.status === 'offer' && localDayKey(event.created_date).startsWith(prefix)) offers += 1;
    }
    return { applications: applicationsCount, interviews, offers };
  }, [month, byDay, events]);

  const monthLabel = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(month);
  const selectedDate = selectedDay ? new Date(`${selectedDay}T12:00:00`) : null;
  const selectedApplications = (applications || []).filter(
    (application) => application.created_date && localDayKey(application.created_date) === selectedDay
  );
  const dayNotes = selectedDay ? notesListByDay.get(selectedDay) || [] : [];

  const selectedEvents = selectedDay ? eventsByDay.get(selectedDay) || [] : [];
  const applicationIds = new Set((applications || []).map((application) => application.id));
  // Creation shows through the applications list above; the rest of the
  // history - every move after the start, and deleted applications included -
  // shows here.
  const historyEvents = selectedEvents.filter(
    (event) => !(event.initial && applicationIds.has(event.application_id))
  );

  const openDay = (key) => {
    setSelectedDay(key);
    // The day's saved notes are listed inside; the composer starts empty
    // so a new note never overwrites an old one.
    setNoteDraft('');
    setEditingNote(null);
  };

  const saveNote = async () => {
    if (!selectedDay) return;
    const text = noteDraft.trim();
    if (!editingNote && !text) return;
    setSavingNote(true);
    try {
      if (editingNote) {
        await base44.entities.DayNote.update(editingNote, { note: text });
        setNotes((all) => all.map((note) => (note.id === editingNote ? { ...note, note: text } : note)));
        setEditingNote(null);
        toast({ title: t('applications.noteSaved') });
      } else {
        const created = await base44.entities.DayNote.create({ date: selectedDay, note: text });
        setNotes((all) => [...all, created]);
        toast({ title: t('applications.noteAdded') });
      }
      setNoteDraft('');
    } catch (error) {
      toast({ title: t('applications.noteError'), variant: 'destructive' });
    }
    setSavingNote(false);
  };

  const startEdit = (note) => {
    setEditingNote(note.id);
    setNoteDraft(note.note || '');
  };

  const cancelEdit = () => {
    setEditingNote(null);
    setNoteDraft('');
  };

  const deleteNote = async (id) => {
    try {
      await base44.entities.DayNote.delete(id);
      setNotes((all) => all.filter((note) => note.id !== id));
      if (editingNote === id) cancelEdit();
      toast({ title: t('applications.noteDeleted') });
    } catch (error) {
      toast({ title: t('applications.noteError'), variant: 'destructive' });
    }
  };

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

            {/* The month's story: navigation on either side, the label and
                its summary numbers in the middle. */}
            <div className="mt-5 flex items-center justify-between gap-3">
              <button
                type="button"
                aria-label={t('applications.previousMonth')}
                onClick={() => {
                  setNavDir(-1);
                  setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1));
                  setSelectedDay(null);
                }}
                className="rounded-full border border-border/70 bg-accent/40 p-2 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                <ChevronLeft className="h-[18px] w-[18px]" />
              </button>
              <div className="text-center">
                <p className="font-heading text-[20px] tracking-tight sm:text-[22px]">{monthLabel}</p>
                {(monthSummary.applications > 0 || monthSummary.interviews > 0 || monthSummary.offers > 0) && (
                  <div className="mt-1.5 flex flex-wrap items-center justify-center gap-1.5">
                    {monthSummary.applications > 0 && (
                      <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                        {t('applications.monthApplications', { count: monthSummary.applications })}
                      </span>
                    )}
                    {monthSummary.interviews > 0 && (
                      <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                        {t('applications.monthInterviews', { count: monthSummary.interviews })}
                      </span>
                    )}
                    {monthSummary.offers > 0 && (
                      <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                        {t('applications.monthOffers', { count: monthSummary.offers })}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <button
                type="button"
                aria-label={t('applications.nextMonth')}
                onClick={() => {
                  setNavDir(1);
                  setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1));
                  setSelectedDay(null);
                }}
                className="rounded-full border border-border/70 bg-accent/40 p-2 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                <ChevronRight className="h-[18px] w-[18px]" />
              </button>
            </div>

            {/* The loudest thing in the room, but only when it needs to be. */}
            {upcomingInterview && (
              <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-primary/50 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent px-4 py-3">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
                  <CalendarDays className="h-3.5 w-3.5" /> {t('applications.upcomingInterview')}
                </span>
                <span className="text-[14px] font-semibold text-foreground">
                  {upcomingInterview.job_title || t('applications.untitled')}
                  {upcomingInterview.company ? ` · ${upcomingInterview.company}` : ''}
                </span>
                <span className="text-[13px] text-muted-foreground">
                  {new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(
                    new Date(upcomingInterview.interview_at)
                  )}
                  {upcomingInterview.interview_at.includes('T') &&
                    ` · ${new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(
                      new Date(upcomingInterview.interview_at)
                    )}`}
                </span>
              </div>
            )}

            <div className="mt-5 grid grid-cols-7 gap-1.5 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {weekdays.map((name, index) => (
                <span key={`${name}-${index}`}>{name}</span>
              ))}
            </div>

            {/* Tiles, not a table: raised surfaces for the days that carry
                something, quiet gaps for the ones that do not. The month
                slides in from the side it was navigated from. */}
            <style>{`
              @keyframes cal-in-next { from { opacity: 0; transform: translateX(14px); } to { opacity: 1; transform: translateX(0); } }
              @keyframes cal-in-prev { from { opacity: 0; transform: translateX(-14px); } to { opacity: 1; transform: translateX(0); } }
            `}</style>
            <div
              className="mt-1.5 grid grid-cols-7 gap-1.5"
              key={monthLabel}
              style={{ animation: `${navDir === 1 ? 'cal-in-next' : 'cal-in-prev'} 240ms ease-out` }}
            >
              {cells.map((cell, index) => {
                if (!cell) return <span key={`blank-${index}`} className="min-h-[86px]" />;
                const counts = byDay.get(cell.key) || {};
                const marks = STATUS_ORDER.filter((status) => counts[status]);
                const hasNote = notesListByDay.has(cell.key);
                const isToday = cell.key === todayKey;
                const carries = marks.length > 0 || hasNote || interviewByDay.has(cell.key);
                const shown = marks.slice(0, 3);
                const overflow = marks.slice(3).reduce((total, status) => total + counts[status], 0);
                return (
                  <button
                    key={cell.key}
                    type="button"
                    onClick={() => openDay(cell.key)}
                    className={`group flex min-h-[86px] flex-col rounded-xl border p-2 text-left transition-all duration-200 hover:-translate-y-0.5 ${
                      selectedDay === cell.key
                        ? 'border-primary bg-primary/10 shadow-[0_0_0_1px_rgba(212,175,55,0.35)]'
                        : carries
                          ? 'border-border/60 bg-background/40 hover:border-primary/40 hover:bg-accent/40'
                          : 'border-transparent hover:border-border/60 hover:bg-accent/30'
                    }`}
                  >
                    <span className="flex w-full items-center justify-between gap-1">
                      {isToday ? (
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11.5px] font-bold text-primary-foreground">
                          {cell.day}
                        </span>
                      ) : (
                        <span className={`text-[12.5px] ${carries ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {cell.day}
                        </span>
                      )}
                      {hasNote && <StickyNote className="h-3 w-3 shrink-0 text-primary/70" aria-label={t('applications.noteLabel')} />}
                    </span>
                    <span className="mt-auto flex flex-wrap gap-1 pt-1">
                      {interviewByDay.has(cell.key) && (
                        <span className="inline-flex items-center rounded-md bg-primary px-1.5 py-[1px] text-[10px] font-semibold leading-4 text-primary-foreground">
                          {t('applications.interviewLabel')}
                        </span>
                      )}
                      {shown.map((status) => (
                        <span
                          key={status}
                          className="inline-flex items-center gap-1 rounded-md bg-background/70 px-1.5 py-[1px] text-[10px] font-medium leading-4 text-foreground ring-1 ring-border/50"
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${STATUS_COLORS[status]}`} />
                          {counts[status]}
                        </span>
                      ))}
                      {overflow > 0 && (
                        <span className="inline-flex items-center rounded-md px-1.5 py-[1px] text-[10px] font-medium leading-4 text-muted-foreground ring-1 ring-border/50">
                          +{overflow}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* The key to the dots - calm, small, two tidy rows at most. */}
            <div className="mt-5 flex flex-wrap gap-x-3.5 gap-y-1.5 border-t border-border/60 pt-3.5 text-[11px] text-muted-foreground">
              {STATUS_ORDER.map((status) => (
                <span key={status} className="inline-flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${STATUS_COLORS[status]}`} />
                  {t(`status.${status}`)}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {open && selectedDay && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={
            selectedDate
              ? new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(selectedDate)
              : selectedDay
          }
          onClick={(event) => {
            if (event.target === event.currentTarget) setSelectedDay(null);
          }}
        >
          <div className="mx-auto mt-[8vh] w-full max-w-lg rounded-2xl border border-primary/30 bg-card text-card-foreground shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-border/60 p-5">
              <h3 className="font-heading text-[18px] tracking-tight">
                {selectedDate
                  ? new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(selectedDate)
                  : selectedDay}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                aria-label={t('common.close')}
                className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[62vh] overflow-y-auto p-5">
              <p className="eyebrow">{t('applications.activityThisDay')}</p>
              {selectedApplications.length === 0 ? (
                <p className="mt-2 text-[13px] text-muted-foreground">{t('applications.nothingThatDay')}</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {selectedApplications.map((application) => (
                    <li key={application.id} className="flex items-start gap-2.5 rounded-lg border border-border/50 p-2.5 text-[13px]">
                      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${STATUS_COLORS[application.status] || 'bg-muted-foreground'}`} />
                      <span>
                        <span className="block font-medium text-foreground">{application.job_title || t('applications.untitled')}</span>
                        <span className="block text-muted-foreground">{application.company || ''}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {historyEvents.length > 0 && (
                <>
                  <p className="eyebrow mt-6">{t('applications.historyLabel')}</p>
                  <ul className="mt-2 space-y-1.5">
                    {historyEvents.map((event) => (
                      <li key={event.id} className="flex items-start gap-2.5 text-[13px]">
                        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${STATUS_COLORS[event.status] || 'bg-muted-foreground'}`} />
                        <span>
                          <span className="font-medium text-foreground">{t(`status.${event.status}`)}</span>
                          {event.interview_at && event.interview_at.includes('T') && (
                            <span className="text-primary"> · {new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(new Date(event.interview_at))}</span>
                          )}
                          <span className="block text-muted-foreground">
                            {event.job_title || t('applications.untitled')}
                            {event.company ? ` · ${event.company}` : ''}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              <p className="eyebrow mt-6">{t('applications.noteLabel')}</p>
              {dayNotes.length > 0 && (
                <ul className="mt-2 space-y-2">
                  {dayNotes.map((note) => (
                    <li
                      key={note.id}
                      className={`flex items-start justify-between gap-2.5 rounded-lg border p-3 ${
                        editingNote === note.id ? 'border-primary/60 bg-primary/10' : 'border-border/50 bg-background/40'
                      }`}
                    >
                      <span className="min-w-0 whitespace-pre-wrap text-[13.5px] leading-relaxed text-foreground">
                        {note.note}
                      </span>
                      <span className="flex shrink-0 items-center gap-1 pt-0.5">
                        <button
                          type="button"
                          onClick={() => startEdit(note)}
                          aria-label={t('applications.editNote')}
                          className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteNote(note.id)}
                          aria-label={t('applications.deleteNote')}
                          className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              <textarea
                value={noteDraft}
                onChange={(event) => setNoteDraft(event.target.value)}
                placeholder={t('applications.notePlaceholder')}
                rows={4}
                className="mt-2 w-full resize-y rounded-xl border border-border/70 bg-background px-3.5 py-2.5 text-[13.5px] leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
              <div className="mt-2.5 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={saveNote}
                  disabled={savingNote}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-1.5 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                >
                  {savingNote && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {editingNote ? t('applications.saveNote') : t('applications.addNote')}
                </button>
                {editingNote && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="inline-flex items-center rounded-full border border-border/70 px-4 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                  >
                    {t('common.cancel')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
