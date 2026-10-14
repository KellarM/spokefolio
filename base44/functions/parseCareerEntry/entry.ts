import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    entry_type: { type: 'string' },
    title: { type: 'string' },
    organization: { type: 'string' },
    location: { type: 'string' },
    start_date: { type: 'string' },
    end_date: { type: 'string' },
    summary: { type: 'string' },
    accomplishments: { type: 'array', items: { type: 'string' } },
    skills: { type: 'array', items: { type: 'string' } },
    metrics: { type: 'array', items: { type: 'string' } },
    keywords: { type: 'array', items: { type: 'string' } },
    suggestions: { type: 'array', items: { type: 'string' } }
  },
  required: ['entry_type', 'title', 'summary', 'accomplishments', 'skills', 'metrics', 'keywords', 'suggestions']
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

    const rawText = typeof body?.raw_text === 'string' ? body.raw_text.trim() : '';
    if (!rawText) {
      return Response.json({ error: 'There was nothing to capture yet.' }, { status: 400 });
    }
    if (rawText.length > 12000) {
      return Response.json({ error: 'That entry is long. Split it into a couple of separate entries.' }, { status: 400 });
    }

    const prompt = `You are a resume strategist helping one person capture their real career history, one dictation at a time.

Turn the dictated text below into ONE structured resume entry.

RULES
- Use only facts present in the text. Never invent employers, job titles, dates, tools, numbers or outcomes.
- entry_type must be one of: work, project, education, certification, skill, testimonial, achievement, other.
- title: the role, project, degree, certification or achievement name.
- organization: employer, client, school or organisation. Empty string if the text does not say.
- location: city/region, or "Remote" if stated. Empty string if not stated.
- start_date / end_date: keep the person's own phrasing ("Mar 2019", "2019", "present"). Empty string if not stated.
- summary: 1-2 plain, factual sentences about the scope of this role or work.
- accomplishments: one resume bullet per real accomplishment, each starting with a strong past-tense verb (Led, Built, Cut, Grew...). Keep every number exactly as given. Never add numbers. If the text lists no clear accomplishments, turn the strongest concrete details into bullets.
- metrics: only quantified results that appear in the text (for example "cut onboarding time 40%"). Empty if none.
- skills: tools, technologies, methods and domains named in the text or unmistakably implied by the work described.
- keywords: 6-12 ATS-friendly keywords for this entry.
- suggestions: 6-8 short follow-up questions, each answerable with yes/no plus a comment, that would pull out the strongest MISSING resume evidence: team size, budget or revenue owned, tools and technologies used, measurable results, scope of ownership, process improvements, stakeholders, awards or recognition, scale of the operation. Each question must be specific to this entry (name the employer, role or project where it helps). No generic filler, no duplicates.

DICTATED TEXT
"""
${rawText}
"""`;

    const parsed = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: RESPONSE_SCHEMA
    });

    return Response.json(parsed);
  } catch (error) {
    return Response.json({ error: error.message || 'That entry could not be captured.' }, { status: 500 });
  }
}