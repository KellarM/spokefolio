import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Loader2, Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/applications/StatusBadge';
import SalaryPill from '@/components/applications/SalaryPill';
import JobLocation from '@/components/applications/JobLocation';
import DeleteApplicationButton from '@/components/applications/DeleteApplicationButton';
import RunScoreBadge from '@/components/applications/RunScoreBadge';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'ready', label: 'Ready' },
  { value: 'not_applied', label: 'Not Applied' },
  { value: 'applied', label: 'Applied' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'interviewing', label: 'Interviewing' },
  { value: 'offer', label: 'Offer' },
  { value: 'declined', label: 'Declined' },
  { value: 'not_hired', label: 'Not Hired' },
  { value: 'rejected', label: 'Closed' }
];

export default function Applications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
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

  const handleDeleted = (id) => setApplications((current) => current.filter((application) => application.id !== id));

  return (
    <div className="animate-rise">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="eyebrow">Your search</p>
          <h1 className="mt-3 font-heading text-[30px] leading-tight tracking-tight sm:text-[36px]">Applications</h1>
          <p className="mt-3 text-[14.5px] leading-relaxed text-muted-foreground">
            Every tailored résumé you have generated, with the posting it was written for.
          </p>
        </div>
        <Button asChild className="rounded-full">
          <Link to="/tailor-application">
            <Plus className="mr-2 h-4 w-4" /> Tailor a résumé
          </Link>
        </Button>
      </header>

      <div className="mt-7 flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            className={`rounded-full border px-3.5 py-1.5 text-[13px] transition-colors ${
              filter === item.value
                ? 'border-transparent bg-primary text-primary-foreground'
                : 'border-border/70 text-muted-foreground hover:text-foreground'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {locating && (
        <p className="mt-4 flex items-center gap-2 text-[13px] text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Finding work-site addresses and drive times…
        </p>
      )}

      {loading ? (
        <div className="mt-8 flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading your applications…
        </div>
      ) : visible.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border px-6 py-14 text-center">
          <p className="font-heading text-[20px]">Nothing here yet</p>
          <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-muted-foreground">
            Paste a job posting and you will get a résumé written for that role, saved here with its status.
          </p>
          <Button asChild className="mt-5 rounded-full">
            <Link to="/tailor-application">
              Tailor your first résumé <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      ) : (
        <ul className="mt-6 space-y-4 font-body">
          {visible.map((application) => (
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
                    {application.job_title || 'Tailored résumé'}
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
    </div>
  );
}