import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import TagInput from '@/components/editors/TagInput';
import DocumentSection from '@/components/resume/DocumentSection';
import RolesEditor from '@/components/resume/RolesEditor';
import EducationEditor from '@/components/resume/EducationEditor';
import DefaultOrderButton from '@/components/resume/DefaultOrderButton';
import { RESUME_SECTIONS } from '@/lib/resumeTemplates';

// Renders the résumé body in the order the chosen style's configuration gives.
export default function ResumeSections({ resume, style, sections, onChange, onSetDefaultOrder, onSuggestBullets }) {
  const set = (patch) => onChange({ ...resume, ...patch });

  const content = {
    summary: (
      <Textarea
        rows={5}
        value={resume.summary || ''}
        onChange={(event) => set({ summary: event.target.value })}
        className={`resize-y border-transparent bg-transparent px-0 hover:border-border/70 focus-visible:ring-0 ${style.body}`}
      />
    ),
    skills: (
      <TagInput tags={resume.skills || []} onChange={(skills) => set({ skills })} placeholder="Add a skill and press Enter" />
    ),
    experience: (
      <RolesEditor
        roles={resume.experience || []}
        onChange={(experience) => set({ experience })}
        roleTitleClass={style.roleTitle}
        roleMetaClass={style.roleMeta}
        onSuggest={onSuggestBullets}
        sortable
      />
    ),
    education: (
      <EducationEditor
        items={resume.education || []}
        onChange={(education) => set({ education })}
        degreeClass={style.roleTitle}
        metaClass={style.roleMeta}
      />
    ),
    certifications: (
      <TagInput
        tags={resume.certifications || []}
        onChange={(certifications) => set({ certifications })}
        placeholder="Add a certification and press Enter"
      />
    ),
    keywords: (
      <TagInput
        tags={resume.keywords || []}
        onChange={(keywords) => set({ keywords })}
        placeholder="Add a keyword and press Enter"
      />
    )
  };

  return (
    <>
      {sections.map((id) =>
        content[id] ? (
          <DocumentSection
            key={id}
            title={RESUME_SECTIONS[id]}
            rowClass={style.sectionRow}
            titleClass={style.sectionTitle}
            action={id === 'experience' && onSetDefaultOrder ? <DefaultOrderButton onClick={onSetDefaultOrder} /> : null}
          >
            {content[id]}
          </DocumentSection>
        ) : null
      )}
    </>
  );
}