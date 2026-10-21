import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Admin activity dashboard for Spokefolio.
// Gated server-side by password: env var ADMIN_STATS_PASSWORD wins if set,
// otherwise the SHA-256 constant below (hash of the studio-chosen password).
const FALLBACK_PASSWORD_SHA256 = '38a948146c53151969ccc22f9a835920e0c58b6ed1e7f13a460ae69179954b4e';

async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function countByDay(events, days) {
  const daysAgo = (n) => {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() - n);
    return d.toISOString().slice(0, 10);
  };
  const buckets = [];
  for (let i = days - 1; i >= 0; i--) buckets.push({ date: daysAgo(i), opens: 0, actions: 0 });
  const index = new Map(buckets.map((b, i) => [b.date, i]));
  for (const event of events) {
    const key = String(event.created_date || '').slice(0, 10);
    const i = index.get(key);
    if (i == null) continue;
    if (event.event_type === 'app_open') buckets[i].opens += 1;
    else buckets[i].actions += 1;
  }
  return buckets;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const password = String(body.password || '');

    const envPassword = Deno.env.get('ADMIN_STATS_PASSWORD');
    const matches = envPassword
      ? password === envPassword
      : await sha256Hex(password) === FALLBACK_PASSWORD_SHA256;

    if (!password || !matches) {
      return Response.json({ error: 'Wrong admin password.' }, { status: 401 });
    }

    const svc = base44.asServiceRole;
    const capped = { value: false };
    const grab = async (entity, sort = '-created_date', limit = 500) => {
      const items = await svc.entities[entity].list(sort, limit);
      const rows = Array.isArray(items) ? items : (items && items.items) || [];
      if (rows.length >= limit) capped.value = true;
      return rows;
    };

    const [users, applications, resumeProfiles, events] = await Promise.all([
      grab('User'),
      grab('JobApplication'),
      grab('ResumeProfile'),
      grab('AppEvent')
    ]);

    const resumes = applications.filter(
      (a) => a.status && a.status !== 'draft' && a.resume
    );

    const distinct = (set, value) => {
      if (value) set.add(value);
      return set;
    };

    const openEvents = events.filter((e) => e.event_type === 'app_open');
    const actionEvents = events.filter((e) => e.event_type !== 'app_open');

    const usedUsers = new Set();
    applications.forEach((a) => distinct(usedUsers, a.created_by_id));
    resumeProfiles.forEach((p) => distinct(usedUsers, p.created_by_id));
    actionEvents.forEach((e) => distinct(usedUsers, e.created_by_id));

    const openUsers = new Set();
    openEvents.forEach((e) => distinct(openUsers, e.created_by_id));

    return Response.json({
      data: {
        signups: users.length,
        totalResumes: resumes.length,
        applicationsTracked: applications.length,
        appOpens: openEvents.length,
        appOpenUsers: openUsers.size,
        usedApp: usedUsers.size,
        daily: countByDay(events, 14),
        countsCapped: capped.value,
        eventsFrom: events.length ? null : '2026-10-21'
      }
    });
  } catch (error) {
    return Response.json({ error: error.message || 'Stats unavailable.' }, { status: 500 });
  }
}
