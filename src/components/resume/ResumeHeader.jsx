import React from 'react';
import { Input } from '@/components/ui/input';
import { Image } from '@/components/ui/image';
import useSignedFile from '@/hooks/useSignedFile';

export default function ResumeHeader({ profile, resume, style, showPhoto, onChange }) {
  const contact = [profile.email, profile.phone, profile.location, profile.linkedin, profile.website]
    .filter(Boolean)
    .join('   •   ');
  // The hook always runs; a style that leaves the portrait out simply passes no file.
  const portrait = useSignedFile(showPhoto ? profile.photo_uri : '');

  return (
    <header className={`${style.header}${portrait ? ' flex flex-wrap items-start justify-between gap-6' : ''}`}>
      <div className="min-w-0 flex-1">
        <h1 className={style.name}>{profile.full_name || 'Your name'}</h1>
        <div className="mt-3">
          <Input
            value={resume.headline || ''}
            onChange={(event) => onChange({ ...resume, headline: event.target.value })}
            placeholder="Target headline — for example “Operations leader, cost and process improvement”"
            className={style.headline}
          />
        </div>
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
  );
}