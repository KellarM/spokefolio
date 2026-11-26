import React from 'react';
import { Globe } from 'lucide-react';
import postingSource from '@/lib/postingSource';

// Says where this application's posting came from — Indeed, Glassdoor, Job Bank,
// or the employer's own careers page. Nothing is shown when no link was saved.
export default function PostingSourcePill({ url, source = '', className = '' }) {
  // What the client typed wins: they know it was Indeed even when the link is gone.
  const site = String(source || '').trim() || postingSource(url);
  if (!site) return null;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-secondary/60 px-2.5 py-0.5 text-[12px] font-medium text-muted-foreground ${className}`}
      title={`This posting was found on ${site}`}
    >
      <Globe className="h-3 w-3" /> Found on {site}
    </span>
  );
}