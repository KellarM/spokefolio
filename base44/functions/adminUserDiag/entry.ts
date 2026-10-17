import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';

// Temporary, admin-gated diagnostic: lists the app's user records (safe
// fields only) and maps which user owns the existing data records.
// No secrets, no passwords, no writes. Removed once the admin tie-in is done.

export default async function (req) {
  try {
    const body = await req.json().catch(() => ({}));
    const login = typeof body?.admin_login === 'string' ? body.admin_login.trim() : '';
    const password = typeof body?.admin_password === 'string' ? body.admin_password : '';

    const configuredLogin = secrets.get('ADMIN_RESET_LOGIN') || 'Admin';
    const configuredPassword = secrets.get('ADMIN_RESET_PASSWORD') || 'William';
    const ok =
      login.length > 0 &&
      login.toLowerCase() === configuredLogin.toLowerCase() &&
      password === configuredPassword;
    if (!ok) {
      return Response.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const base44 = createClientFromRequest(req);

    // App users, safe fields only
    const users = await base44.asServiceRole.entities.User.list();
    const usersOut = users.map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      full_name: u.full_name ?? null,
      keys: Object.keys(u),
      created: u.created_date ?? null,
    }));

    // Data ownership: which user created the existing records
    const ownership = {};
    const entities = [
      'CareerEntry',
      'JobApplication',
      'ResumeProfile',
      'JobPosting',
      'SupportingDocument',
    ];
    for (const entity of entities) {
      const recs = await base44.asServiceRole.entities[entity].list(
        null, 100, 0, ['id', 'created_by']
      );
      ownership[entity] = recs.map((r) => ({
        id: r.id,
        created_by: r.created_by ?? null,
      }));
    }

    // One full record from CareerEntry to see every available field
    const fullRecs = await base44.asServiceRole.entities.CareerEntry.list(
      null, 1, 0, ['*']
    );

    return Response.json({ users: usersOut, ownership, sample: fullRecs[0] ?? null });
  } catch (e) {
    return Response.json({ error: e?.message || 'Diagnostic failed.' }, { status: 500 });
  }
}
