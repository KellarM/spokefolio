import React from 'react';
import { CheckCircle2, CircleDashed, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// The result of a finished drill, in one line each: the score out of 100, the
// hiring verdict, and the two numbers that make up the score so it never reads
// as a black box. Renders nothing until a drill has been wrapped up, so the
// pages that carry it look exactly as they did before.
const VERDICTS = {
  yes: {
    Icon: CheckCircle2,
    label: 'You would get the job',
    className: 'border-emerald-400/50 bg-emerald-400/10 text-emerald-300',
  },
  next_round: {
    Icon: CircleDashed,
    label: 'Worth another conversation',
    className: 'border-primary/50 bg-primary/10 text-primary',
  },
  no: {
    Icon: XCircle,
    label: 'Not this one',
    className: 'border-destructive/50 bg-destructive/10 text-destructive',
  },
};

export default function InterviewScorecard({ application, session }) {
  const summary = session?.summary;
  if (!summary || typeof summary.score !== 'number') return null;

  const verdict = VERDICTS[summary.verdict] || null;
  const when = session.finished_at || session.started_at;
  const roles = [application?.company, application?.job_title].filter(Boolean).join(' · ');

  return (
    <section className="mb-6 rounded-2xl border border-primary/40 bg-card p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="eyebrow">Interview result</p>
        <p className="text-[12.5px] text-muted-foreground">
          {[
            roles,
            when ? new Date(when).toLocaleDateString('en-CA', { dateStyle: 'medium' }) : '',
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-start gap-x-10 gap-y-4">
        <div>
          <p className="font-heading text-[46px] leading-none text-primary">
            {summary.score}
            <span className="ml-1 text-[18px] text-muted-foreground">/ 100</span>
          </p>
          <p className="mt-1.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Interview score
          </p>
        </div>

        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Final position
          </p>
          {verdict ? (
            <span
              className={cn(
                'mt-1.5 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[14px] font-semibold',
                verdict.className
              )}
            >
              <verdict.Icon className="h-3.5 w-3.5" /> {verdict.label}
            </span>
          ) : (
            <p className="mt-1.5 text-[14px] text-muted-foreground">Not decided</p>
          )}
        </div>

        <p className="ml-auto self-end text-[12.5px] text-muted-foreground">
          {`Answers ${summary.interview_score ?? '—'}/100`}
          {typeof summary.resume_fit === 'number'
            ? ` · Résumé fit ${summary.resume_fit}/100`
            : ' · Résumé not checked yet'}
        </p>
      </div>
    </section>
  );
}