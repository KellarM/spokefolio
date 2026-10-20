// The "add to résumé" pass: the check names a change worth points, and this reads the proposal
// that came back and folds it into the résumé. Nothing is ever invented — every line is drawn
// from the candidate's own history — so this only has to be honest about what will land.

const clean = (value) => String(value ?? '').trim();

const wordCount = (value) => clean(value).split(/\s+/).filter(Boolean).length;

function unique(values) {
  const seen = new Set();
  const out = [];
  for (const value of values) {
    const text = clean(value);
    if (!text) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(text);
  }
  return out;
}

// Adds only what is not already on the page, so a second pass never doubles a line.
function additions(current, incoming, limit) {
  const have = new Set((Array.isArray(current) ? current : []).map((item) => clean(item).toLowerCase()));
  const added = [];
  for (const item of unique(Array.isArray(incoming) ? incoming : [])) {
    if (have.has(item.toLowerCase())) continue;
    have.add(item.toLowerCase());
    added.push(item);
    if (added.length >= limit) break;
  }
  return added;
}

// One proposal: what will change, shown as lines the candidate can read, plus the résumé that
// results from accepting it.
export function buildResumeProposal(resume, patch) {
  const skillsAdded = additions(resume?.skills, patch?.skills_to_add, 12);
  const keywordsAdded = additions(resume?.keywords, patch?.keywords_to_add, 24);

  const nextSummary = clean(patch?.summary);
  const summaryChange =
    nextSummary && nextSummary.toLowerCase() !== clean(resume?.summary).toLowerCase() ? nextSummary : '';

  const roles = Array.isArray(resume?.experience) ? resume.experience : [];
  const addedBullets = [];
  for (const item of Array.isArray(patch?.bullets_to_add) ? patch.bullets_to_add : []) {
    const index = Number(item?.role_index);
    const byIndex = Number.isInteger(index) ? roles[index] : null;
    const wanted = clean(item?.role_title).toLowerCase();
    const named = wanted ? roles.filter((role) => clean(role?.title).toLowerCase() === wanted) : [];
    // A job block's own title is the surer signal: when it names exactly one block, the line
    // belongs there, whatever index came alongside it.
    const role = named.length === 1 ? named[0] : byIndex || named[0] || null;
    const text = clean(item?.text);
    if (!role || !text) continue;
    const existing = new Set((role.bullets || []).map((bullet) => clean(bullet).toLowerCase()));
    if (existing.has(text.toLowerCase())) continue;
    if (addedBullets.some((added) => added.text.toLowerCase() === text.toLowerCase())) continue;
    addedBullets.push({
      index: roles.indexOf(role),
      label: [role.title, role.organization].filter(Boolean).join(', ') || 'Role',
      text
    });
  }

  const nextResume = {
    ...resume,
    skills: [...(resume?.skills || []), ...skillsAdded],
    keywords: [...(resume?.keywords || []), ...keywordsAdded],
    summary: summaryChange || resume?.summary || '',
    experience: addedBullets.length
      ? roles.map((role, index) => {
          const forRole = addedBullets.filter((item) => item.index === index).map((item) => item.text);
          return forRole.length ? { ...role, bullets: [...(role.bullets || []), ...forRole] } : role;
        })
      : roles
  };

  const items = [];
  if (skillsAdded.length) {
    items.push({
      kind: 'skills',
      label: 'Skills line',
      detail: `${skillsAdded.length} term${skillsAdded.length === 1 ? '' : 's'} added`,
      preview: skillsAdded.join('   ·   ')
    });
  }
  if (keywordsAdded.length) {
    items.push({
      kind: 'keywords',
      label: 'Keyword line',
      detail: `${keywordsAdded.length} term${keywordsAdded.length === 1 ? '' : 's'} added`,
      preview: keywordsAdded.join('   ·   ')
    });
  }
  if (summaryChange) {
    items.push({
      kind: 'summary',
      label: 'Summary',
      detail: `${wordCount(resume?.summary)} words → ${wordCount(summaryChange)} words`,
      preview: summaryChange
    });
  }
  for (const bullet of addedBullets) {
    items.push({ kind: 'bullet', label: bullet.label, detail: 'One line added', preview: bullet.text });
  }

  const nothingToAdd = patch?.outcome === 'nothing_to_add' || !items.length;

  return {
    outcome: nothingToAdd ? 'nothing_to_add' : 'ready',
    explanation: clean(patch?.explanation),
    items,
    resume: nextResume
  };
}