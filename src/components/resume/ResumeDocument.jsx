import React from 'react';
import ResumeHeader from '@/components/resume/ResumeHeader';
import ResumeSections from '@/components/resume/ResumeSections';
import { getTemplate } from '@/lib/resumeTemplates';

// The editable preview. The chosen style decides the header treatment as well as the
// order its sections appear in, so two styles can lay the same history out differently.
export default function ResumeDocument({ profile, resume, onChange, template, onSetDefaultOrder, onSuggestBullets }) {
  const { preview: style, config } = getTemplate(template);

  return (
    <div
      className={`rounded-2xl border border-border/70 px-6 py-8 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_24px_48px_-32px_rgba(16,24,40,0.35)] sm:px-12 sm:py-14 ${style.sheet}`}
    >
      <ResumeHeader profile={profile} resume={resume} style={style} showPhoto={config.photo} onChange={onChange} />
      <ResumeSections
        resume={resume}
        style={style}
        sections={config.sections}
        onChange={onChange}
        onSetDefaultOrder={onSetDefaultOrder}
        onSuggestBullets={onSuggestBullets}
      />
    </div>
  );
}