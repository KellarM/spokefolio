import React from 'react';
import { SearchX, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import JobResultCard from '@/components/postings/JobResultCard';
import { useStudioLanguage } from '@/lib/StudioLanguage';

// The postings the last search found, with the way to keep, tailor or drop each one.
export default function JobSearchResults({ search, savingKey, onKeep, onTailor, onDismiss, onClear }) {
  const { t } = useStudioLanguage();
  const { results, note, mode, category, location, titles, distance, minPay, payPeriod } = search;

  const limits = [
    distance ? t('postings.withinKm', { count: distance }) : '',
    minPay
      ? t('postings.fromAmountPeriod', {
          amount: `$${Number(minPay).toLocaleString()}`,
          period: t(payPeriod === 'hour' ? 'postings.perHour' : 'postings.perYear')
        })
      : ''
  ].filter(Boolean);

  const what =
    mode === 'profile'
      ? t('postings.rolesThatFit', { titles: (titles || []).join(', ') || '' }) + (location ? ` · ${location}` : '')
      : [category, location].filter(Boolean).join(' · ');

  return (
    <section className="rounded-2xl border border-border/70 bg-secondary/40 px-4 py-5 sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="eyebrow">{t('postings.foundOnSites')}</p>
          <p className="mt-1 text-[12.5px] text-muted-foreground">
            {results.length === 1
              ? t('postings.countSingular', { count: 1 })
              : t('postings.countPlural', { count: results.length })}
            {what ? ` · ${what}` : ''}
            {limits.length ? ` · ${limits.join(' · ')}` : ''}
          </p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="rounded-full text-muted-foreground hover:text-destructive"
          onClick={onClear}
        >
          <X className="h-3.5 w-3.5" /> {t('postings.clearResults')}
        </Button>
      </div>

      {note && (
        <p className="mt-3 rounded-xl border border-border/70 bg-card px-3.5 py-2.5 text-[12.5px] leading-relaxed text-muted-foreground">
          {note}
        </p>
      )}

      {results.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-border px-5 py-10 text-center">
          <SearchX className="mx-auto h-5 w-5 text-muted-foreground" />
          <p className="mt-3 font-heading text-[18px]">{t('postings.nothingBack')}</p>
          <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-relaxed text-muted-foreground">
            {t('postings.tryBroader')}
          </p>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {results.map((result) => (
            <JobResultCard
              key={`${result.source_url || result.job_title}-${result.company}`}
              result={result}
              busy={savingKey === (result.source_url || result.job_title)}
              onKeep={() => onKeep(result)}
              onTailor={() => onTailor(result)}
              onDismiss={() => onDismiss(result)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}