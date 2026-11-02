// One definition of the employer briefing.
//
// The single-application lookup and the bulk refresh both have to ask for the
// same things, in the same words, or the two produce briefings that cannot be
// compared and a client ends up with two shapes of the same panel depending on
// which button they pressed. The prompt and the response shape live here.

const list = { type: 'array', items: { type: 'string' } };

export const COMPANY_SCHEMA = {
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
    drug_screening: { type: 'string' },
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
};

export function buildCompanyPrompt(application) {
  const company = (application?.company || '').trim();
  const clues = (application?.job_description || '').slice(0, 700);

  return [
    'You prepare a background briefing on an employer for a job applicant, using public information from the web.',
    '',
    `Company: ${company}`,
    `Role applied for: ${application?.job_title || 'not named'}`,
    application?.work_address ? `Work site noted on the posting: ${application.work_address}` : '',
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
    '- Drug screening, marijuana included: does this employer drug test - pre-employment, random, or after incidents - '
      + 'and for which kinds of roles (safety-sensitive, drivers, warehouse floor)? Base the answer on their published '
      + 'policies, job postings that mention testing, employee accounts, or news reporting. Warehouse, driving and '
      + 'heavy-equipment roles are often treated as safety-sensitive even where office roles are not tested. '
      + 'If nothing public says either way, write that plainly - never guess. Also note the legal context when it '
      + 'matters: in Canada, pre-employment testing is generally limited to safety-sensitive positions and random '
      + 'testing has been struck down; in the US, testing is common and often required for these roles.',
    '',
    'Hard rules:',
    '- Use only what you actually find. Never invent a founding year, an executive name, a rating or a statistic.',
    '- Where information is thin, absent or contradictory, write that plainly instead of filling the gap. Put every unknown, conflict and thin area in "cautions".',
    '- Employee review summaries are unverified opinion, not fact: present them as themes and note when the sample is small or old.',
    '- Prefer recent, first-party and reputable sources. Set "confidence" to high, medium or low for how well you could identify and verify this company.',
    '- "sources" holds the pages you actually used: a short label plus its full URL. Never list a search engine.',
    '- Do not comment on the applicant, their résumé, or their chances of being hired.'
  ].filter(Boolean).join('\n');
}

// A briefing is out of date when it predates the current field set, which is
// how the website and drug-screening sections reached only new applications.
export const COMPANY_BRIEF_FIELDS = Object.keys(COMPANY_SCHEMA.properties);

export function briefIsStale(research) {
  if (!research || !research.overview) return true;
  return COMPANY_BRIEF_FIELDS.some((field) => !(field in research));
}
