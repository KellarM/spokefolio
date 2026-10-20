import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { cleanText } from '../../shared/career.ts';

const PATCH_SCHEMA = {
  type: 'object',
  properties: {
    outcome: { type: 'string', enum: ['ready', 'nothing_to_add'] },
    explanation: { type: 'string' },
    skills_to_add: { type: 'array', items: { type: 'string' } },
    keywords_to_add: { type: 'array', items: { type: 'string' } },
    summary: { type: 'string' },
    bullets_to_add: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          role_index: { type: 'integer' },
          role_title: { type: 'string' },
          text: { type: 'string' }
        },
        required: ['role_index', 'text']
      }
    }
  },
  required: ['outcome', 'explanation']
};

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'you', 'your', 'our', 'their', 'this', 'that', 'all', 'any', 'from',
  'into', 'per', 'plus', 'not', 'may', 'can', 'new', 'one', 'two', 'job', 'role', 'level', 'using',
  'used', 'use', 'work', 'working', 'team', 'teams', 'other', 'more', 'most', 'own'
]);

function list(value: unknown, take: number, max: number): string[] {
  return (Array.isArray(value) ? value : [])
    .slice(0, take)
    .map((item) => cleanText(item, max))
    .filter(Boolean);
}

function words(value: unknown): string[] {
  return cleanText(value, 1400)
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

// Everything the candidate's own history says, in one place to check written lines against.
function historyText(history: any[]): string {
  const parts: string[] = [];
  for (const entry of history) {
    parts.push(entry?.title, entry?.organization, entry?.summary, entry?.type, entry?.dates);
    for (const field of ['accomplishments', 'skills', 'keywords', 'metrics']) {
      for (const item of Array.isArray(entry?.[field]) ? entry[field] : []) parts.push(String(item));
    }
  }
  return ` ${parts.filter(Boolean).join(' \n ').toLowerCase()} `;
}

// Standards, systems and licences are written as capitals — HACCP, CFIA, BRC, WHMIS, KPI, JD.
// If the history never says the name, it never reaches the page, however close the work was.
function unknownNames(value: unknown, history: string): string[] {
  const found = cleanText(value, 1600).match(/\b[A-Z][A-Z0-9]{1,4}\b/g) || [];
  const unknown: string[] = [];
  for (const token of found) {
    const name = token.toLowerCase();
    if (!history.includes(name) && !unknown.includes(name)) unknown.push(name);
  }
  return unknown;
}

// A term is usable only when the history carries it: its names outright, and most of its wording.
function evidenced(term: string, history: string): boolean {
  if (unknownNames(term, history).length) return false;
  const parts = words(term).filter((word) => word.length > 2 && !STOP_WORDS.has(word));
  if (!parts.length) return false;
  const hits = parts.filter((word) => history.includes(word)).length;
  return hits * 2 >= parts.length;
}

// One change the check named, written into the résumé — additively, and only out of the
// candidate's own history. Anything the history does not carry is dropped before it is sent,
// and where nothing survives, this says so rather than dressing up a claim the candidate
// cannot defend in an interview.
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

    const applicationId = cleanText(body?.application_id, 80);
    const fix = body?.fix || {};
    const fixTitle = cleanText(fix.title, 200);
    const fixDetail = cleanText(fix.detail, 700);
    if (!applicationId || !fixTitle) {
      return Response.json({ error: 'Which change should be written in?' }, { status: 400 });
    }

    const application = await base44.entities.JobApplication.get(applicationId);
    if (!application || !application.id) {
      return Response.json({ error: 'That application is not here any more.' }, { status: 404 });
    }

    const resume = application.resume || {};
    const roles = (Array.isArray(resume.experience) ? resume.experience : []).filter(
      (role) => role && (role.title || (Array.isArray(role.bullets) && role.bullets.length))
    );
    if (!roles.length) {
      return Response.json({ error: 'Tailor the résumé first, then pull a change in.' }, { status: 400 });
    }

    const [profileRecords, entryRecords] = await Promise.all([
      base44.entities.ResumeProfile.list('-created_date', 1).catch(() => []),
      base44.entities.CareerEntry.list('-created_date', 60).catch(() => [])
    ]);
    const profile = (Array.isArray(profileRecords) ? profileRecords[0] : null) || {};

    // The history is the only material the writer may use, so it travels with the request —
    // trimmed, and shortened further if it would crowd out the posting and the résumé.
    const history = (Array.isArray(entryRecords) ? entryRecords : [])
      .filter((entry) => cleanText(entry.title, 120))
      .map((entry) => ({
        title: cleanText(entry.title, 120),
        organization: cleanText(entry.organization, 120),
        dates: [cleanText(entry.start_date, 40), cleanText(entry.end_date, 40)].filter(Boolean).join(' to '),
        type: entry.entry_type,
        summary: cleanText(entry.summary, 400),
        accomplishments: list(entry.accomplishments, 8, 300),
        skills: list(entry.skills, 25, 60),
        keywords: list(entry.keywords, 20, 60),
        metrics: list(entry.metrics, 10, 120)
      }));
    while (history.length > 6 && JSON.stringify(history).length > 18000) history.pop();
    const source = historyText(history);

    const prompt = `You are the writer working on one candidate's résumé. The candidate ran a check over it against this posting, and has asked you to make one change that the check said was worth points. Write that change into the résumé.

THE CHANGE ASKED FOR
${fixTitle}
${fixDetail || '(no further detail)'}

TARGET ROLE
Job title: ${cleanText(application.job_title, 160) || '(not given)'}
Company: ${cleanText(application.company, 160) || '(not given)'}

JOB POSTING
"""
${cleanText(application.job_description, 18000)}
"""

THE RÉSUMÉ AS IT STANDS (the experience array is in the order it prints; role_index refers to this array)
${JSON.stringify({
  headline: resume.headline,
  summary: resume.summary,
  skills: resume.skills,
  keywords: resume.keywords,
  experience: roles.map((role) => ({
    title: role.title,
    organization: role.organization,
    location: role.location,
    dates: role.dates,
    bullets: role.bullets
  })),
  education: resume.education,
  certifications: resume.certifications
}, null, 2)}

THE CANDIDATE'S CAREER HISTORY — the only material you may use
${JSON.stringify(history, null, 2)}

HOW TO WRITE IT
- This pass only adds. Never take an existing line away and never rewrite an existing bullet. The only replacement allowed is the summary, and only when the change asked for is about the summary or its length.
- Everything you add must be evidenced by the career history above. Never invent an employer, a date, a number, a tool, a certificate, a standard or a result. No evidence in the history, no line on the résumé.
- Never claim a named standard, licence, system or certificate the history does not name itself — not even when the work sounds close, and never with wording such as "equivalent to", "comparable to" or "similar to". A standard the candidate never held is the one thing that can lose them the job in the interview.
- skills_to_add: 4 to 8 short terms (1 to 4 words) drawn from the history and aimed at this posting, beyond the skills already listed.
- keywords_to_add: up to 10 terms the posting itself uses that the history genuinely covers, beyond the keywords already listed.
- summary: only when the change concerns the summary or its length. Then return a full replacement of 90 to 170 words, opening on the posting's role title and built only from history facts. Otherwise return an empty string.
- bullets_to_add: at most 2, each a complete résumé bullet of 15 to 45 words in past tense, carrying a scope and a result, with a number only where the history holds one. role_index is the 0-based position in the résumé's experience array of the job block the line belongs to, and role_title must be that block's own title.
- If the history holds nothing that answers this change, return outcome "nothing_to_add" with empty lists, and in explanation say plainly what to do instead: keep it off the résumé and prepare an answer for the interview, or record the detail in the career history first. Never pad the résumé with something weaker to have something to show.
- explanation: one or two sentences, plain and specific, telling the candidate what you added and which part of the résumé it landed in (the skills line, the keyword line, the summary, or a named job block). Never call it their profile. Write to them, not about them.

Return the result in the given schema.`;

    const patch = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: PATCH_SCHEMA
    });

    // Nothing reaches the résumé on the writer's say-so alone: each line is checked back
    // against the history, and what fails the check is dropped and named.
    const dropped: string[] = [];
    const rawSkills = list(patch?.skills_to_add, 10, 60);
    const rawKeywords = list(patch?.keywords_to_add, 12, 60);
    const skillsToAdd = rawSkills.filter((term) => evidenced(term, source)).slice(0, 8);
    const keywordsToAdd = rawKeywords.filter((term) => evidenced(term, source)).slice(0, 10);
    for (const term of [...rawSkills, ...rawKeywords]) {
      if (!evidenced(term, source)) dropped.push(...(unknownNames(term, source).length ? unknownNames(term, source) : [term]));
    }

    const rawSummary = cleanText(patch?.summary, 1600);
    const unknownInSummary = rawSummary ? unknownNames(rawSummary, source) : [];
    const summary = rawSummary && !unknownInSummary.length ? rawSummary : '';
    dropped.push(...unknownInSummary);

    const rawBullets = (Array.isArray(patch?.bullets_to_add) ? patch.bullets_to_add : [])
      .map((item: any) => ({
        role_index: Number(item?.role_index),
        role_title: cleanText(item?.role_title, 160),
        text: cleanText(item?.text, 500)
      }))
      .filter((item) => item.text)
      .slice(0, 2);
    const bulletsToAdd = rawBullets.filter((item) => {
      const unknown = unknownNames(item.text, source);
      const hedged = /equivalent to|comparable to|similar to/i.test(item.text);
      if (unknown.length) dropped.push(...unknown);
      if (hedged) dropped.push('a claim resting on equivalence rather than experience');
      return !unknown.length && !hedged;
    });

    const names = [...new Set(dropped)].slice(0, 4);
    const ready = skillsToAdd.length || keywordsToAdd.length || summary || bulletsToAdd.length;

    if (!ready) {
      return Response.json({
        patch: {
          outcome: 'nothing_to_add',
          explanation: names.length
            ? `Nothing was written in: your career history never names ${names.join(', ')}, and a résumé that claims it would not survive the interview. Keep it off this page and prepare an answer for it instead.`
            : cleanText(patch?.explanation, 600) ||
              'Nothing in your history answers this change, so nothing was written in. Keep it off the résumé and prepare an answer for the interview.'
        }
      });
    }

    const told = cleanText(patch?.explanation, 600);
    return Response.json({
      patch: {
        outcome: 'ready',
        explanation: names.length
          ? `${told} Left off, because your history does not name ${names.join(', ')}.`
          : told,
        skills_to_add: skillsToAdd,
        keywords_to_add: keywordsToAdd,
        summary,
        bullets_to_add: bulletsToAdd
      },
      candidate: { name: cleanText(profile.full_name, 120) }
    });
  } catch (error) {
    return Response.json({ error: error.message || 'That change could not be written in.' }, { status: 500 });
  }
}