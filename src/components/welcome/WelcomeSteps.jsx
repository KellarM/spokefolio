import React from 'react';
import { Mic, Send, Sparkles } from 'lucide-react';

const steps = [
  {
    icon: Mic,
    title: 'Tell your story once',
    body: 'Dictate or type your roles, projects and results. Spokefolio tidies your words into a career history you review and refine.',
  },
  {
    icon: Sparkles,
    title: 'Tailor it to the job',
    body: 'Paste a job posting and get a resume shaped around it, with a match summary and the gaps worth addressing.',
  },
  {
    icon: Send,
    title: 'Apply with confidence',
    body: 'Generate the cover letter, research the company before you interview, and track every application from draft to offer.',
  },
];

export default function WelcomeSteps() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
      <div className="text-center">
        <p className="eyebrow">How it works</p>
        <h2 className="mt-4 font-heading text-3xl tracking-tight sm:text-4xl">
          Three steps from experience to interview.
        </h2>
      </div>
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {steps.map(({ icon: Icon, title, body }, index) => (
          <div key={title} className="paper rounded-lg p-6">
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-accent">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="font-heading text-2xl text-muted-foreground/50">
                {String(index + 1).padStart(2, '0')}
              </span>
            </div>
            <p className="mt-5 font-heading text-xl tracking-tight">{title}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}