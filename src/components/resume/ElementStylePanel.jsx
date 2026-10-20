import React from 'react';
import {
  CASE_OPTIONS,
  DISPLAY_OPTIONS,
  ELEMENTS,
  FONT_OPTIONS,
  RULE_OPTIONS,
  SHAPE_OPTIONS,
  SIZE_OPTIONS,
  SWATCHES,
  baseColor,
  overridesFor
} from '@/lib/resumeElementStyles';

// The controls for one part of the résumé: its colour, typeface, case, size, and — for the
// separation line and the skills list — how it is drawn.
const chip = (active) =>
  `rounded-full border px-2.5 py-1 text-[12px] transition-colors ${
    active
      ? 'border-transparent bg-primary text-primary-foreground'
      : 'border-border/70 text-muted-foreground hover:text-foreground'
  }`;

function Group({ title, children }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{title}</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">{children}</div>
    </div>
  );
}

export default function ElementStylePanel({ elementId, token, overrides, onChange }) {
  const spec = ELEMENTS[elementId] || { label: 'This part', options: [] };
  const choice = overridesFor(overrides, elementId);
  const styleOwn = baseColor(token);
  const has = (key) => spec.options.includes(key);

  // "The style's own" simply drops the choice, leaving the style to decide.
  // The option that hands the part back to the style — "the style's own", or "none" for the
  // skill style, which is how a plain list is stored.
  const choices = (key, list, fallback = 'style') =>
    list.map((option) => (
      <button
        key={option.id}
        type="button"
        onClick={() => onChange({ [key]: option.id === fallback ? undefined : option.id })}
        className={chip(option.id === fallback ? !choice[key] : choice[key] === option.id)}
      >
        {option.label}
      </button>
    ));

  return (
    <div className="space-y-3.5">
      {(has('color') || has('rule')) && (
        <Group title="Colour">
          <button
            type="button"
            onClick={() => onChange({ color: undefined })}
            className={chip(!choice.color)}
            title="The colour the style itself uses"
          >
            Style's own
          </button>
          {SWATCHES.map((hex) => (
            <button
              key={hex}
              type="button"
              onClick={() => onChange({ color: hex })}
              title={hex}
              aria-label={`Use ${hex}`}
              style={{ background: hex }}
              className={`h-6 w-6 rounded-full border transition-transform ${
                choice.color === hex ? 'scale-110 border-foreground' : 'border-border/60'
              }`}
            />
          ))}
          <label
            className="inline-flex h-6 cursor-pointer items-center gap-1.5 rounded-full border border-border/70 px-2 text-[12px] text-muted-foreground hover:text-foreground"
            title="Pick any colour"
          >
            <input
              type="color"
              value={choice.color || styleOwn || '#111827'}
              onChange={(event) => onChange({ color: event.target.value })}
              className="h-4 w-4 cursor-pointer border-0 bg-transparent p-0"
            />
            Custom
          </label>
        </Group>
      )}

      {has('font') && <Group title="Typeface">{choices('font', FONT_OPTIONS)}</Group>}
      {has('case') && <Group title="Lettering">{choices('case', CASE_OPTIONS)}</Group>}
      {has('size') && <Group title="Size">{choices('size', SIZE_OPTIONS)}</Group>}
      {has('rule') && <Group title="Line">{choices('rule', RULE_OPTIONS)}</Group>}
      {has('shape') && <Group title="Style">{choices('shape', SHAPE_OPTIONS, 'none')}</Group>}
      {has('display') && <Group title="How it reads">{choices('display', DISPLAY_OPTIONS)}</Group>}
    </div>
  );
}