const strings = { type: 'array', items: { type: 'string' } };
export const entrySchema = { type: 'object', properties: {
  source_ids: strings, entry_type: { type: 'string', enum: ['work','project','education','certification','skill','testimonial','achievement','other'] },
  title: { type: 'string' }, organization: { type: 'string' }, location: { type: 'string' }, start_date: { type: 'string' }, end_date: { type: 'string' }, summary: { type: 'string' },
  accomplishments: strings, skills: strings, metrics: strings, keywords: strings, grouped: { type: 'boolean' },
  roles: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, dates: { type: 'string' }, accomplishments: strings }, required: ['title','dates','accomplishments'] } },
  duty_timeline: { type: 'array', items: { type: 'object', properties: { period: { type: 'string' }, title: { type: 'string' }, duties: strings, skills: strings }, required: ['period','title','duties','skills'] } }
}, required: ['source_ids','entry_type','title','organization','location','start_date','end_date','summary','accomplishments','skills','metrics','keywords','grouped','roles','duty_timeline'] };
export function entryData(record) {
  const { id, created_date, updated_date, created_by_id, created_by, source_ids, ...data } = record;
  return data;
}
export function validateDrafts(drafts, sources) {
  if (!Array.isArray(drafts) || !drafts.length || drafts.length > sources.length || JSON.stringify(drafts).length > 150000) throw new Error('Review must contain one or more entries within the size limit.');
  const ids = new Set(sources.map(s => s.id)); const seen = new Set();
  for (const draft of drafts) {
    if (!draft.title?.trim() || !Array.isArray(draft.source_ids) || !draft.source_ids.length) throw new Error('Each organized entry needs a title and its original sources.');
    const employers = new Set();
    for (const id of draft.source_ids) {
      if (!ids.has(id) || seen.has(id)) throw new Error('Every original must belong to exactly one organized entry.');
      seen.add(id);
      const org = sources.find(s => s.id === id)?.organization?.trim().toLowerCase();
      if (org) employers.add(org);
    }
    if (employers.size > 1) throw new Error('Keep different employers in separate entries.');
  }
  if (seen.size !== ids.size) throw new Error('An original entry was missed. Please organize again.');
}
export async function ownedReview(client, user, id) {
  const page = await client.entities.CareerHistoryReview.filter({ id, created_by_id: user.id }, { limit: 1 });
  if (!page.items[0]) throw new Error('This review is not available.');
  return page.items[0];
}
export async function sourceRecords(client, user, ids) {
  const page = await client.entities.CareerEntry.filter({ id: { $in: ids }, created_by_id: user.id }, { limit: 50 });
  return page.items;
}
export function assertUnchanged(current, snapshots) {
  if (current.length !== snapshots.length || snapshots.some(s => !current.some(c => c.id === s.id && c.updated_date === s.updated_date))) throw new Error('These entries changed since the review began. Start a fresh review to protect your latest edits.');
}