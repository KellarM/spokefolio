import React from 'react';
import { Car, MapPin } from 'lucide-react';

// The work site named in the posting, with the drive from the candidate's home.
export default function JobLocation({ address, distanceKm, minutes }) {
  if (!address) return null;
  const drive = [distanceKm ? `${distanceKm} km` : '', minutes ? `${minutes} min drive` : '']
    .filter(Boolean)
    .join(' · ');

  return (
    <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
        {address}
      </span>
      {drive && (
        <span className="inline-flex items-center gap-1.5">
          <Car className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
          {drive}
        </span>
      )}
    </p>
  );
}