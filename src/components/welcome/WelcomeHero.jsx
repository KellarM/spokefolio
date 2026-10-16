import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function WelcomeHero() {
  return (
    <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-secondary/80 via-background to-background">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute -left-28 top-24 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
      <div className="mx-auto max-w-3xl px-6 py-20 text-center sm:py-28">
        <p className="eyebrow animate-rise">Personal resume assistant</p>
        <h1 className="animate-rise mt-5 font-heading text-4xl leading-[1.08] tracking-tight sm:text-6xl">
          Your career, told once — tailored to every job.
        </h1>
        <p className="animate-rise mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Resume Craft captures your work history by voice, keeps it as one reusable master story, then
          shapes it into a resume and cover letter for each role you apply to.
        </p>
        <div className="animate-rise mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" className="h-12 w-full rounded-full px-7 sm:w-auto" asChild>
            <Link to="/register">
              Get started
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="h-12 w-full rounded-full px-7 sm:w-auto" asChild>
            <Link to="/login">Log in</Link>
          </Button>
        </div>
        <p className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-accent" aria-hidden="true" />
          Your history, documents and applications stay private to your account.
        </p>
      </div>
    </section>
  );
}