import { cleanText } from './career.ts';

// Default home address in Edmonton, used when the applicant's profile specifies only a city or no street address.
export const DEFAULT_HOME_ADDRESS = '11613 91 Street NW, Edmonton, Alberta, Canada';

export function resolveHomeAddress(profileLocation) {
  const raw = cleanText(String(profileLocation == null ? '' : profileLocation), 160);
  if (!raw) return DEFAULT_HOME_ADDRESS;
  // If the user entered a street number, use their exact address; if they entered "Edmonton" or "Edmonton Alberta", use the full Edmonton home address.
  if (/\d/.test(raw)) return raw;
  if (/edmonton/i.test(raw)) return DEFAULT_HOME_ADDRESS;
  return raw;
}

// Lines of a posting that could say where the work happens.
export function locationHints(description, workAddress = '') {
  const lines = (description || '')
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const named = lines.filter((line) =>
    /(location|address|work site|worksite|based in|city|region|area|street|ave|avenue|road|rd|blvd|boulevard|park|industrial|edmonton|alberta|,\s?[A-Z]{2}\b|[A-Z]\d[A-Z]\s?\d[A-Z]\d)/i.test(
      line
    )
  );
  const clues = [workAddress, ...(named.length ? named : lines.slice(0, 8))].filter(Boolean);
  return clues.join(' | ').slice(0, 650);
}

// Uses live web lookup + LLM to find each job's physical work site and calculate driving distance (km) and time (minutes) from home.
export async function estimateCommutes(base44, items, homeLocation = '') {
  if (!Array.isArray(items) || !items.length) return new Map();
  const home = resolveHomeAddress(homeLocation);

  const postings = items.map((item, idx) => ({
    id: String(item.id ?? idx),
    company: cleanText(item.company, 160),
    job_title: cleanText(item.job_title, 160),
    stated_location: cleanText(item.work_address, 180),
    location_clues: locationHints(item.job_description || item.summary || '', item.work_address || '')
  }));

  try {
    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: [
        'You place job postings on a map and measure the commute to them.',
        `The candidate lives at: ${home}`,
        '',
        'For every posting below, work out where the job physically is, then calculate the driving distance in kilometres and typical driving time in minutes from the candidate\'s home to that work site.',
        '',
        'Rules:',
        '- Use the stated_location, location_clues, company name, and public information to identify the work site.',
        '- Give a street address or neighbourhood when the posting or public information supports one.',
        '- Never invent a street number. If only a city or area is known, name that area (for example "Edmonton, AB (South Edmonton)" or "Edmonton, AB (city centre)") and measure driving distance from the candidate\'s home to that area.',
        '- Every non-remote posting with a known city or area MUST receive a positive numeric distance_km and drive_minutes measured from the candidate\'s home.',
        '- If the role is strictly 100% work-from-home / remote with no physical site, return 0 for distance_km and drive_minutes.',
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

    const map = new Map();
    for (const row of result?.results || []) {
      if (!row || row.id == null) continue;
      const address = typeof row.address === 'string' ? row.address.trim() : '';
      const dist = Number(row.distance_km);
      const mins = Number(row.drive_minutes);
      map.set(String(row.id), {
        work_address: address,
        drive_distance_km: Number.isFinite(dist) && dist > 0 ? Math.round(dist * 10) / 10 : null,
        drive_minutes: Number.isFinite(mins) && mins > 0 ? Math.round(mins) : null
      });
    }
    return map;
  } catch (error) {
    return new Map();
  }
}