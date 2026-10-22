import React from 'react';
import { Car, MapPin } from 'lucide-react';
import { useStudioLanguage } from '@/lib/StudioLanguage';

// The work site named in the posting, with the travel distance and drive time from the candidate's home.
export default function JobLocation({ address, distanceKm, minutes }) {
  const { t } = useStudioLanguage();
  const drive = [distanceKm ? t('applications.kmFromHome', { count: distanceKm }) : '', minutes ? t('applications.minDrive', { count: minutes }) : '']
    .filter(Boolean)
    .join(' · ');
  if (!address && !drive) return null;

  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-3.5 gap-y-1 font-body text-[14.5px] text-foreground/80">
      {address && (
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
          {address}
        </span>
      )}
      {drive && (
        <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
          <Car className="h-4 w-4 shrink-0 text-accent" />
          {drive}
        </span>
      )}
    </p>
  );
}