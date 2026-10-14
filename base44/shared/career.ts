// Shared helpers for the career-history functions.

export function cleanText(value, max = 2000) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

export function cleanList(value, max = 40, itemMax = 600) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => cleanText(item, itemMax))
    .filter(Boolean)
    .slice(0, max);
}

const MONTH_NAMES = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

// Sortable key for a free-text date ("Mar 2019", "2019 to 2021", "Present").
export function dateKey(value) {
  const text = cleanText(value, 120).toLowerCase();
  if (!text) return 0;
  const now = new Date();
  if (/present|current|ongoing|now|today/.test(text)) return now.getFullYear() * 12 + now.getMonth() + 1;
  const monthMatch = text.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*/);
  const month = monthMatch ? MONTH_NAMES.indexOf(monthMatch[1]) + 1 : 0;
  const years = text.match(/(?:19|20)\d{2}/g) || [];
  return years.reduce((best, year) => Math.max(best, Number(year) * 12 + month), 0);
}

// Earliest year in a free-text date: breaks ties between jobs that end in the same year.
const startKey = (value) => {
  const years = (cleanText(value, 120).match(/(?:19|20)\d{2}/g) || []).map(Number);
  return years.length ? Math.min(...years) : 0;
};

const entryDates = (entry) =>
  cleanText(entry.dates, 120) ||
  [cleanText(entry.start_date, 60), cleanText(entry.end_date, 60)].filter(Boolean).join(' to ');

// Works with both stored records and the compacted payload sent to the model.
const entryKind = (entry) => cleanText(entry.entry_type || entry.type, 40) || 'work';

const yearsOf = (value) => Array.from(new Set(cleanText(value, 160).match(/(?:19|20)\d{2}/g) || [])).join(',');

// The writer sometimes fills a field it does not know with "Not specified":
// that must never reach the resume.
const PLACEHOLDERS = [
  'n/a',
  'na',
  'none',
  'not specified',
  'unspecified',
  'unknown',
  'not given',
  'not provided',
  'not applicable',
  'tbd'
];

const realText = (value, max) => {
  const text = cleanText(value, max);
  return PLACEHOLDERS.includes(text.toLowerCase()) ? '' : text;
};

// Used only when the writer returned nothing for a job, so a job is never a bare heading.
const fallbackBullets = (entry) => {
  const own = cleanList(entry.accomplishments, 4, 500);
  if (own.length) return own;
  return (Array.isArray(entry.roles) ? entry.roles : [])
    .flatMap((role) => cleanList(role?.accomplishments, 1, 500).map((line) => `${cleanText(role?.title, 120)}: ${line}`))
    .slice(0, 6);
};

const norm = (value) => cleanText(value, 200).toLowerCase().replace(/[^a-z0-9]/g, '');

// "2007 to 2007" reads as a typo: show the year once.
const tidyDates = (value) => value.replace(/^(.+?)\s+to\s+\1$/i, '$1');

// A combined employer block must show every role it holds. Any role the writer left
// out gets its first real accomplishment added, so no position silently disappears.
const coverMissingRoles = (entry, bullets) => {
  if (!entry.grouped) return bullets;
  const text = bullets.map((line) => norm(line)).join(' ');
  const extra = [];
  for (const role of Array.isArray(entry.roles) ? entry.roles : []) {
    const name = cleanText(role?.title, 200);
    const key = norm(name.split('/')[0]);
    const first = cleanList(role?.accomplishments, 1, 500)[0];
    if (!key || !first || text.includes(key)) continue;
    const dates = cleanText(role?.dates, 60);
    extra.push(`${name}${dates ? ` (${dates})` : ''}: ${first}`);
  }
  return [...bullets, ...extra];
};

// Builds the resume experience straight from the stored history: exactly one block per job,
// in strict reverse-chronological order (most recent first). The writer only supplies the
// bullets (matched to a job by its "ref" number), so a job can never be merged, renamed,
// duplicated or left out, and the timeline has no gaps.
export function buildExperience(written, entries) {
  const byRef = new Map();
  for (const block of Array.isArray(written) ? written : []) {
    if (!block || typeof block !== 'object') continue;
    const ref = Number(block.ref);
    if (Number.isInteger(ref) && !byRef.has(ref)) byRef.set(ref, block);
  }

  const jobs = [];
  (Array.isArray(entries) ? entries : []).forEach((entry, index) => {
    if (!entry || typeof entry !== 'object') return;
    const kind = entryKind(entry);
    if (kind !== 'work' && kind !== 'project') return;

    const block = byRef.get(index) || {};
    const storedDates = entryDates(entry);
    const writtenDates = cleanText(block.dates, 120);
    // The writer may tidy the wording of a date but never change the years.
    const dates = tidyDates(
      writtenDates && yearsOf(writtenDates) === yearsOf(storedDates) ? writtenDates : storedDates
    );
    const bullets = coverMissingRoles(entry, cleanList(block.bullets, 20, 700));

    jobs.push({
      title: (entry.grouped && realText(block.title, 240)) || cleanText(entry.title, 240),
      organization: realText(entry.organization, 240),
      location: realText(entry.location, 160),
      dates,
      bullets: bullets.length ? bullets : fallbackBullets(entry),
      index
    });
  });

  return jobs
    .sort(
      (a, b) =>
        dateKey(b.dates) - dateKey(a.dates) || startKey(b.dates) - startKey(a.dates) || a.index - b.index
    )
    .map(({ index, ...job }) => job);
}

// Turns stored CareerEntry records into a compact payload for the model,
// keeping the most recent entries inside the character budget.
// Each item carries a "ref" number the model uses to say which job its bullets belong to.
export function compactEntries(entries, budget = 22000) {
  const out = [];
  let used = 0;
  for (const entry of Array.isArray(entries) ? entries : []) {
    if (!entry || typeof entry !== 'object') continue;
    const item = {
      ref: out.length,
      type: cleanText(entry.entry_type, 40) || 'work',
      title: cleanText(entry.title, 200),
      organization: cleanText(entry.organization, 200),
      location: cleanText(entry.location, 120),
      dates: [cleanText(entry.start_date, 60), cleanText(entry.end_date, 60)].filter(Boolean).join(' to '),
      summary: cleanText(entry.summary, 1200),
      original_notes: cleanText(entry.raw_text, 2500),
      accomplishments: cleanList(entry.accomplishments, 25, 500),
      skills: cleanList(entry.skills, 25, 120),
      metrics: cleanList(entry.metrics, 15, 240),
      keywords: cleanList(entry.keywords, 25, 80),
      duty_timeline: (Array.isArray(entry.duty_timeline) ? entry.duty_timeline : []).map((period) => ({
        period: cleanText(period.period, 120), title: cleanText(period.title, 200),
        duties: cleanList(period.duties, 30, 500), skills: cleanList(period.skills, 30, 120)
      })),
      grouped: !!entry.grouped,
      roles: (Array.isArray(entry.roles) ? entry.roles : []).slice(0, 12).map((role) => ({
        title: cleanText(role?.title, 200),
        dates: cleanText(role?.dates, 120),
        accomplishments: cleanList(role?.accomplishments, 20, 500)
      }))
    };
    const size = JSON.stringify(item).length;
    if (out.length && used + size > budget) break;
    out.push(item);
    used += size;
  }
  return out;
}