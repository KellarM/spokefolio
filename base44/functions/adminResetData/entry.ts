import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Entities wiped by a reset. User accounts are never touched.
const ENTITIES = [
  'CareerEntry',
  'CareerHistoryReview',
  'JobApplication',
  'JobPosting',
  'ResumeProfile',
  'SupportingDocument',
];

const PAGE_SIZE = 200;
const MAX_PAGES = 50; // hard stop: 10,000 records per entity

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);

    // Authoritative server-side check. The UI guard is convenience only.
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required.' }, { status: 403 });
    }

    let body = {};
    try {
      body = await req.json();
    } catch (e) {
      body = {};
    }

    const mode = body?.mode === 'reset' ? 'reset' : 'stats';
    const scope = body?.scope === 'all' ? 'all' : 'mine';

    const results = {};

    for (const entity of ENTITIES) {
      const scoped =
        scope === 'all'
          ? base44.asServiceRole.entities[entity]
          : base44.entities[entity];

      if (mode === 'stats') {
        // Count only. 'mine' stays user-scoped (RLS applies); 'all' uses
        // service role so the admin sees the whole database.
        results[entity] = await scoped.count();
      } else {
        // Wipe. Delete by id, page by page, until an entity comes back short.
        // The service-role client deletes records the admin cannot reach
        // through the user-scoped client, so always delete through it.
        let count = 0;
        let page = 0;
        while (page < MAX_PAGES) {
          const records = await scoped.list('-created_date', PAGE_SIZE, page * PAGE_SIZE);
          if (!records.length) break;
          for (const record of records) {
            await base44.asServiceRole.entities[entity].delete(record.id);
            count += 1;
          }
          if (records.length < PAGE_SIZE) break;
          page += 1;
        }
        results[entity] = count;
      }
    }

    return Response.json({
      ok: true,
      mode,
      scope,
      results,
      at: new Date().toISOString(),
    });
  } catch (e) {
    return Response.json({ error: e?.message || 'Admin reset request failed.' }, { status: 500 });
  }
}
