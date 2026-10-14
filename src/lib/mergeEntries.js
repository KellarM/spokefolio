// Shapes several overlapping positions into one grouped employer entry.

const unique = (values) =>
  Array.from(new Set((values || []).map((value) => (value || '').trim()).filter(Boolean)));

const roleDates = (entry) => [entry.start_date, entry.end_date].filter(Boolean).join(' – ');

export function buildCombinedEntry(entries, { organization, title, startDate, endDate }) {
  const roles = (entries || []).map((entry) => ({
    title: entry.title || 'Role',
    dates: roleDates(entry),
    accomplishments: entry.accomplishments || []
  }));

  return {
    entry_type: 'work',
    title: (title || '').trim() || 'Multiple roles',
    organization: (organization || '').trim(),
    location: unique((entries || []).map((entry) => entry.location))[0] || '',
    start_date: (startDate || '').trim(),
    end_date: (endDate || '').trim(),
    summary: unique((entries || []).map((entry) => entry.summary)).join(' '),
    grouped: true,
    roles,
    accomplishments: [],
    skills: unique((entries || []).flatMap((entry) => entry.skills || [])),
    metrics: unique((entries || []).flatMap((entry) => entry.metrics || [])),
    keywords: unique((entries || []).flatMap((entry) => entry.keywords || [])),
    suggestions: [],
    suggestion_index: 0,
    answers: [],
    status: (entries || []).every((entry) => entry.status === 'confirmed') ? 'confirmed' : 'draft'
  };
}