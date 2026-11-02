// The employer blocklist.
//
// Some employers post the same dead or invented job over and over, and those
// listings recycle into every search. One flag writes the employer here; the
// search and the import path then drop it before the client ever sees it.
//
// Matching is the whole difficulty. The same employer appears as "Acme
// Staffing Inc", "ACME STAFFING" and "Acme Staffing Services", so names are
// never compared directly. Each entry carries a normalised key plus any
// variants flagged later, and a domain when the posting carried one.

// Legal forms say nothing about who the employer is, so they come off.
const LEGAL_SUFFIXES = [
  'incorporated', 'inc', 'limited', 'ltd', 'llc', 'llp', 'lp', 'ulc', 'corp',
  'corporation', 'co', 'company', 'gmbh', 'plc', 'pte', 'pty', 'sa', 'ag', 'bv',
  'nv', 'srl', 'spa', 'kg', 'oy', 'ab'
];

// A posting's link is often a board, not the employer. Blocking a board would
// block every employer on it, so a board host never becomes a domain match.
const JOB_BOARDS = [
  'indeed.com', 'indeed.ca', 'linkedin.com', 'glassdoor.com', 'glassdoor.ca',
  'jobbank.gc.ca', 'workopolis.com', 'monster.ca', 'monster.com', 'ziprecruiter.com',
  'ziprecruiter.ca', 'eluta.ca', 'careerbuilder.com', 'simplyhired.com',
  'talent.com', 'jooble.org', 'neuvoo.ca', 'workbc.ca', 'jobillico.com',
  'facebook.com', 'kijiji.ca', 'craigslist.org', 'google.com'
];

export function normaliseCompany(name) {
  const base = String(name || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!base) return '';

  const words = base.split(' ').filter((word) => word && word !== 'the');
  // Trailing legal forms only. "Co" at the end is a legal form; stripping it
  // mid-name would merge employers that only share a word.
  while (words.length > 1 && LEGAL_SUFFIXES.includes(words[words.length - 1])) {
    words.pop();
  }
  return words.join(' ').trim();
}

export function domainOf(url) {
  let host = '';
  try {
    host = new URL(String(url || '')).hostname.toLowerCase().replace(/^www\./, '');
  } catch (error) {
    return '';
  }
  if (!host) return '';
  const board = JOB_BOARDS.find((known) => host === known || host.endsWith('.' + known));
  return board ? '' : host;
}

export function entryKeys(entry) {
  const keys = new Set();
  const add = (value) => {
    const key = normaliseCompany(value);
    if (key) keys.add(key);
  };
  add(entry?.name);
  add(entry?.match_key);
  (entry?.aliases || []).forEach(add);
  return keys;
}

export function entryDomains(entry) {
  return new Set(
    (entry?.domains || [])
      .map((value) => String(value || '').toLowerCase().replace(/^www\./, ''))
      .filter(Boolean)
  );
}

export function isBlocked(company, url, blocked) {
  if (!Array.isArray(blocked) || !blocked.length) return false;
  const key = normaliseCompany(company);
  const domain = domainOf(url);
  return blocked.some((entry) => {
    if (entry?.active === false) return false;
    if (key && entryKeys(entry).has(key)) return true;
    if (domain && entryDomains(entry).has(domain)) return true;
    return false;
  });
}

// What a search keeps. Returns the dropped count too, so the client can say
// what happened rather than quietly returning fewer postings.
export function filterBlocked(results, blocked) {
  const list = Array.isArray(results) ? results : [];
  if (!Array.isArray(blocked) || !blocked.length) return { kept: list, dropped: 0 };
  const kept = list.filter((item) => !isBlocked(item?.company, item?.source_url, blocked));
  return { kept, dropped: list.length - kept.length };
}
