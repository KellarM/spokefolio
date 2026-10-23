import React from 'react';
import ResumeHeader from '@/components/resume/ResumeHeader';
import ResumeSections from '@/components/resume/ResumeSections';
import { getTemplate } from '@/lib/resumeTemplates';
import { layoutPhoto, layoutSections, readLayout } from '@/lib/resumeLayout';

// The editable preview. The chosen style decides the header treatment as well as the
// order its sections appear in, so two styles can lay the same history out differently.
// The manual adjustments on the style panel are applied on top of that, and every part of
// the document can be clicked to restyle it on its own.
export default function ResumeDocument({
  profile,
  resume,
  onChange,
  template,
  layout,
  overrides,
  onUpdateOverride,
  onSetDefaultOrder,
  onSuggestBullets
}) {
  const { preview: style, config } = getTemplate(template);
  const { placement } = readLayout(layout);

  return (
    <div
      className={`resume-sheet rounded-2xl border border-border/70 px-6 py-8 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_24px_48px_-32px_rgba(16,24,40,0.35)] sm:px-12 sm:py-14 ${style.sheet}`}
    >
      <ResumeHeader
        profile={profile}
        resume={resume}
        style={style}
        showPhoto={layoutPhoto(config, layout)}
        placement={placement}
        onChange={onChange}
        overrides={overrides}
        onUpdateOverride={onUpdateOverride}
      />
      <ResumeSections
        resume={resume}
        style={style}
        sections={layoutSections(config, layout)}
        placement={placement}
        onChange={onChange}
        onSetDefaultOrder={onSetDefaultOrder}
        onSuggestBullets={onSuggestBullets}
        overrides={overrides}
        onUpdate={onUpdateOverride}
      />
    </div>
  );
}