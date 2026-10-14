import React from 'react';

const DEFAULT_ROW = 'border-b border-b-resume-brass/60 pb-2';
const DEFAULT_TITLE = 'text-[11px] font-semibold uppercase tracking-[0.22em] text-resume-navy';

export default function DocumentSection({ title, action, children, rowClass = DEFAULT_ROW, titleClass = DEFAULT_TITLE }) {
  return (
    <section className="mt-8 pt-1">
      <div className={`flex items-center justify-between gap-3 ${rowClass}`}>
        <h3 className={titleClass}>{title}</h3>
        {action}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}