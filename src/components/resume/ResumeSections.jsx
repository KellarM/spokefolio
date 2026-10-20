import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import DictateButton from '@/components/common/DictateButton';
import { appendLine } from '@/hooks/useDictation';
import TagInput from '@/components/editors/TagInput';
import DocumentSection from '@/components/resume/DocumentSection';
import RolesEditor from '@/components/resume/RolesEditor';
import EducationEditor from '@/components/resume/EducationEditor';
import DefaultOrderButton from '@/components/resume/DefaultOrderButton';
import ResumeElementPicker from '@/components/resume/ResumeElementPicker';
import { RESUME_SECTIONS } from '@/lib/resumeTemplates';

// Renders the résumé body in the order the chosen style's configuration gives. Each section
// heading and the line it carries are restyleable in edit mode, and so are the parts whose
// body here is an editing field rather than document text — the skills list, the summary and
// the screening keywords — from the chip beside their heading. The preview restyles the rest.
export default function ResumeSections({
  resume,
  style,
  sections,
  placement = 'style',
  onChange,
  onSetDefaultOrder,
  onSuggestBullets,
  overrides,
  onUpdate
}) {
  const set = (patch) => onChange({ ...resume, ...patch });

  const content = {
    summary: (
      <div className="space-y-1">
        <Textarea
          rows={5}
          value={resume.summary || ''}
          onChange={(event) => set({ summary: event.target.value })}
          className={`resize-y border-transparent bg-transparent px-0 hover:border-border/70 focus-visible:ring-0 ${style.body}`}
        />
        <DictateButton onText={(transcript) => set({ summary: appendLine(resume.summary, transcript) })} />
      </div>
    ),
    skills: (
      <TagInput
        tags={resume.skills || []}
        onChange={(skills) => set({ skills })}
        placeholder="Add a core skill and press Enter or click Add"
        addLabel="Add skill"
      />
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
        placeholder="Add a certification and press Enter or click Add"
        addLabel="Add certification"
        splitOnComma={false}
      />
    ),
    keywords: (
      <TagInput
        tags={resume.keywords || []}
        onChange={(keywords) => set({ keywords })}
        placeholder="Add a screening keyword and press Enter or click Add"
        addLabel="Add keyword"
      />
    )
  };

  const sectionAction = (id) => {
    if (id === 'experience' && onSetDefaultOrder) return <DefaultOrderButton onClick={onSetDefaultOrder} />;
    if (id === 'skills' && onUpdate) {
      return <ResumeElementPicker elementId="skills" token={style.body} overrides={overrides} onUpdate={onUpdate} />;
    }
    if (id === 'summary' && onUpdate) {
      return <ResumeElementPicker elementId="body" token={style.body} overrides={overrides} onUpdate={onUpdate} />;
    }
    if (id === 'keywords' && onUpdate) {
      return <ResumeElementPicker elementId="keywords" token={style.roleMeta} overrides={overrides} onUpdate={onUpdate} />;
    }
    return null;
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
            placement={placement}
            action={sectionAction(id)}
            overrides={overrides}
            onUpdate={onUpdate}
          >
            {content[id]}
          </DocumentSection>
        ) : null
      )}
    </>
  );
}