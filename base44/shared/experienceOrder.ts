// The candidate's own job order, applied to every freshly written resume.
//
// An order is stored as "organization|title" strings, taken from the resume the candidate
// arranged by hand. Resumes are always built from the stored history, so those names repeat
// from one generation to the next and match once normalized. A job the order does not name
// keeps the reverse-chronological place it arrived in, so nothing is ever lost or hidden.

const norm = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');

function splitKey(key) {
  const text = String(key || '');
  const at = text.indexOf('|');
  if (at < 0) return [text, ''];
  return [text.slice(0, at), text.slice(at + 1)];
}

export function experienceKey(job) {
  return `${job?.organization || ''}|${job?.title || ''}`;
}

export function applyExperienceOrder(experience, order) {
  const jobs = Array.isArray(experience) ? experience : [];
  const keys = (Array.isArray(order) ? order : []).filter(Boolean);
  if (!jobs.length || !keys.length) return jobs;

  const left = jobs.map((job) => ({ job }));
  const ordered = [];
  for (const key of keys) {
    const [organization, title] = splitKey(key).map(norm);
    let pick = left.findIndex(({ job }) => norm(job.organization) === organization && norm(job.title) === title);
    if (pick < 0) pick = left.findIndex(({ job }) => norm(job.organization) === organization);
    if (pick >= 0) ordered.push(left.splice(pick, 1)[0].job);
  }

  return [...ordered, ...left.map(({ job }) => job)];
}