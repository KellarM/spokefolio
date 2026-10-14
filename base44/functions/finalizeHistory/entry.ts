import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { compactEntries } from '../../shared/career.ts';

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    master_summary: { type: 'string' },
    core_skills: { type: 'array', items: { type: 'string' } },
    target_titles: { type: 'array', items: { type: 'string' } },
    highlight_accomplishments: { type: 'array', items: { type: 'string' } }
  },
  required: ['master_summary', 'core_skills', 'target_titles', 'highlight_accomplishments']
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
    if (!entries.length) {
      return Response.json({ error: 'There is no career history to lock in yet.' }, { status: 400 });
    }

    const prompt = `A person has finished dictating their career history. Below is every entry they confirmed.

Build the master reference sheet a resume writer would use.

- master_summary: 4-6 factual sentences describing who this person is professionally: the arc of their career, the industries and roles, the scale they have worked at, and the strengths their history actually demonstrates. Only what the entries support.
- core_skills: 12-20 of the most marketable and transferable skills, ordered by strength. Use the person's own wording where possible, and include tools and methods they named.
- target_titles: 3-5 job titles this history best supports, most likely first.
- highlight_accomplishments: 5-8 of the single strongest accomplishments across the whole history, each one resume-ready (strong past-tense verb, concrete, numbers exactly as given).

Never invent employers, dates, titles, tools or numbers.

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