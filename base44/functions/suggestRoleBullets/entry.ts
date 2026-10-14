import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { cleanList, cleanText, compactEntries } from '../../shared/career.ts';

// Extra resume lines for ONE job block, offered when the candidate presses "+".
// The lines can only come from what the candidate recorded for that job, and each one has to
// answer something the posting asks for: unrelated duties are left out entirely.

const norm = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    suggestions: { type: 'array', items: { type: 'string' } }
  },
  required: ['suggestions']
};

// The history behind this block: the entry the block was built from whenever it can be
// matched, otherwise the whole (bounded) history so the writer can still find the evidence.
function evidenceFor(role, entries) {
  const organization = norm(role.organization);
  const title = norm(role.title);
  const byOrganization = entries.filter((entry) => organization && norm(entry.organization) === organization);
  const byTitle = byOrganization.length ? [] : entries.filter((entry) => title && norm(entry.title) === title);
  const matched = byOrganization.length ? byOrganization : byTitle;
  return compactEntries(matched.length ? matched : entries, 12000);
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let body = {};
    try {
      body = await req.json();
    } catch (e) {
      body = {};
    }

    const role = {
      title: cleanText(body?.role?.title, 240),
      organization: cleanText(body?.role?.organization, 240),
      location: cleanText(body?.role?.location, 160),
      dates: cleanText(body?.role?.dates, 120)
    };
    const existing = cleanList(body?.existing, 12, 700);
    const jobDescription = cleanText(body?.job_description, 12000);
    const jobTitle = cleanText(body?.job_title, 160);
    const company = cleanText(body?.company, 160);

    if (!role.title && !role.organization) {
      return Response.json({ error: 'Give this job block a title or an employer first.' }, { status: 400 });
    }

    const records = await base44.entities.CareerEntry.list('-created_date', 200);
    const entries = (Array.isArray(records) ? records : []).filter((entry) => entry.title && entry.title.trim());
    const evidence = evidenceFor(role, entries);

    const prompt = `You are helping a candidate expand ONE job block on a resume that is already tailored to a specific job posting.

TARGET ROLE
Job title: ${jobTitle || '(not given)'}
Company: ${company || '(not given)'}

JOB POSTING
"""
${jobDescription || '(the posting was not kept)'}
"""

THE JOB BLOCK ON THE RESUME
${JSON.stringify(role, null, 2)}

LINES IT ALREADY HAS (never repeat or reword one of these)
${JSON.stringify(existing, null, 2)}

WHAT THE CANDIDATE RECORDED FOR THIS JOB (the only source of truth)
${JSON.stringify(evidence, null, 2)}

TASK
Write 4 extra bullet lines the candidate could add to this block.

HOW TO WRITE THEM
- Each line is one full sentence of 25-35 words: a strong past-tense verb, the scope or scale, how the work was done, and the real number or outcome it produced. No first-person pronouns, no bullet symbols, no dash at the start, no fragments.
- Every line must answer something the posting asks for, in the posting's own vocabulary for the tools, processes, equipment, shifts and metrics it names.
- Each line takes a different angle: a different duty, tool, result or period of the job, so a candidate adding two of them is not repeating themselves.
- RELEVANCE IS ABSOLUTE: leave out anything that does not serve this posting. Never suggest duties from an unrelated industry, unrelated tools, or work belonging to another job. If this block is security, food service or another different field, suggest only the parts of that work that answer this posting - safety and compliance, shift coverage, customer service, inventory, supervision, reporting - and never the parts that do not.
- TRUTHFULNESS IS ABSOLUTE: use only the facts, tools, numbers and outcomes in the material above. Never invent an employer, a metric, a certificate, a duty or a date. If that material cannot honestly support four lines, return fewer: two or three real lines beat four with filler.
- Prefer evidence the current lines do not already cover.
- Return bullet lines only: no headings, no numbering, no commentary.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: RESPONSE_SCHEMA
    });

    const taken = new Set(existing.map(norm));
    const suggestions = cleanList(result?.suggestions, 8, 700)
      .filter((line) => !taken.has(norm(line)))
      .slice(0, 5);

    return Response.json({ suggestions });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}