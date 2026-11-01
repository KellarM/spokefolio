import React from 'react';
import { Car, MapPin } from 'lucide-react';
import { useStudioLanguage } from '@/lib/StudioLanguage';

// Google's documented universal search link. It opens the Maps app on a phone
// and Maps in the browser on a desktop, from one plain URL.
export function mapsUrl(address) {
  const query = String(address == null ? '' : address).trim();
  if (!query) return '';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

// The work site named in the posting, with the travel distance and drive time from the candidate's home.
export default function JobLocation({ address, distanceKm, minutes }) {
  const { t } = useStudioLanguage();
  // Zero is a real answer - the job has no site to drive to - and is not the
  // same thing as an unanswered lookup, which says so rather than going blank.
  const remote = distanceKm === 0;
  const answered = distanceKm != null;
  const drive = remote
    ? t('applications.remote')
    : [distanceKm ? t('applications.kmFromHome', { count: distanceKm }) : '', minutes ? t('applications.minDrive', { count: minutes }) : '']
      .filter(Boolean)
      .join(' · ');
  const mapLink = mapsUrl(address);
  if (!address && !drive) return null;

  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-3.5 gap-y-1 font-body text-[14.5px] text-foreground/80">
      {address && (
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
          {mapLink ? (
            <a
              href={mapLink}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('applications.openInMaps', { address })}
              className="inline-flex items-center gap-1.5 rounded-sm underline decoration-muted-foreground/40 decoration-1 underline-offset-2 transition-colors hover:text-foreground hover:decoration-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <span aria-hidden="true">{'\u{1F5FA}\u{FE0F}'}</span>
              {address}
            </a>
          ) : (
            address
          )}
        </span>
      )}
      {drive && (
        <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
          <Car className="h-4 w-4 shrink-0 text-accent" />
          {drive}
        </span>
      )}
      {address && !answered && (
        <span className="inline-flex items-center gap-1.5 text-muted-foreground/80">
          {t('applications.distanceUnavailable')}
        </span>
      )}
    </p>
  );
}
