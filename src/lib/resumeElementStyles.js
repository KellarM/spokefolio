// The parts of a résumé a candidate can restyle by clicking them: the name, the headline,
// the contact line, every section heading, the separation line under the headings, the
// skills list, the entry lines, the dates and places, the body text and the screening
// keywords.
//
// One setting covers every instance of an element, so restyling one section heading
// restyles all of them. The choices are stored on the application
// (resume_style_overrides) and the Word export, the PDF and the read-only preview all
// apply the same ones — mirrored on the server in base44/shared/resumeTemplates.ts.

export const ELEMENTS = {
  name: {
    label: 'Your name',
    hint: 'The name line in the heading block.',
    options: ['color', 'font', 'case', 'size']
  },
  headline: {
    label: 'Headline',
    hint: 'The target title under your name.',
    options: ['color', 'font', 'case', 'size']
  },
  contact: {
    label: 'Contact details',
    hint: 'Email, phone, location and links.',
    options: ['color', 'font', 'size']
  },
  heading: {
    label: 'Section headings',
    hint: 'Every section heading follows this one setting.',
    options: ['color', 'font', 'case', 'size']
  },
  rule: {
    label: 'Separation line',
    hint: 'The line that sets a heading apart from the text under it.',
    options: ['rule']
  },
  skills: {
    label: 'Skills',
    hint: 'The whole skills list follows this one setting.',
    options: ['color', 'font', 'size', 'shape', 'display']
  },
  role: {
    label: 'Job titles',
    hint: 'Every job title, company, degree and certification line follows this one setting.',
    options: ['color', 'font', 'case', 'size']
  },
  meta: {
    label: 'Dates & places',
    hint: 'The dates and locations beside each entry.',
    options: ['color', 'font', 'size']
  },
  body: {
    label: 'Body text',
    hint: 'Your summary, the bullets under each role, and the other words in the document.',
    options: ['color', 'font', 'size']
  },
  keywords: {
    label: 'Screening keywords',
    hint: 'The keyword list at the foot of the résumé.',
    options: ['color', 'font', 'size']
  }
};

export const ELEMENT_IDS = Object.keys(ELEMENTS);

// Colours that print legibly on every style's sheet.
export const SWATCHES = [
  '#111827',
  '#1E3A5F',
  '#0F3D2E',
  '#7F1D1D',
  '#4A2545',
  '#B0854A',
  '#4F46E5',
  '#0F766E',
  '#5B6472',
  '#9CA3AF'
];

export const FONT_OPTIONS = [
  { id: 'style', label: "The style's own" },
  { id: 'serif', label: 'Serif' },
  { id: 'sans', label: 'Sans' }
];

export const CASE_OPTIONS = [
  { id: 'style', label: "The style's own" },
  { id: 'upper', label: 'UPPERCASE' }
];

export const SIZE_OPTIONS = [
  { id: 'style', label: "The style's own" },
  { id: 'smaller', label: 'Smaller' },
  { id: 'larger', label: 'Larger' }
];

export const RULE_OPTIONS = [
  { id: 'style', label: "The style's own" },
  { id: 'line', label: 'Hairline' },
  { id: 'solid', label: 'Solid rule' },
  { id: 'bar', label: 'Short bar' },
  { id: 'none', label: 'No line' }
];

export const DISPLAY_OPTIONS = [
  { id: 'line', label: 'Line of keywords' },
  { id: 'lines', label: 'One per line' },
  { id: 'columns', label: 'Two columns' }
];

export const SHAPE_OPTIONS = [
  { id: 'bubble', label: 'Bubble' },
  { id: 'block', label: 'Block' },
  { id: 'none', label: 'None' }
];

const FONT_CLASS = { serif: 'font-heading', sans: 'font-body' };
const SIZE_FACTOR = { smaller: 0.88, larger: 1.18 };
const ALLOWED = {
  color: (value) => value === null || /^#[0-9a-f]{6}$/i.test(String(value)),
  font: (value) => ['serif', 'sans'].includes(value),
  case: (value) => ['style', 'upper'].includes(value),
  size: (value) => ['style', 'smaller', 'larger'].includes(value),
  rule: (value) => ['line', 'solid', 'bar', 'none'].includes(value),
  display: (value) => ['line', 'lines', 'columns'].includes(value),
  shape: (value) => ['bubble', 'block'].includes(value)
};

// Only the settings that differ from the style are kept, so an untouched résumé stores
// nothing at all.
export function readElementOverrides(value) {
  const raw = value && typeof value === 'object' ? value : {};
  const out = {};
  for (const id of ELEMENT_IDS) {
    const entry = raw[id];
    if (!entry || typeof entry !== 'object') continue;
    const kept = {};
    for (const [key, allowed] of Object.entries(ALLOWED)) {
      const choice = entry[key];
      if (choice === undefined || choice === null) continue;
      if (allowed(choice)) kept[key] = choice;
    }
    if (Object.keys(kept).length) out[id] = kept;
  }
  return out;
}

export function overridesFor(overrides, elementId) {
  return (overrides && overrides[elementId]) || {};
}

// The colour the style itself uses for this token, so "the style's own" can show it.
export function baseColor(token) {
  const match = /#([0-9a-f]{6})/i.exec(String(token || ''));
  return match ? `#${match[1].toLowerCase()}` : null;
}

// A style token is a Tailwind class string such as
// "font-heading text-[30px] tracking-tight text-[#1B4159] sm:text-[38px]". The chosen
// treatments are applied inline, which is what lets a runtime colour or size land on an
// element whose classes were compiled at build time.
export function elementStyle(token, elementId, overrides) {
  const choice = overridesFor(overrides, elementId);
  const classes = String(token || '');
  if (!Object.keys(choice).length) return { className: classes, style: undefined };

  let className = classes;
  if (choice.font && FONT_CLASS[choice.font]) {
    className = className
      .replace(/\bfont-heading\b/g, '')
      .replace(/\bfont-body\b/g, '')
      .replace(/\bfont-display\b/g, '')
      .replace(/\bfont-\[[^\]]*\]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    className = `${className} ${FONT_CLASS[choice.font]}`.trim();
  }

  const style = {};
  if (choice.color) style.color = choice.color;
  if (choice.case === 'upper') style.textTransform = 'uppercase';
  if (choice.size && SIZE_FACTOR[choice.size]) {
    // The largest size the token declares is the one a desktop preview shows.
    const sizes = [...classes.matchAll(/\[(\d+(?:\.\d+)?)px\]/g)].map((match) => Number(match[1]));
    const base = sizes.length ? Math.max(...sizes) : 0;
    if (base) style.fontSize = `${Math.round(base * SIZE_FACTOR[choice.size] * 10) / 10}px`;
  }

  return { className, style: Object.keys(style).length ? style : undefined };
}

// The separation line a section heading carries. Left at the style's own, the heading row
// keeps the border it was drawn with; any other choice clears that border and draws the
// line here instead, so its colour and weight can be set exactly.
export function ruleStyle(rowClass, overrides) {
  const choice = overridesFor(overrides, 'rule');
  const classes = String(rowClass || '');
  const mode = choice.rule || 'style';
  const colour = choice.color || baseColor(classes) || '#111827';
  const edge = /\bborder-t\b/.test(classes) ? 'top' : 'bottom';
  const plain = { className: classes, style: undefined, draw: null, edge, mode: 'style' };

  if (!choice.rule && !choice.color) return plain;

  // Only the colour was set: the style keeps its own line and that line is recoloured,
  // whichever edge it sits on.
  if (!choice.rule) {
    const style = /border-l/.test(classes)
      ? { borderLeftColor: colour }
      : edge === 'top'
        ? { borderTopColor: colour }
        : { borderBottomColor: colour };
    return { ...plain, style };
  }

  const cleaned = classes
    .replace(/\bborder-(t|b|l|r)-\[[^\]]*\]/g, '')
    .replace(/\bborder-(t|b|l|r)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (mode === 'none') return { ...plain, className: cleaned, mode };

  const shapes = {
    line: { height: '1px', width: '100%' },
    solid: { height: '2px', width: '100%' },
    bar: { height: '3px', width: '56px' }
  };

  return { ...plain, className: cleaned, mode, draw: { ...(shapes[mode] || shapes.line), background: colour } };
}

// How the skills read in the finished document.
export function skillsDisplay(overrides) {
  const choice = overridesFor(overrides, 'skills').display;
  return DISPLAY_OPTIONS.some((option) => option.id === choice) ? choice : 'line';
}

// What each skill is drawn as: plain words, or its own bubble or block.
export function skillsShape(overrides) {
  const choice = overridesFor(overrides, 'skills').shape;
  return choice === 'bubble' || choice === 'block' ? choice : 'none';
}

// A tint of one colour, for a skill's plate.
export function tint(hex, amount) {
  const value = String(hex || '').replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(value)) return null;
  const channel = (start) => Math.round(255 * (1 - amount) + parseInt(value.slice(start, start + 2), 16) * amount);
  return `rgb(${channel(0)}, ${channel(2)}, ${channel(4)})`;
}

// The plate under one skill, tinted with the colour the list carries, so the colour stays a
// choice of its own, separate from the typeface.
export function skillPlate(shape, ink) {
  if (shape === 'none') return null;
  const background = tint(ink, shape === 'bubble' ? 0.12 : 0.2);
  if (!background) return null;
  return shape === 'bubble' ? { background, borderColor: tint(ink, 0.5) } : { background };
}