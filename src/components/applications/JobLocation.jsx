import React from 'react';
import { Car, MapPin } from 'lucide-react';

// The work site named in the posting, with the travel distance and drive time from the candidate's home.
export default function JobLocation({ address, distanceKm, minutes }) {
  const drive = [distanceKm ? `${distanceKm} km from home` : '', minutes ? `${minutes} min drive` : '']
    .filter(Boolean)
    .join(' · ');
  if (!address && !drive) return null;

  return (
    <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted-foreground">
      {address && (
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
          {address}
        </span>
      )}
      {drive && (
        <span className="inline-flex items-center gap-1.5 font-medium text-foreground/85">
          <Car className="h-3.5 w-3.5 shrink-0 text-accent" />
          {drive}
        </span>
      )}
    </p>
  );
}