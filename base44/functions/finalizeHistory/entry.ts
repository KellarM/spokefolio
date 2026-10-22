import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { compactEntries } from '../../shared/career.ts';

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    master_summary: { type: 'string' },
    core_skills: { type: 'array', items: { type: 'string' } },
    target_titles: { type: 'array', items: { type: 'string' } },
    highlight_accomplishments: { type: 'array', items: { type: 'string' } },
    language: { type: 'string' },
    home_location: { type: 'string' }
  },
  required: ['master_summary', 'core_skills', 'target_titles', 'highlight_accomplishments', 'language']
};

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);

    let body = {};
    try {
      body = await req.json();
    } catch (e) {
      body = {};
    }

    const entries = compactEntries(body?.entries, 24000);
    const givenLocation = typeof body?.location === 'string' ? body.location.trim() : '';
    if (!entries.length) {
      return Response.json({ error: 'There is no career history to lock in yet.' }, { status: 400 });
    }

    const prompt = `A person has finished dictating their career history. Below is every entry they confirmed.

Build the master reference sheet a resume writer would use.

LANGUAGE: detect the majority language of the entries below and write master_summary, core_skills, target_titles and highlight_accomplishments in that same language. Only write in English when the entries themselves are in English. Keep the person's own wording for skills, employer names and titles.

- master_summary: 4-6 factual sentences describing who this person is professionally: the arc of their career, the industries and roles, the scale they have worked at, and the strengths their history actually demonstrates. Only what the entries support.
- core_skills: 12-20 of the most marketable and transferable skills, ordered by strength. Use the person's own wording where possible, and include tools and methods they named.
- target_titles: 3-5 job titles this history best supports, most likely first.
- highlight_accomplishments: 5-8 of the single strongest accomplishments across the whole history, each one resume-ready (strong past-tense verb, concrete, numbers exactly as given).
- language: the majority language you detected, named in that language itself (for example: English, Français, Italiano).
- home_location: the person's home location as an exact, unambiguous place in the form "City, Region, Country", with region and country as locally written (for example: "Edmonton, Alberta, Canada" or "Milan, Lombardy, Italy"). Start from the given home location; if none was given, use the most recent work location in the entries. Many city names exist in several countries, so the region and country must remove the ambiguity. If the entries and the given location do not establish a place, return exactly "unknown".

Never invent employers, dates, titles, tools or numbers.

HOME LOCATION GIVEN BY THE PERSON
${givenLocation || '(none given)'}

CAREER HISTORY
${JSON.stringify(entries, null, 2)}`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: RESPONSE_SCHEMA
    });

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message || 'The history could not be locked in.' }, { status: 500 });
  }
}