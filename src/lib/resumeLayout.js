// The manual adjustments a candidate can make to a résumé style for one posting: where the
// heading block and the section headings sit, which sections appear, and whether the
// portrait is used. An application carries its own layout (JobApplication.resume_layout);
// the preview and both downloads apply the same rules, so what is on screen is what is
// exported. Mirrored on the server in base44/shared/resumeTemplates.ts.

export const DEFAULT_RESUME_LAYOUT = { placement: 'style', hidden_sections: [], photo: 'style' };

export const PLACEMENTS = [
  { id: 'style', label: 'As the style sets it' },
  { id: 'left', label: 'Left' },
  { id: 'center', label: 'Centred' }
];

export const PORTRAIT_OPTIONS = [
  { id: 'style', label: 'As the style sets it' },
  { id: 'on', label: 'Show it' },
  { id: 'off', label: 'Leave it out' }
];

export function readLayout(layout) {
  const raw = layout && typeof layout === 'object' ? layout : {};
  return {
    placement: raw.placement === 'left' || raw.placement === 'center' ? raw.placement : 'style',
    photo: raw.photo === 'on' || raw.photo === 'off' ? raw.photo : 'style',
    hidden_sections: Array.isArray(raw.hidden_sections)
      ? raw.hidden_sections.filter((id) => typeof id === 'string')
      : []
  };
}

// The style's own section order, minus the ones switched off for this résumé.
export function layoutSections(config, layout) {
  const { hidden_sections: hidden } = readLayout(layout);
  return (config.sections || []).filter((id) => !hidden.includes(id));
}

// The style decides whether it carries a portrait, unless this résumé overrides it.
export function layoutPhoto(config, layout) {
  const { photo } = readLayout(layout);
  if (photo === 'on') return true;
  if (photo === 'off') return false;
  return Boolean(config.photo);
}

// The style's own alignment, replaced when the candidate places the headings themselves.
export function alignClass(classes, placement) {
  if (placement !== 'left' && placement !== 'center') return classes;
  const cleaned = String(classes || '')
    .replace(/\btext-(left|center|right)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return `${cleaned} ${placement === 'center' ? 'text-center' : 'text-left'}`.trim();
}