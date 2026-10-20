import React from 'react';
import { RESUME_SECTIONS } from '@/lib/resumeTemplates';
import { PLACEMENTS, PORTRAIT_OPTIONS, readLayout } from '@/lib/resumeLayout';

// The manual adjustments that sit on the Résumé style panel: where the heading block and the
// section headings sit, which sections this résumé keeps, and whether the portrait is used.
// Each choice is saved on the application and the preview and both downloads follow it.
export default function ResumeStyleControls({ config, layout, onChange }) {
  const current = readLayout(layout);

  const pill = (active) =>
    `rounded-full border px-3.5 py-1.5 text-[13px] transition-colors ${
      active
        ? 'border-transparent bg-primary text-primary-foreground'
        : 'border-border/70 text-muted-foreground hover:text-foreground'
    }`;

  const setPlacement = (placement) => onChange({ ...current, placement });

  const toggleSection = (id) =>
    onChange({
      ...current,
      hidden_sections: current.hidden_sections.includes(id)
        ? current.hidden_sections.filter((item) => item !== id)
        : [...current.hidden_sections, id]
    });

  return (
    <div className="mt-5 space-y-5 border-t border-border/60 pt-5">
      <div>
        <p className="eyebrow">Placement</p>
        <p className="mt-1.5 text-[13px] text-muted-foreground">
          Where your name block and the section headings sit on the page.
        </p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {PLACEMENTS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setPlacement(option.id)}
              className={pill(current.placement === option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="eyebrow">What shows</p>
        <p className="mt-1.5 text-[13px] text-muted-foreground">
          Switch a section off to leave it out of the preview and both downloads. Nothing is removed from your history.
        </p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {(config.sections || []).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => toggleSection(id)}
              className={pill(!current.hidden_sections.includes(id))}
            >
              {RESUME_SECTIONS[id] || id}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="eyebrow">Portrait</p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {PORTRAIT_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange({ ...current, photo: option.id })}
              className={pill(current.photo === option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}