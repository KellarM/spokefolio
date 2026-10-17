// Helpers for one tailored application: which career entries speak to this posting, and how
// long the résumé runs. The documents themselves are built on the server from the
// application's own résumé (shared/docx.ts and shared/pdf.ts), so nothing here draws one.

const tokenize = (text) => String(text || '')
  .toLowerCase().replace(/[^a-z0-9\s]/g, ' ')
  .split(/\s+/).filter((w) => w.length > 3);

export const scoreEntryAgainstJd = (entry, jobDescription) => {
  const jdTokens = new Set(tokenize(jobDescription));
  const entryText = [
    entry.title, entry.organization, entry.summary,
    ...(Array.isArray(entry.skills) ? entry.skills : []),
    ...(Array.isArray(entry.keywords) ? entry.keywords : []),
    ...(Array.isArray(entry.accomplishments) ? entry.accomplishments : []),
  ].join(' ');
  const hits = new Set(tokenize(entryText).filter((t) => jdTokens.has(t)));
  return hits.size;
};

export const rankEntries = (entries, jobDescription) => {
  const scored = (entries || []).map((e) => ({
    id: e.id, entry: e, score: scoreEntryAgainstJd(e, jobDescription),
  }));
  const max = Math.max(1, ...scored.map((s) => s.score));
  return scored
    .sort((a, b) => (b.score - a.score)
      || String(b.entry.end_date || '').localeCompare(String(a.entry.end_date || '')))
    .map((s) => ({
      ...s,
      tier: s.score >= Math.max(3, max * 0.5) ? 'Recommended'
        : s.score > 0 ? 'Optional' : 'Low relevance',
    }));
};

// --- page estimate ---

const LINES_PER_PAGE = 46;

const asList = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);

// A rough count for the résumé that will be exported: the reading it always used, taken
// over the tailored résumé rather than over every entry in the career history.
export const estimateResumePages = (resume) => {
  const data = resume || {};
  let lines = 5; // name, headline and the contact line, with air around them

  if (data.headline) lines += 1;
  if (data.summary) lines += 1 + Math.ceil(String(data.summary).length / 95);

  const skills = asList(data.skills).map(String);
  if (skills.length) lines += 1 + Math.ceil(skills.join(' \u00B7 ').length / 95);
  if (asList(data.keywords).length) lines += 1;

  asList(data.experience).forEach((role) => {
    lines += role?.location ? 4 : 3;
    asList(role?.bullets).forEach((bullet) => {
      lines += Math.max(1, Math.ceil(String(bullet).length / 95));
    });
  });

  asList(data.education).forEach(() => { lines += 3; });
  asList(data.certifications).forEach(() => { lines += 1; });

  return Math.max(1, Math.ceil(lines / LINES_PER_PAGE));
};