// The current résumé: assembled live from the knowledge base. No job posting is
// involved, nothing is generated: the profile identity, master summary, core
// skills and every captured entry are already résumé-grade material, so the
// document is composed deterministically, always reflects the last save, and
// costs nothing to view. The shape matches the tailored résumé object the
// preview, the PDF export and the Word export already read.
import { sortEntriesByDate, dateValue } from '@/lib/entryOrder';

// One date range as the résumé prints it. "2024" and "present" stay honest:
// only the wording is tidied, the dates themselves never change.
export function formatEntryDates(start, end) {
  const s = String(start || '').trim();
  const e = String(end || '').trim();
  const endWord = e ? (/^(present|current|ongoing|now|today)$/i.test(e) ? 'Present' : e) : '';
  if (!s && !endWord) return '';
  if (!s) return endWord;
  if (!endWord) return s;
  return `${s} – ${endWord}`;
}

const asList = (value) =>
  (Array.isArray(value) ? value : [])
    .map((item) => String(item == null ? '' : item).trim())
    .filter(Boolean);

const norm = (value) => String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();

// Captures sometimes hold the same bullet twice in slightly different wording
// rounds. The first copy wins; near-identical restatements are dropped.
function dedupeBullets(bullets) {
  const seen = new Set();
  const kept = [];
  for (const bullet of bullets) {
    const key = norm(bullet).replace(/[^a-z0-9]+/g, ' ').trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    kept.push(bullet);
  }
  return kept;
}

// The printed résumé targets a two-page maximum (the same page the tailored
// résumé fills). A role prints at most its MAX_PER_ROLE strongest bullets,
// and the whole document at most MAX_TOTAL: when the total is over budget the
// longest lists are trimmed from the end until it fits, so a single huge
// capture never buries the other roles.
const MAX_PER_ROLE = 8;
const MAX_TOTAL = 22;

function budgetBullets(roles) {
  const capped = roles.map((role) => ({
    ...role,
    bullets: (role.bullets || []).slice(0, MAX_PER_ROLE)
  }));
  let total = capped.reduce((sum, role) => sum + role.bullets.length, 0);
  while (total > MAX_TOTAL) {
    const longest = capped.reduce((best, role) => (role.bullets.length > best.bullets.length ? role : best), capped[0]);
    if (longest.bullets.length <= 2) break;
    longest.bullets = longest.bullets.slice(0, -1);
    total -= 1;
  }
  return capped;
}

// The person's own role order (the same "organization|title" keys the résumé
// builder uses) wins when it exists; anything it does not name keeps its
// newest-first place after it.
function applyOwnOrder(experience, order) {
  const keys = asList(order);
  if (!keys.length || !experience.length) return experience;

  const rank = (role) => {
    let index = keys.findIndex((key) => {
      const at = key.indexOf('|');
      const organization = key.slice(0, at);
      const title = key.slice(at + 1);
      return (
        norm(organization) === norm(role.organization) &&
        (!title.trim() || norm(title) === norm(role.title))
      );
    });
    if (index < 0) {
      index = keys.findIndex((key) => norm(key.split('|')[0]) === norm(role.organization));
    }
    return index < 0 ? keys.length : index;
  };

  return [...experience].sort((a, b) => rank(a) - rank(b));
}

// One entry's bullets: the accomplishments as captured. When an entry holds
// none yet, its summary stands in as a single bullet so no role prints empty.
const entryBullets = (entry) => {
  const accomplishments = asList(entry.accomplishments);
  if (accomplishments.length) return dedupeBullets(accomplishments);
  const summary = String(entry.summary || '').trim();
  return summary ? [summary] : [];
};

export function buildMasterResume(profile = {}, entries = []) {
  const list = Array.isArray(entries) ? entries.filter(Boolean) : [];

  const experience = budgetBullets(
    applyOwnOrder(
      sortEntriesByDate(list.filter((entry) => ['work', 'project'].includes(entry.entry_type))).map((entry) => ({
        title: String(entry.title || '').trim(),
        organization: String(entry.organization || '').trim(),
        location: String(entry.location || '').trim(),
        dates: formatEntryDates(entry.start_date, entry.end_date),
                // The captured scope sentence prints as the role's lead line. It is left
        // out when it had to stand in as the only bullet, so it never prints twice.
        summary: asList(entry.accomplishments).length ? String(entry.summary || '').trim() : '',
        bullets: entryBullets(entry)
      })),
      profile.experience_order
    )
  );

  const education = sortEntriesByDate(list.filter((entry) => entry.entry_type === 'education')).map((entry) => ({
    degree: String(entry.title || '').trim(),
    institution: String(entry.organization || '').trim(),
    dates: formatEntryDates(entry.start_date, entry.end_date),
    detail: String(entry.summary || '').trim()
  }));

  const certifications = list
    .filter((entry) => entry.entry_type === 'certification')
    .map((entry) => [String(entry.title || '').trim(), String(entry.organization || '').trim()].filter(Boolean).join(' – '));

  return {
    // A generic résumé carries no keywords: those exist only when a posting
    // is answered. The sections the knowledge base cannot fill simply do
    // not print.
    headline: String(profile.headline || asList(profile.target_titles)[0] || '').trim(),
    summary: String(profile.master_summary || '').trim(),
    skills: asList(profile.core_skills),
    experience,
    education,
    certifications
  };
}
