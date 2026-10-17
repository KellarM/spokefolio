import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';

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

// Pre-launch testing password. Override it any time by setting the
// ADMIN_RESET_PASSWORD secret in the Base44 editor; the secret wins.
const DEFAULT_PASSWORD = 'SpokeAdmin-2026-Reset';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);

    let body = {};
    try {
      body = await req.json();
    } catch (e) {
      body = {};
    }

    const mode = ['reset', 'stats', 'verify'].includes(body?.mode) ? body.mode : 'stats';
    const adminPassword = typeof body?.admin_password === 'string' ? body.admin_password : '';

    // Two ways in: a logged-in user with the admin role, or the shared
    // admin password. No account is needed for the password path.
    let user = null;
    try {
      user = await base44.auth.me();
    } catch (e) {
      user = null;
    }
    const roleOk = !!user && user.role === 'admin';

    const configured = secrets.get('ADMIN_RESET_PASSWORD') || DEFAULT_PASSWORD;
    const passwordOk = adminPassword.length > 0 && adminPassword === configured;

    if (mode === 'verify') {
      if (passwordOk || roleOk) {
        return Response.json({ ok: true, via: roleOk ? 'role' : 'password' });
      }
      return Response.json({ error: 'Invalid admin password.' }, { status: 403 });
    }

    if (!passwordOk && !roleOk) {
      return Response.json({ error: 'Admin access required.' }, { status: 403 });
    }

    // Password logins have no account, so they work on the whole database.
    // Logged-in admins can additionally choose to wipe only their own data.
    const scope = roleOk ? (body?.scope === 'all' ? 'all' : 'mine') : 'all';

    const results = {};

    for (const entity of ENTITIES) {
      const scoped =
        scope === 'all'
          ? base44.asServiceRole.entities[entity]
          : base44.entities[entity];

      if (mode === 'stats') {
        results[entity] = await scoped.count();
      } else {
        // Wipe. Delete by id, page by page, until an entity comes back short.
        // Deletion always goes through the service-role client so records
        // beyond the caller's own access are removed.
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
