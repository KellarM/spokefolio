import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Loader2, Play, Plus, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ResumeRunDetail from '@/components/applications/ResumeRunDetail';
import RunFixProposal from '@/components/applications/RunFixProposal';

const BANDS = {
  'Strong match': {
    text: 'text-emerald-300',
    chip: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200',
    bar: 'bg-emerald-400',
    ring: 'border-emerald-400/35'
  },
  Competitive: {
    text: 'text-primary',
    chip: 'border-primary/40 bg-primary/10 text-primary',
    bar: 'bg-primary',
    ring: 'border-primary/35'
  },
  'Needs work': {
    text: 'text-amber-300',
    chip: 'border-amber-400/40 bg-amber-400/10 text-amber-200',
    bar: 'bg-amber-400',
    ring: 'border-amber-400/35'
  },
  'Off target': {
    text: 'text-rose-300',
    chip: 'border-rose-400/40 bg-rose-400/10 text-rose-200',
    bar: 'bg-rose-400',
    ring: 'border-rose-400/35'
  }
};

const FALLBACK = BANDS['Needs work'];

function barFor(score) {
  if (score >= 85) return BANDS['Strong match'].bar;
  if (score >= 70) return BANDS.Competitive.bar;
  if (score >= 55) return BANDS['Needs work'].bar;
  return BANDS['Off target'].bar;
}

// The Résumé Run: one scored pass over the résumé as it stands, with the parts of the grade
// broken out and the changes that would raise it most.
export default function ResumeRunPanel({
  run,
  history = [],
  onRun,
  running,
  onApplyFix,
  applyingIndex = null,
  proposal,
  onAcceptProposal,
  onDiscardProposal
}) {
  const band = (run && BANDS[run.band]) || FALLBACK;
  const previous = history.length > 1 ? history[1].score : null;
  const delta = run && typeof previous === 'number' ? run.score - previous : 0;

  // The breakdown folds away so the panel keeps its place on the page; the
  // score line stays in the header so a glance still answers 'how did it land'.
  // A fresh run opens the breakdown on its own - nobody runs the check to
  // then click it open again.
  const [open, setOpen] = useState(false);
  const lastRunId = useRef(run?.id);
  useEffect(() => {
    if (run?.id && lastRunId.current !== run.id) {
      lastRunId.current = run.id;
      setOpen(true);
    }
  }, [run?.id]);

  return (
    <section className="mt-7 rounded-2xl border border-border/70 bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-xl">
          <p className="eyebrow">Résumé Run</p>
          <h2 className="mt-2 font-heading text-[22px] leading-tight tracking-tight">How this résumé lands</h2>
          {run && !open ? (
            <p className="mt-2 flex flex-wrap items-center gap-2.5">
              <span className={`font-heading text-[20px] leading-none ${band.text}`}>{run.score}</span>
              <span className="text-[13px] text-muted-foreground">out of 100</span>
              <span className={`rounded-full border px-2.5 py-0.5 text-[12.5px] font-medium ${band.chip}`}>{run.band}</span>
              {delta !== 0 && (
                <span className={`flex items-center gap-1 text-[12.5px] ${delta > 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                  <TrendingUp className="h-3.5 w-3.5" />
                  {delta > 0 ? `+${delta}` : delta} since the last run
                </span>
              )}
            </p>
          ) : (
            <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
              One scored pass against this posting: what it answers, how strong the evidence reads, and whether the
              screening software can read it. Run it again after any edit to see the mark move.
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {run && (
            <Button variant="outline" size="sm" className="rounded-full" onClick={() => setOpen((prev) => !prev)} aria-expanded={open}>
              <ChevronDown className={`mr-1 h-4 w-4 transition-transform ${open ? '' : '-rotate-90'}`} />
              {open ? 'Hide the breakdown' : 'Show the breakdown'}
            </Button>
          )}
          <Button className="rounded-full" onClick={onRun} disabled={running}>
            {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
            {run ? 'Run again' : 'Run the check'}
          </Button>
        </div>
      </div>

      {running && !run && (
        <p className="mt-5 text-[13.5px] text-muted-foreground">Reading the résumé against the posting…</p>
      )}

      {!run && !running && (
        <p className="mt-5 text-[13.5px] text-muted-foreground">
          No run yet. The check marks the résumé against every priority the posting names and shows what to fix first.
        </p>
      )}

      {run && open && (
        <>
          <div className="mt-6 grid gap-6 lg:grid-cols-[230px_1fr]">
            <div className={`rounded-2xl border px-5 py-6 text-center ${band.ring}`}>
              <p className={`font-heading text-[54px] leading-none ${band.text}`}>{run.score}</p>
              <p className="mt-2 text-[12px] uppercase tracking-[0.18em] text-muted-foreground">out of 100</p>
              <p className={`mt-3 inline-block rounded-full border px-3 py-1 text-[13px] font-medium ${band.chip}`}>
                {run.band}
              </p>
              {delta !== 0 && (
                <p className={`mt-3 flex items-center justify-center gap-1.5 text-[12.5px] ${delta > 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                  <TrendingUp className="h-3.5 w-3.5" />
                  {delta > 0 ? `+${delta}` : delta} since the last run
                </p>
              )}
              {history.length > 1 && (
                <p className="mt-3 text-[12px] text-muted-foreground">
                  {[...history].reverse().map((item) => item.score).join(' → ')}
                </p>
              )}
            </div>

            <div>
              <p className="text-[14px] leading-relaxed text-foreground/90">{run.summary}</p>

              <div className="mt-5 space-y-4">
                {(run.dimensions || []).map((dimension) => (
                  <div key={dimension.key}>
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-[13.5px] font-medium text-foreground">{dimension.label}</p>
                      <p className="text-[13px] text-muted-foreground">
                        {dimension.score} / 100 · {dimension.weight}% of the grade
                      </p>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                      <div className={`h-full rounded-full ${barFor(dimension.score)}`} style={{ width: `${dimension.score}%` }} />
                    </div>
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">{dimension.note}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {(run.strengths || []).length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {(run.strengths || []).map((item, index) => (
                <span
                  key={index}
                  className="rounded-full border border-emerald-400/30 bg-emerald-400/5 px-3 py-1 text-[12.5px] text-emerald-100"
                >
                  {item}
                </span>
              ))}
            </div>
          )}

          {(run.fixes || []).length > 0 && (
            <div className="mt-6 rounded-2xl border border-accent/25 bg-accent/5 p-5">
              <p className="eyebrow">What moves the needle</p>
              <ul className="mt-3 space-y-3">
                {(run.fixes || []).map((fix, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="mt-0.5 shrink-0 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[12px] font-semibold text-primary">
                      +{fix.points}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-medium leading-snug text-foreground">{fix.title}</p>
                      <p className="mt-1 text-[13px] leading-relaxed text-foreground/80">{fix.detail}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onApplyFix(fix, index)}
                      disabled={applyingIndex !== null}
                      title="Write this change into the résumé, using only your own history"
                      className="mt-0.5 inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border border-primary/40 px-2.5 text-[12px] font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
                    >
                      {applyingIndex === index ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Plus className="h-3.5 w-3.5" />
                      )}
                      Add to résumé
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {proposal && (
            <RunFixProposal proposal={proposal} onAccept={onAcceptProposal} onDiscard={onDiscardProposal} />
          )}

          <ResumeRunDetail requirements={run.requirements} checks={run.checks} />
        </>
      )}
    </section>
  );
}