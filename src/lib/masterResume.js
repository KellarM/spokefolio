// The current résumé: assembled live from the knowledge base. No job posting is
// involved, nothing is generated: the profile identity, master summary, core
// skills and every captured entry are already résumé-grade material, so the
// document is composed deterministically, always reflects the last save, and
// costs nothing to view. The shape matches the tailored résumé object the
// preview, the PDF export and the Word export already read.
import { sortEntriesByDate } from '@/lib/entryOrder';

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
  if (accomplishments.length) return accomplishments;
  const summary = String(entry.summary || '').trim();
  return summary ? [summary] : [];
};

export function buildMasterResume(profile = {}, entries = []) {
  const list = Array.isArray(entries) ? entries.filter(Boolean) : [];

  const experience = applyOwnOrder(
    sortEntriesByDate(list.filter((entry) => ['work', 'project'].includes(entry.entry_type))).map((entry) => ({
      title: String(entry.title || '').trim(),
      organization: String(entry.organization || '').trim(),
      location: String(entry.location || '').trim(),
      dates: formatEntryDates(entry.start_date, entry.end_date),
      bullets: entryBullets(entry)
    })),
    profile.experience_order
  );

  const education = list
    .filter((entry) => entry.entry_type === 'education')
    .map((entry) => ({
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
