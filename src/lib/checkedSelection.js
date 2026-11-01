// Selection bookkeeping for the detail builder, kept apart from the component so
// the counting rules can be tested directly.
//
// The rule that matters: only currently selectable items count. An item that has
// been added to the tray leaves the list, and any stale id left behind in the
// selection must not keep "everything is checked" from ever being true.

export function selectableIds(items) {
  return (items || []).map((item) => item.id);
}

// Ids that are ticked AND still on screen. Used for the counter and the Add
// button, so a stale tick cannot inflate the count.
export function liveCheckedIds(items, checkedIds) {
  const live = new Set(selectableIds(items));
  return (checkedIds || []).filter((id) => live.has(id));
}

export function isEverySelectableChecked(items, checkedIds) {
  const ids = selectableIds(items);
  if (!ids.length) return false;
  const checked = new Set(checkedIds || []);
  return ids.every((id) => checked.has(id));
}

// What "check all / clear all" should leave behind.
export function toggleAllSelection(items, checkedIds) {
  return isEverySelectableChecked(items, checkedIds) ? [] : selectableIds(items);
}

// Drops ticks for items that are no longer on screen, so nothing lingers
// invisibly in the selection after a regenerate or an add to the tray.
export function retainSelectableChecked(items, checkedIds) {
  return liveCheckedIds(items, checkedIds);
}
