import React from 'react';
import { AlertTriangle, Building2, Loader2, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const facts = [['founded', 'Founded'], ['years_active', 'Length of existence'], ['headquarters', 'Headquarters'], ['size', 'Size'], ['ownership', 'Ownership']];

function Section({ title, children }) {
  return (
    <section className="mt-6">
      <p className="eyebrow">{title}</p>
      <div className="mt-2.5 space-y-2.5 text-[13.5px] leading-relaxed text-foreground/90">{children}</div>
    </section>
  );
}

function Bullets({ items, className = '' }) {
  if (!items || !items.length) return null;
  return (
    <ul className={`space-y-2 ${className}`}>
      {items.map((item, index) => (
        <li key={index} className="flex gap-2.5">
          <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent/60" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function CompanyBriefDialog({ open, onOpenChange, company, research, loading, error, researchedAt, onRefresh }) {
  // Sources that could not name anyone give a placeholder instead of a person; the overview says it better.
  const namedManagement = (research?.management || []).filter((person) => person.name && !/not publicly|not disclosed|unknown|n\/?a/i.test(person.name));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] w-[96vw] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="pr-10">{company || 'This employer'}</DialogTitle>
          <DialogDescription>What public sources say about this company, kept with the application.</DialogDescription>
        </DialogHeader>

        {loading && (
          <p role="status" className="flex items-center gap-2.5 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Searching public records, employee reviews and recent news…
          </p>
        )}

        {!loading && error && (
          <div className="space-y-3">
            <p role="alert" className="text-sm text-destructive">{error}</p>
            <Button variant="secondary" className="rounded-full" onClick={onRefresh}>
              <RefreshCw className="mr-2 h-4 w-4" /> Try again
            </Button>
          </div>
        )}

        {!loading && !error && research && (
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {research.confidence && (
                <span className="rounded-full border border-border/70 px-3 py-1 text-[12px] text-muted-foreground">
                  Profile confidence: {research.confidence}
                </span>
              )}
              {researchedAt && (
                <span className="rounded-full border border-border/70 px-3 py-1 text-[12px] text-muted-foreground">
                  Researched {new Date(researchedAt).toLocaleDateString()}
                </span>
              )}
            </div>

            {research.overview && <p className="mt-4 text-[14px] leading-relaxed text-foreground/90">{research.overview}</p>}

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {facts.filter(([key]) => research[key]).map(([key, label]) => (
                <div key={key} className="rounded-xl border border-border/70 bg-secondary/40 p-3.5">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
                  <p className="mt-1.5 text-[13.5px]">{research[key]}</p>
                </div>
              ))}
            </div>

            {research.what_they_do && (
              <Section title="What they do">
                <p>{research.what_they_do}</p>
                {!!(research.services || []).length && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {research.services.map((service, index) => (
                      <span key={index} className="rounded-full bg-accent/10 px-3 py-1 text-[12.5px] text-foreground/85">{service}</span>
                    ))}
                  </div>
                )}
              </Section>
            )}

            {!!namedManagement.length && (
              <Section title="Management & ownership">
                <ul className="space-y-2.5">
                  {namedManagement.map((person, index) => (
                    <li key={index}>
                      <span className="font-medium">{person.name}</span>
                      {person.role ? <span className="text-muted-foreground"> · {person.role}</span> : null}
                      {person.note ? <p className="text-[13px] text-muted-foreground">{person.note}</p> : null}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            <Section title="Labour & employee reputation">
              {research.labour_reputation ? <p>{research.labour_reputation}</p> : <p className="text-muted-foreground">Nothing reliable was found on this employer's labour record.</p>}
              <Bullets items={research.employee_themes} />
              <Bullets items={research.labour_notes} />
              <p className="text-[12.5px] text-muted-foreground">
                Employee reviews are unverified opinion gathered from public sources, summarised here as themes. Treat them as a starting point for your own questions.
              </p>
            </Section>

            {!!(research.recent_news || []).length && (
              <Section title="Recent news">
                <Bullets items={research.recent_news} />
              </Section>
            )}

            {research.hiring_notes && (
              <Section title="What this means when applying">
                <p>{research.hiring_notes}</p>
              </Section>
            )}

            {!!(research.cautions || []).length && (
              <Section title="Worth checking yourself">
                <ul className="space-y-2">
                  {research.cautions.map((caution, index) => (
                    <li key={index} className="flex gap-2.5">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                      <span>{caution}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {!!(research.sources || []).length && (
              <Section title="Sources">
                <ul className="space-y-1.5">
                  {research.sources.filter((source) => source.url).map((source, index) => (
                    <li key={index}>
                      <a href={source.url} target="_blank" rel="noreferrer" className="text-[13px] text-accent underline underline-offset-4">
                        {source.label || source.url}
                      </a>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-4">
              <p className="text-[12px] text-muted-foreground">Saved with this application, so it is here next time you open it.</p>
              <Button variant="ghost" className="rounded-full text-muted-foreground" onClick={onRefresh} disabled={loading}>
                <RefreshCw className="mr-2 h-4 w-4" /> Look again
              </Button>
            </div>
          </div>
        )}

        {!loading && !error && !research && (
          <p className="flex items-center gap-2.5 py-6 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4" /> Nothing has been gathered for this company yet.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}