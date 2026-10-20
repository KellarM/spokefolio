import React from 'react';
import { Input } from '@/components/ui/input';
import { Image } from '@/components/ui/image';
import useSignedFile from '@/hooks/useSignedFile';
import { alignClass } from '@/lib/resumeLayout';
import { elementStyle } from '@/lib/resumeElementStyles';
import ResumeElementPicker from '@/components/resume/ResumeElementPicker';

// The heading block of the editable preview. Its name, headline and contact line can each be
// restyled by clicking them, and the choices travel to the read-only preview and the exports.
export default function ResumeHeader({
  profile,
  resume,
  style,
  showPhoto,
  placement = 'style',
  onChange,
  overrides,
  onUpdateOverride
}) {
  const contact = [profile.email, profile.phone, profile.location, profile.linkedin, profile.website]
    .filter(Boolean)
    .join('   •   ');
  // The hook always runs; a style that leaves the portrait out simply passes no file.
  const portrait = useSignedFile(showPhoto ? profile.photo_uri : '');
  const name = elementStyle(style.name, 'name', overrides);
  const headline = elementStyle(style.headline, 'headline', overrides);
  const contactLook = elementStyle(style.contact, 'contact', overrides);

  return (
    <header className={`${style.header}${portrait ? ' flex flex-wrap items-start justify-between gap-6' : ''}`}>
      <div className="min-w-0 flex-1">
        <ResumeElementPicker
          elementId="name"
          token={style.name}
          overrides={overrides}
          onUpdate={onUpdateOverride}
          surface
          className="w-full pt-1"
        >
          <h1 className={alignClass(name.className, placement)} style={name.style}>
            {profile.full_name || 'Your name'}
          </h1>
        </ResumeElementPicker>

        <ResumeElementPicker
          elementId="headline"
          token={style.headline}
          overrides={overrides}
          onUpdate={onUpdateOverride}
          className="mt-3 pt-1"
        >
          <Input
            value={resume.headline || ''}
            onChange={(event) => onChange({ ...resume, headline: event.target.value })}
            placeholder="Target headline — for example “Operations leader, cost and process improvement”"
            className={alignClass(headline.className, placement)}
            style={headline.style}
          />
        </ResumeElementPicker>

        <ResumeElementPicker
          elementId="contact"
          token={style.contact}
          overrides={overrides}
          onUpdate={onUpdateOverride}
          surface
          className="pt-1"
        >
          <p className={alignClass(contactLook.className, placement)} style={contactLook.style}>
            {contact || 'Add your email, phone and location on the Overview page.'}
          </p>
        </ResumeElementPicker>
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
  );
}