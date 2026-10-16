import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// The drive is measured from here.
const HOME_ADDRESS = '11613 91 Street NW, Edmonton, Alberta, Canada';
const PER_RUN = 12;

// Lines of a posting that could say where the work happens.
function locationHints(description) {
  const lines = (description || '')
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const named = lines.filter((line) =>
    /(location|address|work site|worksite|based in|city|region|area|Edmonton|Alberta|,\s?AB\b|[A-Z]\d[A-Z]\s?\d[A-Z]\d)/i.test(line)
  );
  return (named.length ? named : lines.slice(0, 8)).join(' | ').slice(0, 600);
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json().catch(() => ({}));
    const home = (payload && typeof payload.home_address === 'string' && payload.home_address.trim()) || HOME_ADDRESS;

    const applications = await base44.entities.JobApplication.list('-created_date', 200);
    const pending = (applications || []).filter((item) => !item.location_checked).slice(0, PER_RUN);
    if (!pending.length) return Response.json({ located: 0, remaining: 0 });

    const postings = pending.map((item) => ({
      id: item.id,
      company: item.company || '',
      job_title: item.job_title || '',
      location_clues: locationHints(item.job_description)
    }));

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: [
        'You place job postings on a map and measure the commute to them.',
        `The candidate lives at ${home}`,
        '',
        'For every posting below, work out where the job physically is, then the driving distance and the typical driving time from the candidate\'s home to that work site.',
        '',
        'Rules:',
        '- Use the location clues, the company name and public information to identify the work site.',
        '- Give a street address when the posting or public information supports one.',
        '- Never invent a street number. If only a city or neighbourhood is known, name that area (for example "Edmonton, AB (city centre)") and measure to its centre.',
        '- If no location can be established, return null address, distance_km and drive_minutes for that posting.',
        '- distance_km is driving distance in kilometres to one decimal place. drive_minutes is typical driving time in whole minutes in normal traffic.',
        '',
        'Postings:',
        JSON.stringify(postings)
      ].join('\n'),
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          results: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                address: { type: 'string' },
                distance_km: { type: 'number' },
                drive_minutes: { type: 'number' }
              },
              required: ['id']
            }
          }
        },
        required: ['results']
      }
    });

    const byId = new Map(((result && result.results) || []).map((row) => [row.id, row]));
    const updates = pending.map((item) => {
      const row = byId.get(item.id) || {};
      const address = typeof row.address === 'string' ? row.address.trim() : '';
      const distance = Number(row.distance_km);
      const minutes = Number(row.drive_minutes);
      // A posting that came in with its own address keeps it when the lookup cannot place the site.
      const patch = { id: item.id, work_address: address || item.work_address || '', location_checked: true };
      if (Number.isFinite(distance) && distance > 0) patch.drive_distance_km = Math.round(distance * 10) / 10;
      if (Number.isFinite(minutes) && minutes > 0) patch.drive_minutes = Math.round(minutes);
      return patch;
    });

    await base44.entities.JobApplication.bulkUpdate(updates);
    const remaining = Math.max(0, (applications || []).filter((item) => !item.location_checked).length - updates.length);
    return Response.json({ located: updates.length, remaining });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}