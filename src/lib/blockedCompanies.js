// Client half of the employer blocklist.
//
// The matching rules here mirror base44/shared/blockedCompanies.ts exactly:
// the backend filters search results, the client needs the same answer to
// show the flag already set. They are kept identical and checked against each
// other, because two matchers that disagree are how a blocklist leaks.
import { base44 } from '@/api/base44Client';

const LEGAL_SUFFIXES = [
  'incorporated', 'inc', 'limited', 'ltd', 'llc', 'llp', 'lp', 'ulc', 'corp',
  'corporation', 'co', 'company', 'gmbh', 'plc', 'pte', 'pty', 'sa', 'ag', 'bv',
  'nv', 'srl', 'spa', 'kg', 'oy', 'ab'
];

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
  const board = JOB_BOARDS.find((known) => host === known || host.endsWith(`.${known}`));
  return board ? '' : host;
}

function entryKeys(entry) {
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

function entryDomains(entry) {
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

export async function loadBlocked() {
  try {
    const records = await base44.entities.BlockedCompany.list('-created_date', 200);
    return Array.isArray(records) ? records : [];
  } catch (error) {
    // A missing entity (before the schema sync lands) must not break a search.
    return [];
  }
}

// Flagging is a merge, not an insert. The same employer flagged from two
// postings with two spellings becomes one entry with a variant, so the list
// stays short enough to read.
export async function flagCompany({ company, url, title, reason = '', source = 'search', blocked = [] }) {
  const name = String(company || '').trim();
  const key = normaliseCompany(name);
  if (!name || !key) throw new Error('This posting does not name an employer to flag.');

  const domain = domainOf(url);
  // Exact key first, then a near match. "Acme Staffing Services" and "Acme
  // Staffing Inc" are one employer, and refusing to notice that is how a
  // blocklist grows five near-identical rows the client then has to prune.
  const sameKey = (entry) => entryKeys(entry).has(key);
  const contains = (entry) => {
    const other = normaliseCompany(entry?.name);
    if (!other || !key) return false;
    return key === other || key.startsWith(`${other} `) || other.startsWith(`${key} `);
  };
  const existing =
    blocked.find((entry) => entry?.active !== false && sameKey(entry)) ||
    blocked.find((entry) => entry?.active !== false && contains(entry));

  if (existing) {
    const aliases = new Set((existing.aliases || []).map((value) => String(value || '')));
    if (normaliseCompany(existing.name) !== key) aliases.add(name);
    const domains = new Set((existing.domains || []).map((value) => String(value || '').toLowerCase()));
    if (domain) domains.add(domain);
    return base44.entities.BlockedCompany.update(existing.id, {
      aliases: [...aliases].filter(Boolean),
      domains: [...domains].filter(Boolean),
      flagged_count: Number(existing.flagged_count || 1) + 1,
      last_flagged_at: new Date().toISOString(),
      sample_title: existing.sample_title || String(title || ''),
      reason: existing.reason || reason
    });
  }

  return base44.entities.BlockedCompany.create({
    name,
    match_key: key,
    aliases: [],
    domains: domain ? [domain] : [],
    reason,
    source,
    active: true,
    flagged_count: 1,
    last_flagged_at: new Date().toISOString(),
    sample_title: String(title || ''),
    notes: ''
  });
}

export async function unblockCompany(id) {
  return base44.entities.BlockedCompany.delete(id);
}
