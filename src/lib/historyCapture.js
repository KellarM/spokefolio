// One definition of "the career history capture is saved".
//
// The history page, the mascot and the overview all ask the same question, and
// two of them disagreeing is how a client gets told their capture is saved on
// one screen and still outstanding on another.
//
// The signature is every entry id paired with its updated_date (which Base44
// moves on any edit) plus the ids the client confirmed. Anything that changes
// the capture changes the string, so "needs saving" is derived, never guessed.

export function captureSignature(entries, selectedIds) {
  const rows = (entries || [])
    .map((entry) => `${entry.id}:${entry.updated_date || ''}`)
    .sort();
  const picks = [...(selectedIds || [])].sort();
  return rows.length || picks.length ? `${rows.join('|')}::${picks.join(',')}` : '';
}

export function entriesPart(entries) {
  return (entries || [])
    .map((entry) => `${entry.id}:${entry.updated_date || ''}`)
    .sort()
    .join('|');
}

// Saved means: something was captured, and the entries in front of you now are
// the entries that were captured. The stored string keeps the confirmed
// selection after the "::" separator; only the entry half is compared here,
// because the mascot does not read the selection.
export function captureIsSaved(entries, profile) {
  if (!profile || !profile.history_complete) return false;
  const saved = String(profile.history_signature || '');
  if (!saved) return false;
  const mine = entriesPart(entries);
  if (!mine) return false;
  return saved.split('::')[0] === mine;
}
