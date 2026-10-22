import React from 'react';
import { ExternalLink, Loader2, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import JobLocation from '@/components/applications/JobLocation';
import { useStudioLanguage } from '@/lib/StudioLanguage';

const hostOf = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch (error) {
    return '';
  }
};

// One posting the search turned up, with the ways forward: keep it, write a résumé for it, or drop it.
export default function JobResultCard({ result, busy, onKeep, onTailor, onDismiss }) {
  const { t } = useStudioLanguage();
  const host = hostOf(result.source_url);
  const badge =
    result.origin === 'partner' && result.partner_source
      ? t('postings.viaJobBank', { name: result.partner_source.replace(/^www\./i, '') })
      : result.origin === 'jobbank'
        ? t('postings.jobBank')
        : '';

  return (
    <li className="rounded-2xl border border-border/70 bg-card p-5 transition-all hover:border-accent/40">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <p className="font-heading text-[17px] leading-snug">{result.job_title}</p>
        {badge && (
          <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-[0.12em] text-accent">
            {badge}
          </span>
        )}
      </div>
      <p className="mt-1 text-[12.5px] text-muted-foreground">
        {result.company}
        {result.pay ? ` · ${result.pay}` : ''}
        {result.posted ? ` · ${result.posted}` : ''}
        {host ? ` · ${host}` : ''}
      </p>
      <JobLocation
        address={result.work_address}
        distanceKm={result.drive_distance_km}
        minutes={result.drive_minutes}
      />
      {result.summary && (
        <p className="mt-3 text-[13.5px] leading-relaxed text-foreground/90">{result.summary}</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button size="sm" className="rounded-full" onClick={onTailor} disabled={busy}>
          {busy ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
          )}
          {t('common.tailorResume')}
        </Button>
        <Button size="sm" variant="secondary" className="rounded-full" onClick={onKeep} disabled={busy}>
          {t('postings.keepPosting')}
        </Button>
        {result.source_url && (
          <Button asChild size="sm" variant="ghost" className="rounded-full">
            <a href={result.source_url} target="_blank" rel="noreferrer">
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> {t('common.openPosting')}
            </a>
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="ml-auto rounded-full text-muted-foreground hover:text-destructive"
          onClick={onDismiss}
        >
          <X className="h-3.5 w-3.5" /> {t('common.dismiss')}
        </Button>
      </div>
    </li>
  );
}