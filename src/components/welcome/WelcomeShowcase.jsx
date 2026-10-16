import React from 'react';
import WelcomeResumePreview from '@/components/welcome/WelcomeResumePreview';

export default function WelcomeShowcase() {
  return (
    <section className="border-b border-border/60 bg-secondary/40">
      <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
        <div className="text-center">
          <p className="eyebrow">What you get</p>
          <h2 className="mt-4 font-heading text-3xl tracking-tight sm:text-4xl">
            A document that already reads like the job you want.
          </h2>
        </div>
        <div className="mt-12">
          <WelcomeResumePreview />
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Sample layout — your documents are built from your own history.
        </p>
      </div>
    </section>
  );
}