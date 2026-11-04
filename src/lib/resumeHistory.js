// Undo for résumé edits.
//
// An edit here is either a discrete change (an accepted proposal that rewrote a
// section) or typing (which arrives as a whole new résumé object on every
// keystroke). Both are worth undoing, but they cannot be recorded the same way: a
// keystroke-per-entry history would need forty presses to get back one sentence.
//
// So consecutive typing inside a short window counts as one edit, and a discrete
// change always gets its own entry. Each entry holds the résumé as it was BEFORE
// that edit, which is what an undo has to restore.

export const BURST_MS = 1500; // typing pauses longer than this start a new edit
export const HISTORY_LIMIT = 25;

const clone = (value) => JSON.parse(JSON.stringify(value ?? null));

/**
 * Record an edit about to be applied.
 * `before` is the résumé as it stands now; the caller then applies its change.
 */
export function recordEdit(history, { before, label = '', at = Date.now(), discrete = false, burstMs = BURST_MS, limit = HISTORY_LIMIT } = {}) {
  const stack = Array.isArray(history) ? history : [];
  const top = stack[stack.length - 1];

  // Mid-burst typing: keep the snapshot taken before the burst started, and let the
  // burst keep running. The label from the burst's first change is the useful one.
  if (top && !discrete && at - top.at <= burstMs) {
    const extended = { ...top, at };
    return [...stack.slice(0, -1), extended];
  }

  const entry = { resume: clone(before), label, at, discrete };
  const next = [...stack, entry];
  return next.length > limit ? next.slice(next.length - limit) : next;
}

/** Pop the most recent edit. Returns the entry to restore and the remaining history. */
export function undoEdit(history) {
  const stack = Array.isArray(history) ? history : [];
  if (!stack.length) return { entry: null, rest: stack };
  return { entry: stack[stack.length - 1], rest: stack.slice(0, -1) };
}

/** What to call the edit that an undo would reverse. */
export function undoLabel(history) {
  const stack = Array.isArray(history) ? history : [];
  const top = stack[stack.length - 1];
  if (!top) return '';
  return top.label || 'your last edit';
}
