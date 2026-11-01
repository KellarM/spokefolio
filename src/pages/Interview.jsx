import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Building2, Loader2, RefreshCw, RotateCcw, UserPlus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useStudioLanguage } from '@/lib/StudioLanguage';
import { useTour } from '@/lib/TourContext';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import InstructionPopover from '@/components/guide/InstructionPopover';
import InterviewPanel from '@/components/applications/InterviewPanel';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import StatusBadge from '@/components/applications/StatusBadge';
import { interviewGuide } from '@/content/interviewGuide';
import { guideLabel } from '@/content/guideLabels';

// Step 5. The drill used to live inside one application, reachable only by opening
// that application first. Here the company is the first choice and the drill follows
// from it: pick the employer you are meeting, and the app reads that company once,
// then hands the room to its HR.
//
// The drill itself is unchanged - same panel, same backend, same records on the
// application - so a company picked here resumes whatever was started inside the
// application, and the applications page links here rather than duplicating it.
export default function Interview() {
  const { t, language } = useStudioLanguage();
  const tour = useTour();
  const [searchParams, setSearchParams] = useSearchParams();
  const guide = interviewGuide(language);

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(searchParams.get('application') || '');
  const [scanning, setScanning] = useState(false);
  const [scanFailed, setScanFailed] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  // The panel keeps its own answer text and voice state. Bumping this remounts it,
  // which is what "start over" and "new application" both need.
  const [attempt, setAttempt] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    let alive = true;
    base44.entities.JobApplication.list('-created_date', 200)
      .then((rows) => {
        if (alive) setApplications(Array.isArray(rows) ? rows : []);
      })
      .catch(() => {
        if (alive) setApplications([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => { alive = false; };
  }, []);

  const selected = useMemo(
    () => applications.find((row) => row.id === selectedId) || null,
    [applications, selectedId]
  );

  const patch = (id, changes) => {
    setApplications((rows) => rows.map((row) => (row.id === id ? { ...row, ...changes } : row)));
  };

  // The company is read once and cached on the application. A company whose brief is
  // already there costs nothing and must not be re-read on every visit; one that has
  // never been read, or whose last read failed, gets the lookup when it is chosen.
  const briefOnFile = Boolean(selected?.company_research?.overview);
  const research = async (application) => {
    if (!application) return;
    setScanning(true);
    setScanFailed(false);
    try {
      const response = await base44.functions.invoke('researchCompany', { application_id: application.id });
      const data = response?.data || {};
      if (data.research) {
        patch(application.id, {
          company_research: data.research,
          company_researched_at: data.researched_at || ''
        });
      } else {
        setScanFailed(true);
      }
    } catch (error) {
      // A missing brief is not a blocker: the interviewer works from the posting.
      setScanFailed(true);
    }
    setScanning(false);
  };

  useEffect(() => {
    if (!selected || briefOnFile || scanning) return;
    research(selected);
    // deps: the chosen company and whether its brief is already on file
  }, [selected?.id, briefOnFile]); // eslint-disable-line react-hooks/exhaustive-deps

  const choose = (id) => {
    setSelectedId(id);
    setScanFailed(false);
    setSearchParams(id ? { application: id } : {}, { replace: true });
  };

  const drills = Array.isArray(selected?.mock_interviews) ? selected.mock_interviews.length : 0;
  const activeDrill = Array.isArray(selected?.mock_interviews)
    ? selected.mock_interviews.find((session) => session.status === 'active') || null
    : null;
  const finishedDrills = Array.isArray(selected?.mock_interviews)
    ? selected.mock_interviews.filter((session) => session.status === 'finished').length
    : 0;

  // Start again: the drill in progress is discarded so the room opens clean. Finished
  // drills and their readiness reports are not touched - those are the record of work
  // already done, and they have their own delete control in the list.
  const startOver = async () => {
    if (!selected || !activeDrill) return;
    const remaining = selected.mock_interviews.filter((session) => session.id !== activeDrill.id);
    try {
      await base44.entities.JobApplication.update(selected.id, { mock_interviews: remaining });
      patch(selected.id, { mock_interviews: remaining });
      setAttempt((n) => n + 1);
      toast({ title: t('interview.startOverDone') });
    } catch (error) {
      toast({ title: t('interview.startOverFailed'), variant: 'destructive' });
    }
  };

  // A different employer: clear the choice, drop the panel's state, and put the cursor
  // back on the picker so the next company is one keystroke away.
  const newApplication = () => {
    setSelectedId('');
    setSearchParams({}, { replace: true });
    setScanFailed(false);
    setAttempt((n) => n + 1);
    requestAnimationFrame(() => document.getElementById('interview-company')?.focus());
  };
  const drillLabel = drills === 1 ? t('interview.drillCountOne') : t('interview.drillCountMany', { count: drills });

  return (
    <div className="animate-rise">
      <header className="max-w-2xl">
        <div className="mt-3 flex flex-wrap items-start gap-x-3 gap-y-2">
          <h1 className="font-heading text-[30px] leading-tight tracking-tight sm:text-[36px]">{t('interview.title')}</h1>
          <InstructionPopover
            open={guideOpen}
            onOpenChange={setGuideOpen}
            label={guideLabel(language)}
            className="mt-2"
            title={guide.title}
            intro={guide.intro}
            sections={guide.sections}
          />
        </div>
        <p className="mt-2 font-mono text-[16px] font-semibold uppercase tracking-[0.1em] text-white">{t('steps.five')}</p>
        <p className="mt-3 text-[14.5px] leading-relaxed text-muted-foreground">{t('interview.lede')}</p>
      </header>

      {loading ? (
        <div className="mt-8 flex items-center gap-2 text-[13.5px] text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> {t('interview.pickPlaceholder')}
        </div>
      ) : applications.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border px-6 py-10 text-center">
          <Building2 className="mx-auto h-6 w-6 text-muted-foreground" />
          <p className="mt-3 text-[14px] text-muted-foreground">{t('interview.noApplications')}</p>
          <Button asChild variant="secondary" className="mt-4 rounded-full">
            <Link to="/applications">{t('interview.goToApplications')}</Link>
          </Button>
        </div>
      ) : (
        <>
          <section data-tour="interview-picker" className="mt-8 max-w-2xl">
            <label htmlFor="interview-company" className="eyebrow block">{t('interview.pickLabel')}</label>
            <Select value={selectedId || undefined} onValueChange={choose}>
              <SelectTrigger id="interview-company" className="mt-2 rounded-full">
                <SelectValue placeholder={t('interview.pickPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {applications.map((application) => {
                  const count = Array.isArray(application.mock_interviews) ? application.mock_interviews.length : 0;
                  return (
                    <SelectItem key={application.id} value={application.id}>
                      <span className="truncate">
                        {application.company || t('interview.pickPlaceholder')}
                        {application.job_title ? ` — ${application.job_title}` : ''}
                        {count ? ` · ${count}` : ''}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <p className="mt-2 text-[12px] text-muted-foreground">{t('interview.pickHint')}</p>
          </section>

          {selected && (
            <section className="mt-8">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <h2 className="font-heading text-[22px] leading-tight">{selected.company || t('interview.pickPlaceholder')}</h2>
                <StatusBadge status={selected.status} />
                {drills > 0 && <span className="text-[12.5px] text-muted-foreground">{drillLabel}</span>}
                <Link to={`/application/${selected.id}`} className="ml-auto text-[12.5px] font-semibold text-accent underline-offset-4 hover:underline">
                  {t('interview.backToApplication')}
                </Link>
              </div>

              {/* Two ways out of a room: wipe this drill and begin again, or move to a
                  different employer entirely. The second was always possible from the
                  picker above, but nothing said so once a company was chosen. */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {activeDrill && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="secondary" size="sm" className="rounded-full">
                        <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> {t('interview.startOver')}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('interview.startOverTitle')}</AlertDialogTitle>
                        <AlertDialogDescription>{t('interview.startOverBody')}</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('interview.startOverCancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={startOver}>{t('interview.startOverConfirm')}</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                <Button variant="ghost" size="sm" className="rounded-full" onClick={newApplication}>
                  <UserPlus className="mr-1.5 h-3.5 w-3.5" /> {t('interview.newApplication')}
                </Button>
                {finishedDrills > 0 && (
                  <span className="text-[12.5px] text-muted-foreground">{t('interview.startOverKeeps', { count: finishedDrills })}</span>
                )}
              </div>

              {scanning && (
                <p className="mt-3 flex items-center gap-2 text-[12.5px] text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> {t('interview.scanning', { company: selected.company || '' })}
                </p>
              )}
              {!scanning && scanFailed && (
                <p className="mt-3 flex flex-wrap items-center gap-2 text-[12.5px] text-muted-foreground">
                  {t('interview.scanFailed')}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 rounded-full px-2 text-[12.5px]"
                    onClick={() => research(selected)}
                  >
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> {t('interview.scanRetry')}
                  </Button>
                </p>
              )}

              <div className="mt-5">
                <InterviewPanel
                  key={`${selected.id}:${attempt}`}
                  application={selected}
                  onApplicationUpdate={(changes) => patch(selected.id, changes)}
                  onDrillFinished={() => tour.announce('drill_done')}
                />
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
