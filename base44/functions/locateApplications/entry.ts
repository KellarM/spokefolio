import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { estimateCommutes } from '../../shared/commute.ts';

const PER_RUN = 12;

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json().catch(() => ({}));
    const home = payload && typeof payload.home_address === 'string' ? payload.home_address.trim() : '';
    const target = payload?.target === 'postings' ? 'postings' : payload?.target === 'applications' ? 'applications' : 'both';

    let locatedCount = 0;
    let remainingCount = 0;

    if (target === 'applications' || target === 'both') {
      const applications = await base44.entities.JobApplication.list('-created_date', 200);
      const uncheckedApps = (applications || []).filter((item) => !item.location_checked);
      const pendingApps = uncheckedApps.slice(0, PER_RUN);

      if (pendingApps.length) {
        const byId = await estimateCommutes(base44, pendingApps, home);
        const updates = pendingApps.map((item) => {
          const row = byId.get(String(item.id)) || {};
          const patch = {
            id: item.id,
            work_address: row.work_address || item.work_address || '',
            location_checked: true
          };
          if (row.drive_distance_km != null) patch.drive_distance_km = row.drive_distance_km;
          if (row.drive_minutes != null) patch.drive_minutes = row.drive_minutes;
          return patch;
        });
        await base44.entities.JobApplication.bulkUpdate(updates);
        locatedCount += updates.length;
        remainingCount += Math.max(0, uncheckedApps.length - updates.length);
      }
    }

    if (target === 'postings' || target === 'both') {
      const postings = await base44.entities.JobPosting.list('-created_date', 200);
      const uncheckedPostings = (postings || []).filter((item) => !item.location_checked);
      const pendingPostings = uncheckedPostings.slice(0, PER_RUN);

      if (pendingPostings.length) {
        const byId = await estimateCommutes(base44, pendingPostings, home);
        const updates = pendingPostings.map((item) => {
          const row = byId.get(String(item.id)) || {};
          const patch = {
            id: item.id,
            work_address: row.work_address || item.work_address || '',
            location_checked: true
          };
          if (row.drive_distance_km != null) patch.drive_distance_km = row.drive_distance_km;
          if (row.drive_minutes != null) patch.drive_minutes = row.drive_minutes;
          return patch;
        });
        await base44.entities.JobPosting.bulkUpdate(updates);
        locatedCount += updates.length;
        remainingCount += Math.max(0, uncheckedPostings.length - updates.length);
      }
    }

    return Response.json({ located: locatedCount, remaining: remainingCount });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}