import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const list = { type: 'array', items: { type: 'string' } };

// A background briefing on the employer behind one application: how long they have existed,
// what they do, who runs them, and what public labour and employee sources say about them.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json().catch(() => ({}));
    const id = typeof payload.application_id === 'string' ? payload.application_id : '';
    if (!id) return Response.json({ error: 'An application is required.' }, { status: 400 });

    const application = await base44.entities.JobApplication.get(id);
    if (payload.force !== true && application.company_research && application.company_research.overview) {
      return Response.json({ research: application.company_research, researched_at: application.company_researched_at, cached: true });
    }

    const company = (application.company || '').trim();
    if (!company) return Response.json({ error: 'This application has no company name to look up.' }, { status: 400 });

    const clues = (application.job_description || '').slice(0, 700);

    const research = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: [
        'You prepare a background briefing on an employer for a job applicant, using public information from the web.',
        '',
        `Company: ${company}`,
        `Role applied for: ${application.job_title || 'not named'}`,
        application.work_address ? `Work site noted on the posting: ${application.work_address}` : '',
        clues ? `Excerpt of the posting, for confirming which company this is:\n${clues}` : '',
        '',
        'Find the right company. Watch for common names: use the posting excerpt, the location and the industry to confirm you have the right organisation. If you cannot confirm it, say so in "confidence" and keep everything you return to what the posting and clearly matching sources support.',
        '',
        'Cover, in the applicant\'s plain language:',
        '- How long the company has existed: founding year or earliest reliable date, plus the resulting years in business today. If unsure, give a range and say it is approximate.',
        '- What the company actually does: the work, the industries it serves, and its main services or products.',
        '- The official website: the address of the organisation\'s own public website. Only include it once you have '
        + 'confirmed it belongs to this exact organisation and location, not a same-named one. Never list a job board, '
        + 'social network, directory or review site. If you cannot confirm the official site, leave "website" empty.',
        '- Size and structure: employee count or range, unionised or not if known, headquarters, whether it is public, private, a subsidiary, or government, and any parent company.',
        '- Management: named owners, executives, directors or managers with their roles, plus anything notable about leadership or ownership changes.',
        '- Labour and employee reputation: what employee review sites, unions, labour boards, safety regulators, news reporting and court or labour-board records say. Summarise the recurring themes (pay, scheduling, safety, turnover, management, culture) rather than quoting reviews. Note layoffs, strikes, lockouts, labour board complaints or safety orders when they exist.',
        '- Recent news of the last two years that a candidate would want to know: expansions, closures, contract wins, restructuring, lawsuits, safety incidents.',
        '- What this means when applying: how they hire, what they seem to value, who to address a letter to if that is knowable.',
        '',
        'Hard rules:',
        '- Use only what you actually find. Never invent a founding year, an executive name, a rating or a statistic.',
        '- Where information is thin, absent or contradictory, write that plainly instead of filling the gap. Put every unknown, conflict and thin area in "cautions".',
        '- Employee review summaries are unverified opinion, not fact: present them as themes and note when the sample is small or old.',
        '- Prefer recent, first-party and reputable sources. Set "confidence" to high, medium or low for how well you could identify and verify this company.',
        '- "sources" holds the pages you actually used: a short label plus its full URL. Never list a search engine.',
        '- Do not comment on the applicant, their résumé, or their chances of being hired.'
      ].filter(Boolean).join('\n'),
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          overview: { type: 'string' },
          website: { type: 'string' },
          founded: { type: 'string' },
          years_active: { type: 'string' },
          headquarters: { type: 'string' },
          size: { type: 'string' },
          ownership: { type: 'string' },
          what_they_do: { type: 'string' },
          services: list,
          management: {
            type: 'array',
            items: {
              type: 'object',
              properties: { name: { type: 'string' }, role: { type: 'string' }, note: { type: 'string' } },
              required: ['name', 'role']
            }
          },
          labour_reputation: { type: 'string' },
          employee_themes: list,
          labour_notes: list,
          recent_news: list,
          hiring_notes: { type: 'string' },
          cautions: list,
          confidence: { type: 'string' },
          sources: {
            type: 'array',
            items: {
              type: 'object',
              properties: { label: { type: 'string' }, url: { type: 'string' } },
              required: ['label', 'url']
            }
          }
        },
        required: ['overview', 'what_they_do', 'confidence']
      }
    });

    if (!research || !research.overview) throw new Error('No company information came back. Try again in a moment.');

    const researchedAt = new Date().toISOString();
    await base44.entities.JobApplication.update(id, { company_research: research, company_researched_at: researchedAt });
    return Response.json({ research, researched_at: researchedAt, cached: false });
  } catch (error) {
    return Response.json({ error: error.message || 'Could not research this company.' }, { status: 500 });
  }
}