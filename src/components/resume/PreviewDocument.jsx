import React from 'react';
import { Image } from '@/components/ui/image';
import useSignedFile from '@/hooks/useSignedFile';
import DocumentSection from '@/components/resume/DocumentSection';
import { getTemplate, RESUME_SECTIONS } from '@/lib/resumeTemplates';
import { layoutPhoto, layoutSections, readLayout } from '@/lib/resumeLayout';

// The finished document, read-only: the same style tokens and section order the Word
// download uses, drawn without the editing fields.
export default function PreviewDocument({ profile, resume, template, layout }) {
  const { preview: style, config } = getTemplate(template);
  const { placement } = readLayout(layout);
  const contact = [profile.email, profile.phone, profile.location, profile.linkedin, profile.website]
    .filter(Boolean)
    .join('   •   ');
  const portrait = useSignedFile(layoutPhoto(config, layout) ? profile.photo_uri : '');

  const bullets = (items) => (
    <ul className="list-disc space-y-1.5 pl-5">
      {items.map((item, index) => (
        <li key={index} className={style.body}>
          {item}
        </li>
      ))}
    </ul>
  );

  const roles = (resume.experience || []).filter(
    (role) => role && (role.title || role.organization || (role.bullets || []).length)
  );
  const education = (resume.education || []).filter((item) => item && (item.degree || item.institution || item.detail));
  const skills = (resume.skills || []).filter(Boolean);
  const certifications = (resume.certifications || []).filter(Boolean);
  const keywords = (resume.keywords || []).filter(Boolean);

  const blocks = {
    summary: resume.summary ? <p className={`whitespace-pre-line ${style.body}`}>{resume.summary}</p> : null,
    skills: skills.length ? <p className={style.body}>{skills.join('   •   ')}</p> : null,
    experience: roles.length ? (
      <div className="space-y-5">
        {roles.map((role, index) => (
          <div key={index}>
            <p className={style.roleTitle}>{[role.title, role.organization].filter(Boolean).join(', ')}</p>
            {(role.dates || role.location) && (
              <p className={`mt-1 ${style.roleMeta}`}>
                {[role.dates, role.location].filter(Boolean).join('   •   ')}
              </p>
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
            <p className={style.roleTitle}>
              {[item.degree, item.institution].filter(Boolean).join(', ')}
              {item.dates ? <span className={`ml-2 ${style.roleMeta}`}>{item.dates}</span> : null}
            </p>
            {item.detail && <p className={`mt-1 ${style.body}`}>{item.detail}</p>}
          </div>
        ))}
      </div>
    ) : null,
    certifications: certifications.length ? bullets(certifications) : null,
    keywords: keywords.length ? <p className={style.roleMeta}>{keywords.join('   ·   ')}</p> : null
  };

  return (
    <div
      className={`rounded-2xl border border-border/70 px-6 py-8 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_24px_48px_-32px_rgba(16,24,40,0.35)] sm:px-12 sm:py-14 ${style.sheet}`}
    >
      <header className={`${style.header}${portrait ? ' flex flex-wrap items-start justify-between gap-6' : ''}`}>
        <div className="min-w-0 flex-1">
          <h1 className={style.name}>{profile.full_name || 'Your name'}</h1>
          {resume.headline && <p className={`mt-3 ${style.headline}`}>{resume.headline}</p>}
          <p className={style.contact}>{contact || 'Add your email, phone and location on the Overview page.'}</p>
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
          >
            {blocks[id]}
          </DocumentSection>
        ) : null
      )}
    </div>
  );
}