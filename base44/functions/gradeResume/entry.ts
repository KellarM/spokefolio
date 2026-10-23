import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { cleanText } from '../../shared/career.ts';
import { buildResumeRun } from '../../shared/resumeRun.ts';

const JUDGEMENT_SCHEMA = {
  type: 'object',
  properties: {
    requirements: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          requirement: { type: 'string' },
          importance: { type: 'string', enum: ['critical', 'important', 'nice'] },
          status: { type: 'string', enum: ['covered', 'partial', 'missing'] },
          evidence: { type: 'string' },
          note: { type: 'string' }
        },
        required: ['requirement', 'importance', 'status']
      }
    },
    evidence_score: { type: 'integer' },
    evidence_note: { type: 'string' },
    strengths: { type: 'array', items: { type: 'string' } },
    fixes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          detail: { type: 'string' }
        },
        required: ['title', 'detail']
      }
    },
    summary: { type: 'string' }
  },
  required: ['requirements', 'evidence_score', 'evidence_note', 'summary']
};

// One scored run of a finished résumé against the posting it was written for. The format and
// coverage measurements live in base44/shared/resumeRun.ts; the model is asked only for what
// genuinely needs judgement: which priorities the posting carries, whether the résumé answers
// them, and how concretely the writing states what was done.
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
    if (!applicationId) return Response.json({ error: 'Which application should be checked?' }, { status: 400 });

    const application = await base44.entities.JobApplication.get(applicationId);
    if (!application || !application.id) {
      return Response.json({ error: 'That application is not here any more.' }, { status: 404 });
    }

    const resume = application.resume || {};
    const roles = (Array.isArray(resume.experience) ? resume.experience : []).filter(
      (role) => role && (role.title || (Array.isArray(role.bullets) && role.bullets.length))
    );
    if (!roles.length) {
      return Response.json({ error: 'Tailor the résumé first, then run the check.' }, { status: 400 });
    }
    if (cleanText(application.job_description, 20000).length < 40) {
      return Response.json({ error: 'This application has no readable posting to check against.' }, { status: 400 });
    }

    const [profileRecords, entryRecords] = await Promise.all([
      base44.entities.ResumeProfile.list('-created_date', 1).catch(() => []),
      base44.entities.CareerEntry.list('-created_date', 200).catch(() => [])
    ]);
    const profile = (Array.isArray(profileRecords) ? profileRecords[0] : null) || {};
    // Hidden entries stay captured but never feed a resume or its checks.
    const entries = (Array.isArray(entryRecords) ? entryRecords : []).filter((entry: any) => !entry?.hidden);

    const prompt = `You are a hiring manager screening one candidate's résumé against one job posting, and you also know exactly how applicant tracking software reads a document. Grade against a balanced, realistic hiring bar: a strong, honest résumé from a real career lands in the 70s or low 80s, and 90+ is reserved for work where nearly every line carries a scope, a number and a result. Mark a résumé down only when it genuinely falls short.

TARGET ROLE
Job title: ${cleanText(application.job_title, 160) || '(not given)'}
Company: ${cleanText(application.company, 160) || '(not given)'}

JOB POSTING
"""
${cleanText(application.job_description, 20000)}
"""

THE RÉSUMÉ, exactly as the employer will receive it
${JSON.stringify({
  headline: resume.headline,
  summary: resume.summary,
  skills: resume.skills,
  keywords: resume.keywords,
  experience: resume.experience,
  education: resume.education,
  certifications: resume.certifications
}, null, 2)}

WHAT TO RETURN
- requirements: name the posting's 6-10 most important requirements, most important first — duties, tools, systems, equipment, shift patterns, certifications, safety or quality demands, and the soft skills it stresses. For each, give its importance (critical / important / nice), its status, and your reasoning:
  - covered: the résumé shows real, specific evidence for it. Name that evidence in "evidence".
  - partial: the résumé touches it, but thinly or by implication. Say what is missing in "note".
  - missing: the résumé shows nothing for it. Never credit something the résumé does not show, and never assume experience that is not on the page.
- evidence_score: 0-100 for how concretely the résumé states what the candidate did and what it produced. 85-100: nearly every bullet carries a scope, a real number and an outcome, with strong past-tense verbs and no filler. 70-84: most bullets do, a few are vague. 55-69: about half do. 40-54: mostly duties, little scope or result. Below 40: generic lines that could belong to anyone. evidence_note: one or two sentences naming what earns or holds back that mark.
- strengths: 2-4 short lines on what this résumé does well for this posting, drawn from the résumé itself.
- fixes: up to 3 content changes that would raise the mark most, each naming what to change and where (for example "the second bullet under the Warehouse Supervisor block"). Truthfulness is absolute: never suggest claiming experience, numbers or credentials the résumé does not hold. Where a requirement is genuinely unevidenced, say to leave it off and prepare an answer for the interview instead.
- summary: 2-3 sentences telling the candidate plainly how this résumé lands with this employer, and what carries it.

Judge the résumé only: not the career behind it, and not the cover letter. Return the result in the given schema.`;

    const judgement = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: JUDGEMENT_SCHEMA
    });

    const run = buildResumeRun({
      profile,
      resume,
      entries,
      job: application,
      coverLetter: application.cover_letter,
      judgement
    });

    const saved = await base44.entities.ResumeRun.create({
      application_id: application.id,
      ...run
    });

    return Response.json({
      run: { ...run, id: saved?.id, created_date: saved?.created_date }
    });
  } catch (error) {
    return Response.json({ error: error.message || 'The résumé could not be checked.' }, { status: 500 });
  }
}