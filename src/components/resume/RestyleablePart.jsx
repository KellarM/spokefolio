import React from 'react';
import ResumeElementPicker from '@/components/resume/ResumeElementPicker';
import { elementStyle } from '@/lib/resumeElementStyles';

// One part of the résumé text, drawn with its own restyle setting applied. Where an update
// handler is passed in — the editable document and the preview — the part is also clickable
// and carries the chip that opens its controls.
export default function RestyleablePart({
  id,
  token,
  overrides,
  onUpdate,
  as: Tag = 'p',
  className = '',
  children
}) {
  const look = elementStyle(token, id, overrides);

  return (
    <ResumeElementPicker
      elementId={id}
      token={token}
      overrides={overrides}
      onUpdate={onUpdate}
      surface
      className="block"
    >
      <Tag className={`${className} ${look.className}`.trim()} style={look.style}>
        {children}
      </Tag>
    </ResumeElementPicker>
  );
}