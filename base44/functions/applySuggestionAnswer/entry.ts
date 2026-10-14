import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { cleanList, cleanText } from '../../shared/career.ts';

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    accomplishments: { type: 'array', items: { type: 'string' } },
    skills: { type: 'array', items: { type: 'string' } },
    metrics: { type: 'array', items: { type: 'string' } },
    keywords: { type: 'array', items: { type: 'string' } },
    summary: { type: 'string' },
    change_note: { type: 'string' }
  },
  required: ['accomplishments', 'skills', 'metrics', 'keywords', 'summary', 'change_note']
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

    const suggestion = cleanText(body?.suggestion, 600);
    const comment = cleanText(body?.comment, 3000);
    const entry = {
      type: cleanText(body?.entry?.entry_type, 40) || 'work',
      title: cleanText(body?.entry?.title, 200),
      organization: cleanText(body?.entry?.organization, 200),
      summary: cleanText(body?.entry?.summary, 1200),
      accomplishments: cleanList(body?.entry?.accomplishments, 25, 500),
      skills: cleanList(body?.entry?.skills, 40, 120),
      metrics: cleanList(body?.entry?.metrics, 20, 240),
      keywords: cleanList(body?.entry?.keywords, 40, 80)
    };

    if (!comment) {
      return Response.json({ error: 'Add a short note about it first.' }, { status: 400 });
    }

    const prompt = `You are helping capture one person's real career history.

CURRENT ENTRY
${JSON.stringify(entry, null, 2)}

FOLLOW-UP QUESTION THAT WAS ASKED
${suggestion || '(no question recorded)'}

THE PERSON ANSWERED "YES", WITH THIS NOTE
${comment}

Merge the note into the entry:
- Add each new accomplishment as a resume bullet: strong past-tense verb, concrete, keeping every number exactly as the person wrote it. Never invent numbers, tools, employers or outcomes.
- Add newly named tools, technologies, methods or domains to skills (no duplicates).
- Add any quantified result to metrics (no duplicates).
- Add ATS-friendly keywords the new detail supports (no duplicates).
- Keep every existing accomplishment, skill, metric and keyword unless the note directly corrects it.
- Refresh summary only if the new detail changes the story: then write 1-2 factual sentences. Otherwise return the existing summary unchanged.
- change_note: one short sentence telling the person what was added, or "Nothing new to add." if the note carried no new facts.

Return the complete updated entry.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: RESPONSE_SCHEMA
    });

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message || 'That note could not be added.' }, { status: 500 });
  }
}