// The manual adjustments a candidate can make to a résumé style for one posting: where the
// heading block and the section headings sit, the order the sections run in with any of them
// switched off, and whether the portrait is used. An application carries its own layout
// (JobApplication.resume_layout); the preview and both downloads apply the same rules, so
// what is on screen is what is exported.
// Mirrored on the server in base44/shared/resumeTemplates.ts.

export const DEFAULT_RESUME_LAYOUT = { placement: 'style', hidden_sections: [], photo: 'style', order: [] };

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
  const strings = (value) =>
    Array.isArray(value) ? Array.from(new Set(value.filter((id) => typeof id === 'string'))) : [];
  return {
    placement: raw.placement === 'left' || raw.placement === 'center' ? raw.placement : 'style',
    photo: raw.photo === 'on' || raw.photo === 'off' ? raw.photo : 'style',
    hidden_sections: strings(raw.hidden_sections),
    order: strings(raw.order)
  };
}

// The style's section ids in the order this résumé runs them: the order dragged here first,
// then anything the style shows that the dragged list does not mention.
export function layoutOrder(config, layout) {
  const own = config.sections || [];
  const { order } = readLayout(layout);
  const dragged = order.filter((id) => own.includes(id));
  return [...dragged, ...own.filter((id) => !dragged.includes(id))];
}

// What actually prints: that order, minus the sections switched off.
export function layoutSections(config, layout) {
  const { hidden_sections: hidden } = readLayout(layout);
  return layoutOrder(config, layout).filter((id) => !hidden.includes(id));
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