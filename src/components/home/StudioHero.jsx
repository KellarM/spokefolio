import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Mic, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function StudioHero({ draftCount = 0 }) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-secondary via-card to-background px-6 py-9 sm:px-9 sm:py-11">
      <div className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 bottom-[-3rem] h-52 w-52 rounded-full bg-accent/10 blur-3xl" />

      <div className="relative">
        <p className="eyebrow">Spokefolio Personal Resume Studio</p>
        <h1 className="mt-3 max-w-2xl font-heading text-[30px] leading-[1.12] tracking-tight sm:text-[40px]">
          Turn your real work history into a résumé written for the job you want.
        </h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          Capture your career by voice, one entry at a time. Then paste any job posting and get a résumé shaped around it,
          ready to download as a Word document.
        </p>

        <div className="mt-7 flex flex-wrap gap-3">
          <Button asChild size="lg" className="rounded-full">
            <Link to="/new-application">
              <Sparkles className="mr-2 h-4 w-4" />
              Tailor a résumé
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-full bg-card/70">
            <Link to="/history">
              <Mic className="mr-2 h-4 w-4" />
              Capture career history
            </Link>
          </Button>
        </div>

        {draftCount > 0 && (
          <Link
            to="/history"
            className="mt-5 inline-flex items-center gap-2 text-[13px] font-medium text-primary transition-opacity hover:opacity-80"
          >
            <Clock className="h-3.5 w-3.5" />
            {draftCount} {draftCount === 1 ? 'entry is' : 'entries are'} still in progress — pick up where you left off
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    </section>
  );
}