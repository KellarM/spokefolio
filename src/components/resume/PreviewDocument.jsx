import React from 'react';
import { Image } from '@/components/ui/image';
import useSignedFile from '@/hooks/useSignedFile';
import DocumentSection from '@/components/resume/DocumentSection';
import RestyleablePart from '@/components/resume/RestyleablePart';
import { getTemplate, RESUME_SECTIONS } from '@/lib/resumeTemplates';
import { layoutPhoto, layoutSections, readLayout } from '@/lib/resumeLayout';
import { skillsDisplay } from '@/lib/resumeElementStyles';

// The finished document, read-only: the same style tokens, section order and restyled parts
// the Word download and the PDF use, drawn without the editing fields. Every part of it can
// still be clicked to restyle it, exactly as in edit mode.
export default function PreviewDocument({
  profile,
  resume,
  template,
  layout,
  overrides,
  onUpdateOverride
}) {
  const { preview: style, config } = getTemplate(template);
  const { placement } = readLayout(layout);
  const contact = [profile.email, profile.phone, profile.location, profile.linkedin, profile.website]
    .filter(Boolean)
    .join('   •   ');
  const portrait = useSignedFile(layoutPhoto(config, layout) ? profile.photo_uri : '');
  const display = skillsDisplay(overrides);

  const bullets = (items, className = 'list-disc space-y-1.5 pl-5') => (
    <RestyleablePart
      id="body"
      token={style.body}
      overrides={overrides}
      onUpdate={onUpdateOverride}
      as="ul"
      className={className}
    >
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </RestyleablePart>
  );

  const roles = (resume.experience || []).filter(
    (role) => role && (role.title || role.organization || (role.bullets || []).length)
  );
  const education = (resume.education || []).filter((item) => item && (item.degree || item.institution || item.detail));
  const skills = (resume.skills || []).filter(Boolean);
  const certifications = (resume.certifications || []).filter(Boolean);
  const keywords = (resume.keywords || []).filter(Boolean);

  const skillsBlock = !skills.length
    ? null
    : display === 'lines'
      ? (
          <RestyleablePart
            id="skills"
            token={style.body}
            overrides={overrides}
            onUpdate={onUpdateOverride}
            as="ul"
            className="space-y-1"
          >
            {skills.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </RestyleablePart>
        )
      : display === 'columns'
        ? (
            <RestyleablePart
              id="skills"
              token={style.body}
              overrides={overrides}
              onUpdate={onUpdateOverride}
              as="div"
              className="grid grid-cols-2 gap-x-6 gap-y-1"
            >
              {skills.map((item, index) => (
                <p key={index}>{item}</p>
              ))}
            </RestyleablePart>
          )
        : (
            <RestyleablePart id="skills" token={style.body} overrides={overrides} onUpdate={onUpdateOverride}>
              {skills.join('   •   ')}
            </RestyleablePart>
          );

  const blocks = {
    summary: resume.summary ? (
      <RestyleablePart
        id="body"
        token={style.body}
        overrides={overrides}
        onUpdate={onUpdateOverride}
        className="whitespace-pre-line"
      >
        {resume.summary}
      </RestyleablePart>
    ) : null,
    skills: skillsBlock,
    experience: roles.length ? (
      <div className="space-y-5">
        {roles.map((role, index) => (
          <div key={index}>
            <RestyleablePart
              id="role"
              token={style.roleTitle}
              overrides={overrides}
              onUpdate={onUpdateOverride}
            >
              {[role.title, role.organization].filter(Boolean).join(', ')}
            </RestyleablePart>
            {(role.dates || role.location) && (
              <RestyleablePart
                id="meta"
                token={style.roleMeta}
                overrides={overrides}
                onUpdate={onUpdateOverride}
                className="mt-1"
              >
                {[role.dates, role.location].filter(Boolean).join('   •   ')}
              </RestyleablePart>
            )}
            {(role.bullets || []).filter(Boolean).length > 0 && (
              <div className="mt-2">{bullets((role.bullets || []).filter(Boolean))}</div>
            )}
          </div>
        ))}
      </div>
    ) : null,
    education: education.length ? (
      <div className="space-y-4">
        {education.map((item, index) => (
          <div key={index}>
            <div className="flex flex-wrap items-baseline gap-x-2">
              <RestyleablePart
                id="role"
                token={style.roleTitle}
                overrides={overrides}
                onUpdate={onUpdateOverride}
                as="span"
              >
                {[item.degree, item.institution].filter(Boolean).join(', ')}
              </RestyleablePart>
              {item.dates ? (
                <RestyleablePart
                  id="meta"
                  token={style.roleMeta}
                  overrides={overrides}
                  onUpdate={onUpdateOverride}
                  as="span"
                >
                  {item.dates}
                </RestyleablePart>
              ) : null}
            </div>
            {item.detail ? (
              <RestyleablePart
                id="body"
                token={style.body}
                overrides={overrides}
                onUpdate={onUpdateOverride}
                className="mt-1"
              >
                {item.detail}
              </RestyleablePart>
            ) : null}
          </div>
        ))}
      </div>
    ) : null,
    certifications: certifications.length ? bullets(certifications) : null,
    keywords: keywords.length ? (
      <RestyleablePart id="keywords" token={style.roleMeta} overrides={overrides} onUpdate={onUpdateOverride}>
        {keywords.join('   ·   ')}
      </RestyleablePart>
    ) : null
  };

  return (
    <div
      className={`rounded-2xl border border-border/70 px-6 py-8 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_24px_48px_-32px_rgba(16,24,40,0.35)] sm:px-12 sm:py-14 ${style.sheet}`}
    >
      <header className={`${style.header}${portrait ? ' flex flex-wrap items-start justify-between gap-6' : ''}`}>
        <div className="min-w-0 flex-1">
          <RestyleablePart id="name" token={style.name} overrides={overrides} onUpdate={onUpdateOverride} as="h1">
            {profile.full_name || 'Your name'}
          </RestyleablePart>
          {resume.headline ? (
            <RestyleablePart
              id="headline"
              token={style.headline}
              overrides={overrides}
              onUpdate={onUpdateOverride}
              className="mt-3"
            >
              {resume.headline}
            </RestyleablePart>
          ) : null}
          <RestyleablePart id="contact" token={style.contact} overrides={overrides} onUpdate={onUpdateOverride}>
            {contact || 'Add your email, phone and location on the Overview page.'}
          </RestyleablePart>
        </div>
        {portrait && (
          <Image
            src={portrait}
            alt="Portrait"
            fittingType="fill"
            focalPointX={0.5}
            focalPointY={0.3}
            className="h-28 w-24 shrink-0 rounded-md border border-border/60"
          />
        )}
      </header>

      {layoutSections(config, layout).map((id) =>
        blocks[id] ? (
          <DocumentSection
            key={id}
            title={RESUME_SECTIONS[id]}
            rowClass={style.sectionRow}
            titleClass={style.sectionTitle}
            placement={placement}
            overrides={overrides}
            onUpdate={onUpdateOverride}
          >
            {blocks[id]}
          </DocumentSection>
        ) : null
      )}
    </div>
  );
}