import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Loader2, Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/applications/StatusBadge';
import SalaryPill from '@/components/applications/SalaryPill';
import JobLocation from '@/components/applications/JobLocation';
import DeleteApplicationButton from '@/components/applications/DeleteApplicationButton';
import ActivityCalendar from '@/components/applications/ActivityCalendar';
import RunScoreBadge from '@/components/applications/RunScoreBadge';
import { useStudioLanguage } from '@/lib/StudioLanguage';

const FILTERS = ['all', 'ready', 'not_applied', 'applied', 'contacted', 'interviewing', 'offer', 'declined', 'not_hired', 'rejected'];

export default function Applications() {
  const { t } = useStudioLanguage();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [locating, setLocating] = useState(false);
  const [scores, setScores] = useState({});

  const load = useCallback(async () => {
    const [records, runRecords] = await Promise.all([
      base44.entities.JobApplication.list('-created_date', 100),
      base44.entities.ResumeRun.list('-created_date', 100).catch(() => [])
    ]);
    setApplications(records || []);
    // The badge shows the newest run of each application. The runs arrive newest first, so
    // the first one seen for an application is the one that counts.
    const latest = {};
    for (const run of runRecords || []) {
      if (run.application_id && !latest[run.application_id]) {
        latest[run.application_id] = { score: run.score, band: run.band };
      }
    }
    setScores(latest);
    setLoading(false);
    return records || [];
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let records = await load();
      // Postings that have not been placed on a map yet are looked up in the background, a batch at a time.
      try {
        for (let pass = 0; pass < 4 && !cancelled; pass += 1) {
          if (!records.some((item) => !item.location_checked)) break;
          setLocating(true);
          const response = await base44.functions.invoke('locateApplications', {});
          const { remaining } = response.data || {};
          records = await load();
          if (!remaining) break;
        }
      } catch (error) {
        // The list works without it, and the lookup can run again on the next visit.
      }
      if (!cancelled) setLocating(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const visible = filter === 'all' ? applications : applications.filter((application) => application.status === filter);

  // Ten applications per screen; the pager steps between them.
  const PAGE_SIZE = 10;
  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageItems = visible.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  const handleDeleted = (id) => setApplications((current) => current.filter((application) => application.id !== id));

  // Changing screens starts the page at the top, not wherever you scrolled to.
  const goToPage = (nextPage) => {
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="animate-rise">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="eyebrow">{t('common.yourSearch')}</p>
          <h1 className="mt-3 font-heading text-[30px] leading-tight tracking-tight sm:text-[36px]">{t('applications.title')}</h1>
          <p className="mt-3 text-[14.5px] leading-relaxed text-muted-foreground">
            {t('applications.lede')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ActivityCalendar applications={applications} />
          <Button asChild className="rounded-full">
            <Link to="/tailor-application">
              <Plus className="mr-2 h-4 w-4" /> {t('common.tailorResume')}
            </Link>
          </Button>
        </div>
      </header>

      <div className="mt-7 flex flex-wrap gap-2">
        {FILTERS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setFilter(value);
              setPage(0);
            }}
            className={`rounded-full border px-3.5 py-1.5 text-[13px] transition-colors ${
              filter === value
                ? 'border-transparent bg-primary text-primary-foreground'
                : 'border-border/70 text-muted-foreground hover:text-foreground'
            }`}
          >
            {t(`status.${value}`)}
          </button>
        ))}
      </div>

      {locating && (
        <p className="mt-4 flex items-center gap-2 text-[13px] text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> {t('common.findingAddresses')}
        </p>
      )}

      {loading ? (
        <div className="mt-8 flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> {t('applications.loading')}
        </div>
      ) : visible.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border px-6 py-14 text-center">
          <p className="font-heading text-[20px]">{t('applications.nothingYet')}</p>
          <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-muted-foreground">
            {t('applications.nothingDesc')}
          </p>
          <Button asChild className="mt-5 rounded-full">
            <Link to="/tailor-application">
              {t('applications.tailorFirst')} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      ) : (
        <ul className="mt-6 space-y-4 font-body">
          {pageItems.map((application) => (
            <li
              key={application.id}
              className="group flex items-stretch gap-3 rounded-2xl border border-border/70 bg-card px-6 py-5 transition-all hover:border-accent/40 hover:shadow-[0_18px_40px_-32px_rgba(16,24,40,0.5)]"
            >
              <Link
                to={`/application/${application.id}`}
                className="flex min-w-0 flex-1 flex-wrap items-start justify-between gap-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-body text-[21px] font-semibold tracking-tight text-foreground sm:text-[22px]">
                    {application.job_title || t('common.tailoredResume')}
                  </p>
                  <p className="mt-1.5 flex flex-wrap items-center gap-2.5 text-[15px] font-medium text-foreground/85">
                    <span>
                      {[application.company, application.created_date ? new Date(application.created_date).toLocaleDateString() : '']
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                    <SalaryPill description={application.job_description} />
                  </p>
                  <JobLocation
                    address={application.work_address}
                    distanceKm={application.drive_distance_km}
                    minutes={application.drive_minutes}
                  />
                  {application.match_summary && (
                    <p className="mt-3 line-clamp-3 max-w-3xl text-[15.5px] leading-relaxed text-foreground/90">
                      {application.match_summary}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <RunScoreBadge score={scores[application.id]?.score} band={scores[application.id]?.band} />
                  <StatusBadge status={application.status} />
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
              <DeleteApplicationButton application={application} onDeleted={handleDeleted} />
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="mt-7 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => goToPage(Math.max(0, safePage - 1))}
            disabled={safePage === 0}
            className="inline-flex h-9 items-center rounded-full border border-border/70 px-4 text-[13px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="mr-1.5 h-4 w-4" /> {t('applications.previousPage')}
          </button>
          <span className="text-[13px] font-medium text-muted-foreground">
            {t('applications.pageOf', { page: safePage + 1, total: totalPages })}
          </span>
          <button
            type="button"
            onClick={() => goToPage(Math.min(totalPages - 1, safePage + 1))}
            disabled={safePage === totalPages - 1}
            className="inline-flex h-9 items-center rounded-full border border-border/70 px-4 text-[13px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t('applications.nextPage')} <ChevronRight className="ml-1.5 h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}