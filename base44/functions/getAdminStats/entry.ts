import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Admin activity dashboard for Spokefolio.
// Gated server-side by password: env var ADMIN_STATS_PASSWORD wins if set,
// otherwise the SHA-256 constant below (hash of the studio-chosen password).
const FALLBACK_PASSWORD_SHA256 = '82d3042b941378bc994b8c2596fa69e4370bd2cb5400c4c043c996dc197fda7c';

async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// The website beacon stores its visitor id at the front of metadata JSON;
// regex first, parse as backup.
function visitorOf(event) {
  const meta = String(event.metadata || '');
  const m = meta.match(/"visitor":"([^"]+)"/);
  if (m) return m[1];
  try {
    return String((JSON.parse(meta) || {}).visitor || '');
  } catch {
    return '';
  }
}

function countByDay(events, days) {
  const daysAgo = (n) => {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() - n);
    return d.toISOString().slice(0, 10);
  };
  const buckets = [];
  for (let i = days - 1; i >= 0; i--) buckets.push({ date: daysAgo(i), opens: 0, actions: 0, visits: 0 });
  const index = new Map(buckets.map((b, i) => [b.date, i]));
  // One person opening many times in a day is one open that day. Website
  // visits follow the same rule: one anonymous visitor, once per day.
  const openPeopleByDay = new Map();
  const siteVisitorsByDay = new Map();
  for (const event of events) {
    const key = String(event.created_date || '').slice(0, 10);
    const i = index.get(key);
    if (i == null) continue;
    if (event.event_type === 'app_open') {
      const people = openPeopleByDay.get(key) || new Set();
      people.add(event.created_by_id);
      openPeopleByDay.set(key, people);
    } else if (event.event_type === 'site_visit') {
      const visitors = siteVisitorsByDay.get(key) || new Set();
      visitors.add(visitorOf(event));
      siteVisitorsByDay.set(key, visitors);
    } else {
      buckets[i].actions += 1;
    }
  }
  for (const b of buckets) {
    b.opens = (openPeopleByDay.get(b.date) || new Set()).size;
    b.visits = (siteVisitorsByDay.get(b.date) || new Set()).size;
  }
  return buckets;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const password = String(body.password || '');

    // Normalize: trim stray whitespace and compare case-insensitively, so
    // phone keyboards (which do not autocapitalize password fields) work.
    const normalized = password.trim().toLowerCase();
    const envPassword = Deno.env.get('ADMIN_STATS_PASSWORD');
    const matches = envPassword
      ? password === envPassword || normalized === String(envPassword).trim().toLowerCase()
      : await sha256Hex(normalized) === FALLBACK_PASSWORD_SHA256;

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
      grab('AppEvent', '-created_date', 5000)
    ]);

    const resumes = applications.filter(
      (a) => a.status && a.status !== 'draft' && a.resume
    );

    const distinct = (set, value) => {
      if (value) set.add(value);
      return set;
    };

    const openEvents = events.filter((e) => e.event_type === 'app_open');
    const siteEvents = events.filter((e) => e.event_type === 'site_visit');
    const actionEvents = events.filter(
      (e) => e.event_type !== 'app_open' && e.event_type !== 'site_visit'
    );

    const usedUsers = new Set();
    applications.forEach((a) => distinct(usedUsers, a.created_by_id));
    resumeProfiles.forEach((p) => distinct(usedUsers, p.created_by_id));
    actionEvents.forEach((e) => distinct(usedUsers, e.created_by_id));

    const openUsers = new Set();
    openEvents.forEach((e) => distinct(openUsers, e.created_by_id));

    // "Opened the app" counts a person once per day, however many times
    // they opened it that day.
    const openDays = new Set();
    openEvents.forEach((e) => {
      if (e.created_by_id) openDays.add(`${e.created_by_id}|${String(e.created_date || '').slice(0, 10)}`);
    });

    // The website, same rule: one anonymous visitor counts once per day.
    const siteVisitors = new Set();
    const siteVisitDays = new Set();
    siteEvents.forEach((e) => {
      const visitor = visitorOf(e);
      if (!visitor) return;
      siteVisitors.add(visitor);
      siteVisitDays.add(`${visitor}|${String(e.created_date || '').slice(0, 10)}`);
    });

    // Per-account usage detail for the signups table.
    // events are sorted newest first, so the first hit per user is the latest.
    const lastOpen = new Map();
    const lastAction = new Map();
    const openDaysByUser = new Map();
    for (const e of events) {
      const id = e.created_by_id;
      if (!id) continue;
      if (e.event_type === 'app_open') {
        if (!lastOpen.has(id)) lastOpen.set(id, e.created_date);
        const days = openDaysByUser.get(id) || new Set();
        days.add(String(e.created_date || '').slice(0, 10));
        openDaysByUser.set(id, days);
      } else if (!lastAction.has(id)) {
        lastAction.set(id, e.created_date);
      }
    }
    const resumesByUser = new Map();
    const appsByUser = new Map();
    for (const a of applications) {
      const id = a.created_by_id;
      if (!id) continue;
      appsByUser.set(id, (appsByUser.get(id) || 0) + 1);
      if (a.status && a.status !== 'draft' && a.resume) {
        resumesByUser.set(id, (resumesByUser.get(id) || 0) + 1);
      }
    }

    const locationByUser = new Map();
    for (const p of resumeProfiles) {
      if (p.location && p.created_by_id && !locationByUser.has(p.created_by_id)) {
        locationByUser.set(p.created_by_id, String(p.location).slice(0, 80));
      }
    }

    // Funnel stages: distinct users who reached each stage.
    const intakeUsers = new Set(
      resumeProfiles.filter((p) => p.history_complete === true).map((p) => p.created_by_id)
    );
    const sentByUser = new Map();
    const appliedUsers = new Set();
    const interviewUsers = new Set();
    for (const a of applications) {
      const id = a.created_by_id;
      if (!id) continue;
      if (a.last_sent_at) sentByUser.set(id, (sentByUser.get(id) || 0) + 1);
      if (['applied', 'contacted', 'interviewing', 'offer'].includes(a.status)) appliedUsers.add(id);
      if (['interviewing', 'offer'].includes(a.status)) interviewUsers.add(id);
    }
    const funnel = [
      { key: 'signup', label: 'Signed up', users: users.length },
      { key: 'intake', label: 'Intake completed', users: intakeUsers.size },
      { key: 'resume', label: 'Resume generated', users: [...resumesByUser.keys()].length },
      { key: 'sent', label: 'Sent to employer', users: [...sentByUser.keys()].length },
      { key: 'applied', label: 'Applied or beyond', users: appliedUsers.size },
      { key: 'interview', label: 'Interviewing or offer', users: interviewUsers.size }
    ];
    const stageOf = (userId) => {
      let stage = 1;
      if (intakeUsers.has(userId)) stage = 2;
      if (resumesByUser.get(userId)) stage = 3;
      if (sentByUser.has(userId)) stage = 4;
      if (appliedUsers.has(userId)) stage = 5;
      if (interviewUsers.has(userId)) stage = 6;
      return stage;
    };

    const signups = users
      .map((u) => ({
        id: u.id,
        name: u.full_name || '',
        email: u.email || '',
        role: u.role || 'user',
        location: locationByUser.get(u.id) || null,
        created: u.created_date || null,
        lastOpen: lastOpen.get(u.id) || null,
        lastAction: lastAction.get(u.id) || null,
        opens: (openDaysByUser.get(u.id) || new Set()).size,
        resumes: resumesByUser.get(u.id) || 0,
        applications: appsByUser.get(u.id) || 0,
        stage: stageOf(u.id)
      }))
      .sort((a, b) => String(b.created || '').localeCompare(String(a.created || '')));

    return Response.json({
      signups: users.length,
      totalResumes: resumes.length,
      applicationsTracked: applications.length,
      appOpens: openDays.size,
      appOpenUsers: openUsers.size,
      websiteVisits: siteVisitDays.size,
      websiteVisitors: siteVisitors.size,
      usedApp: usedUsers.size,
      daily: countByDay(events, 14),
      funnel,
      accounts: signups,
      countsCapped: capped.value,
      eventsFrom: events.length ? null : '2026-10-21'
    });
  } catch (error) {
    return Response.json({ error: error.message || 'Stats unavailable.' }, { status: 500 });
  }
}