import React from 'react';
import { SearchX } from 'lucide-react';
import JobResultCard from '@/components/postings/JobResultCard';

// The postings the last search found, with the way to keep or tailor each one.
export default function JobSearchResults({ search, savingKey, onKeep, onTailor }) {
  const { results, note, mode, category, location } = search;
  const what = mode === 'profile' ? `Roles that fit your history${location ? ` · ${location}` : ''}` : [category, location].filter(Boolean).join(' · ');

  return (
    <section className="rounded-2xl border border-border/70 bg-secondary/40 px-4 py-5 sm:px-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="eyebrow">Found on the job sites</p>
        <p className="text-[12.5px] text-muted-foreground">
          {results.length} {results.length === 1 ? 'posting' : 'postings'}
          {what ? ` · ${what}` : ''}
        </p>
      </div>

      {note && (
        <p className="mt-3 rounded-xl border border-border/70 bg-card px-3.5 py-2.5 text-[12.5px] leading-relaxed text-muted-foreground">
          {note}
        </p>
      )}

      {results.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-border px-5 py-10 text-center">
          <SearchX className="mx-auto h-5 w-5 text-muted-foreground" />
          <p className="mt-3 font-heading text-[18px]">Nothing came back for this search</p>
          <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-relaxed text-muted-foreground">
            Try a broader category, or a nearby city or region.
          </p>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {results.map((result) => {
            const key = `${result.source_url || result.job_title}-${result.company}`;
            return (
              <JobResultCard
                key={key}
                result={result}
                busy={savingKey === (result.source_url || result.job_title)}
                onKeep={() => onKeep(result)}
                onTailor={() => onTailor(result)}
              />
            );
          })}
        </ul>
      )}
    </section>
  );
}