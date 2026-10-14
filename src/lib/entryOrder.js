// Ordering for the career-history overview: the roles read newest first, the same way the
// résumé builder reads them, whatever order they happened to be dictated in.

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

// A free-text date ("Mar 2019", "2019", "2023 to Present") as a sortable number.
export function dateValue(value) {
  const text = String(value || '').toLowerCase();
  if (!text) return 0;
  if (/present|current|ongoing|now|today/.test(text)) {
    const now = new Date();
    return now.getFullYear() * 12 + now.getMonth() + 1;
  }
  const month = text.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*/);
  const monthIndex = month ? MONTHS.indexOf(month[1]) + 1 : 0;
  const years = text.match(/(?:19|20)\d{2}/g) || [];
  return years.reduce((best, year) => Math.max(best, Number(year) * 12 + monthIndex), 0);
}

// Most recent role first. A role still running outranks every finished one; an entry with no
// dates at all keeps the capture order it arrived in, at the end of the list.
export function sortEntriesByDate(entries = []) {
  return [...entries].sort((a, b) => {
    const byEnd = dateValue(b.end_date || b.start_date) - dateValue(a.end_date || a.start_date);
    if (byEnd) return byEnd;
    return dateValue(b.start_date) - dateValue(a.start_date);
  });
}