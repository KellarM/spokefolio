import React from 'react';
import { Check } from 'lucide-react';

const roles = [
  {
    title: 'Operations Manager',
    org: 'Northline Logistics · 2021 — Present',
    lines: [
      'Cut dispatch errors by 24% across 40 daily routes',
      'Rebuilt onboarding for 18 warehouse staff',
      'Owned a $1.2M operating budget',
    ],
  },
  {
    title: 'Team Lead',
    org: 'Prairie Freight Co. · 2018 — 2021',
    lines: [
      'Led a nine-person crew on rotating shifts',
      'Introduced a safety checklist that removed repeat incidents',
    ],
  },
];

const skills = ['Vendor negotiation', 'Scheduling', 'Safety compliance', 'Excel reporting', 'Coaching'];
const matches = ['Keywords aligned to the posting', 'Gaps worth addressing flagged', 'Cover letter drafted'];

export default function WelcomeResumePreview() {
  return (
    <div className="paper animate-rise mx-auto w-full max-w-4xl rounded-lg p-7 sm:p-10">
      <div className="grid gap-9 sm:grid-cols-[1.7fr_1fr]">
        <div>
          <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
            <div>
              <p className="font-heading text-2xl tracking-tight sm:text-3xl">Jordan Avery</p>
              <p className="mt-1 text-sm text-muted-foreground">Operations Manager · Edmonton, AB</p>
            </div>
            <span className="eyebrow hidden shrink-0 sm:block">Tailored</span>
          </div>

          <div className="mt-6 space-y-6">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Operations leader with eight years in freight and warehousing, focused on dependable
              scheduling, safer floors and teams that stay.
            </p>

            <div>
              <p className="eyebrow">Experience</p>
              <div className="mt-3 space-y-5">
                {roles.map((role) => (
                  <div key={role.title}>
                    <p className="text-sm font-medium">{role.title}</p>
                    <p className="text-xs text-muted-foreground">{role.org}</p>
                    <ul className="mt-2 space-y-1.5">
                      {role.lines.map((line) => (
                        <li key={line} className="flex gap-2 text-sm leading-snug text-muted-foreground">
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-resume-brass" />
                          {line}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="eyebrow">Skills</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-border bg-secondary/70 px-3 py-1 text-xs text-secondary-foreground"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <aside className="h-fit rounded-md border border-border/70 bg-secondary/40 p-5">
          <p className="eyebrow">Fit for this posting</p>
          <ul className="mt-3 space-y-3">
            {matches.map((item) => (
              <li key={item} className="flex gap-2 text-xs leading-snug text-muted-foreground">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}