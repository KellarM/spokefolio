import React from 'react';
import { alignClass } from '@/lib/resumeLayout';
import { elementStyle, ruleStyle } from '@/lib/resumeElementStyles';
import ResumeElementPicker from '@/components/resume/ResumeElementPicker';

const DEFAULT_ROW = 'border-b border-b-resume-brass/60 pb-2';
const DEFAULT_TITLE = 'text-[11px] font-semibold uppercase tracking-[0.22em] text-resume-navy';

// One section of the document. The heading sits above its content in the style's own
// placement, unless the candidate has moved the heading block left or centred.
//
// In the editable preview the heading and the line it carries are clickable: every section
// heading follows one setting, and the line can be recoloured, thickened, shortened or
// dropped. The style's own line is left exactly as it was drawn — the click target sits on
// the edge it already occupies.
export default function DocumentSection({
  title,
  action,
  children,
  rowClass = DEFAULT_ROW,
  titleClass = DEFAULT_TITLE,
  placement = 'style',
  overrides,
  onUpdate
}) {
  const centered = placement === 'center';
  const heading = elementStyle(titleClass, 'heading', overrides);
  const rule = ruleStyle(rowClass, overrides);

  const row = (
    <div className={`flex items-center justify-between gap-3 ${alignClass(rule.className, placement)}`} style={rule.style}>
      <h3 className={`${alignClass(heading.className, placement)} ${centered ? 'flex-1' : ''}`} style={heading.style}>
        {title}
      </h3>
      {action}
    </div>
  );

  const drawn = rule.draw ? (
    onUpdate ? (
      <ResumeElementPicker
        elementId="rule"
        token={rowClass}
        overrides={overrides}
        onUpdate={onUpdate}
        surface
        className="relative block py-1"
      >
        <div style={rule.draw} />
      </ResumeElementPicker>
    ) : (
      <div className="py-1">
        <div style={rule.draw} />
      </div>
    )
  ) : null;

  return (
    <section className="mt-8 pt-1">
      {rule.edge === 'top' ? drawn : null}

      <div className="relative">
        {onUpdate ? (
          <ResumeElementPicker elementId="heading" token={titleClass} overrides={overrides} onUpdate={onUpdate} surface>
            {row}
          </ResumeElementPicker>
        ) : (
          row
        )}

        {onUpdate && !rule.draw ? (
          <ResumeElementPicker
            elementId="rule"
            token={rowClass}
            overrides={overrides}
            onUpdate={onUpdate}
            surface
            className={`absolute inset-x-0 z-10 h-3 ${rule.edge === 'top' ? 'top-0' : 'bottom-0'}`}
          >
            <span className="block h-full w-full rounded-sm hover:bg-accent/20" />
          </ResumeElementPicker>
        ) : null}
      </div>

      {rule.draw && rule.edge === 'bottom' ? drawn : null}

      <div className="mt-3">{children}</div>
    </section>
  );
}