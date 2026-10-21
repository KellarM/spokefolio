import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Sparkles, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import JobLocation from '@/components/applications/JobLocation';

const hostOf = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch (error) {
    return '';
  }
};

// One posting kept in the app, with the way into tailoring it.
export default function PostingCard({ posting, onDelete }) {
  const words = (posting.job_description || '').trim().split(/\s+/).filter(Boolean).length;
  const host = hostOf(posting.source_url);
  const tailored = posting.status === 'tailored' && posting.application_id;
  const source =
    posting.imported_from === 'search'
      ? 'found in a job search'
      : host
        ? `read from ${host}`
        : posting.imported_from === 'link'
          ? 'link kept'
          : 'pasted text';

  return (
    <li className="rounded-2xl border border-border/70 bg-card p-5 transition-all hover:border-accent/40">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-heading text-[18px]">{posting.job_title || 'Posting without a title'}</p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {[
              posting.company,
              posting.created_date ? new Date(posting.created_date).toLocaleDateString() : ''
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
          <JobLocation
            address={posting.work_address}
            distanceKm={posting.drive_distance_km}
            minutes={posting.drive_minutes}
          />
          <p className="mt-1.5 text-[12px] text-muted-foreground">
            {words} words · {source}
          </p>
        </div>
        <span
          className={
            tailored
              ? 'rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[12px] font-medium text-accent'
              : 'rounded-full border border-border/70 px-3 py-1 text-[12px] text-muted-foreground'
          }
        >
          {tailored ? 'Résumé tailored' : 'Saved'}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button asChild size="sm" className="rounded-full">
          <Link to={`/tailor-application?posting=${posting.id}`}>
            <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Tailor a résumé
          </Link>
        </Button>
        {posting.source_url && (
          <Button asChild size="sm" variant="secondary" className="rounded-full">
            <a href={posting.source_url} target="_blank" rel="noreferrer">
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Open posting
            </a>
          </Button>
        )}
        {tailored && (
          <Button asChild size="sm" variant="ghost" className="rounded-full">
            <Link to={`/application/${posting.application_id}`}>View the résumé</Link>
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="ml-auto rounded-full text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(posting)}
        >
          <Trash2 className="h-3.5 w-3.5" /> Remove
        </Button>
      </div>
    </li>
  );
}