import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { entryData, validateDrafts, ownedReview, sourceRecords, assertUnchanged } from '../../shared/historyReview.ts';
export default async function(req) {
  try {
    const client = createClientFromRequest(req); const user = await client.auth.me();
    if (!user) return Response.json({ error: 'Please sign in.' }, { status: 401 });
    const body = await req.json();
    if (!['save','apply','restore'].includes(body.action) || typeof body.review_id !== 'string') return Response.json({ error: 'Choose a review and an action.' }, { status: 400 });
    let review = await ownedReview(client, user, body.review_id);
    const sourceIds = review.sources.map(s => s.id);
    if (!sourceIds.length || sourceIds.length > 30) throw new Error('Invalid review sources.');
    if (body.action === 'save') {
      if (review.status !== 'draft') throw new Error('This review is no longer editable.');
      validateDrafts(body.drafts, review.sources);
      return Response.json({ review: await client.entities.CareerHistoryReview.update(review.id, { drafts: body.drafts }) });
    }
    if (body.action === 'apply') {
      if (review.status === 'applied') return Response.json({ review });
      if (!['draft','applying'].includes(review.status)) throw new Error('This review cannot be applied.');
      if (review.status === 'draft') {
        validateDrafts(body.drafts, review.sources);
        assertUnchanged(await sourceRecords(client, user, sourceIds), review.sources);
        review = await client.entities.CareerHistoryReview.update(review.id, { drafts: body.drafts, status: 'applying' });
      }
      const replacements = review.drafts.map((draft, i) => {
        const originals = review.sources.filter(s => draft.source_ids.includes(s.id));
        return { ...entryData(draft), raw_text: originals.map(s => `[${s.title} · ${s.organization || ''} · ${s.start_date || ''} – ${s.end_date || ''}]\n${s.raw_text || ''}`).join('\n\n'),
          answers: [...originals.flatMap(s => s.answers || []), ...(review.answers || [])], suggestions: review.questions || [], suggestion_index: 0, status: 'confirmed', review_record_key: `review:${review.id}:${i}` };
      });
      await client.entities.CareerEntry.upsert(replacements, { key: 'review_record_key' });
      const page = await client.entities.CareerEntry.filter({ created_by_id: user.id, review_record_key: { $in: replacements.map(r => r.review_record_key) } }, { limit: 50 });
      if (page.items.length !== replacements.length) throw new Error('Replacement is incomplete. Retry to finish safely.');
      await client.entities.CareerHistoryReview.update(review.id, { result_ids: page.items.map(r => r.id), result_versions: page.items.map(r => ({ id: r.id, updated_date: r.updated_date })) });
      await client.entities.CareerEntry.deleteMany({ id: { $in: sourceIds }, created_by_id: user.id });
      review = await client.entities.CareerHistoryReview.update(review.id, { status: 'applied' });
      return Response.json({ review });
    }
    if (review.status === 'restored') return Response.json({ review });
    if (!['applying','applied','restoring'].includes(review.status)) throw new Error('Only an accepted or interrupted replacement can be restored.');
    if (review.status === 'applied') assertUnchanged(await sourceRecords(client, user, review.result_ids || []), review.result_versions || []);
    if (review.status !== 'restoring') review = await client.entities.CareerHistoryReview.update(review.id, { status: 'restoring' });
    const existing = await sourceRecords(client, user, sourceIds);
    const missing = review.sources.filter(s => !existing.some(e => e.id === s.id));
    if (missing.length) await client.entities.CareerEntry.upsert(missing.map(s => ({ ...entryData(s), review_record_key: `restore:${review.id}:${s.id}` })), { key: 'review_record_key' });
    const keys = review.drafts.map((_, i) => `review:${review.id}:${i}`);
    await client.entities.CareerEntry.deleteMany({ created_by_id: user.id, review_record_key: { $in: keys } });
    review = await client.entities.CareerHistoryReview.update(review.id, { status: 'restored' });
    return Response.json({ review });
  } catch (error) { return Response.json({ error: error.message || 'Could not finish this review. Originals remain in the review backup.' }, { status: 400 }); }
}