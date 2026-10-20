import React from 'react';
import { alignClass } from '@/lib/resumeLayout';

const DEFAULT_ROW = 'border-b border-b-resume-brass/60 pb-2';
const DEFAULT_TITLE = 'text-[11px] font-semibold uppercase tracking-[0.22em] text-resume-navy';

// One section of the document. The heading sits above its content in the style's own
// placement, unless the candidate has moved the heading block left or centred.
export default function DocumentSection({
  title,
  action,
  children,
  rowClass = DEFAULT_ROW,
  titleClass = DEFAULT_TITLE,
  placement = 'style'
}) {
  const centered = placement === 'center';

  return (
    <section className="mt-8 pt-1">
      <div className={`flex items-center justify-between gap-3 ${alignClass(rowClass, placement)}`}>
        <h3 className={`${alignClass(titleClass, placement)} ${centered ? 'flex-1' : ''}`}>{title}</h3>
        {action}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}