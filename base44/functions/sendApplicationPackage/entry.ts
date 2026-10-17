import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { buildResumePdf, buildCoverLetterPdf } from '../../shared/pdf.ts';

// Emails the account holder their finished application package for one job:
// the tailored résumé and cover letter as PDFs (private, time-limited download links,
// since the mailer carries plain text only), the job's details, and a set of interview
// talking points built from the résumé against the posting.
//
// The recipient is always the signed-in user's own account email. Nothing here can be
// pointed at anyone else.

const LINK_DAYS = 7;
const LINK_SECONDS = LINK_DAYS * 24 * 60 * 60;

const PREP_SCHEMA = {
  type: 'object',
  properties: {
    proof_points: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          requirement: { type: 'string' },
          evidence: { type: 'string' }
        }
      }
    },
    gap_responses: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          gap: { type: 'string' },
          response: { type: 'string' }
        }
      }
    },
    likely_questions: { type: 'array', items: { type: 'string' } },
    questions_to_ask: { type: 'array', items: { type: 'string' } }
  }
};

function text(value: unknown, max = 2000): string {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function list(value: unknown, max = 10, each = 400): string[] {
  return Array.isArray(value) ? value.map((v) => text(v, each)).filter(Boolean).slice(0, max) : [];
}

function pairs(value: unknown, a: string, b: string, max = 8) {
  return Array.isArray(value)
    ? value
        .map((item) => ({ [a]: text(item?.[a], 300), [b]: text(item?.[b], 600) }))
        .filter((item) => item[a] && item[b])
        .slice(0, max)
    : [];
}

function resumeOutline(resume: any): string {
  const lines: string[] = [];
  if (resume?.summary) lines.push('Summary: ' + text(resume.summary, 1200));
  for (const role of Array.isArray(resume?.experience) ? resume.experience : []) {
    lines.push(`${text(role.title, 120)} at ${text(role.organization, 120)} (${text(role.dates, 60)})`);
    for (const bullet of Array.isArray(role.bullets) ? role.bullets.slice(0, 8) : []) lines.push('  - ' + text(bullet, 400));
  }
  const skills = list(resume?.skills, 30, 80);
  if (skills.length) lines.push('Skills: ' + skills.join(', '));
  const certs = list(resume?.certifications, 15, 120);
  if (certs.length) lines.push('Certifications: ' + certs.join('; '));
  const education = Array.isArray(resume?.education) ? resume.education : [];
  for (const item of education) lines.push(`Education: ${text(item.degree, 120)}, ${text(item.institution, 120)} ${text(item.dates, 40)}`);
  return lines.join('\n');
}

async function buildInterviewPrep(base44: any, application: any, resume: any) {
  const prompt = `You are preparing a candidate for a job interview. Work only from the material below. Do not invent experience the candidate does not have.

JOB
Title: ${text(application.job_title, 200)}
Company: ${text(application.company, 200)}
Description:
${text(application.job_description, 6000) || '(no description captured)'}

CANDIDATE'S TAILORED RESUME
${resumeOutline(resume)}

KNOWN GAPS (already identified, be honest about them)
${list(application.gaps, 10, 300).map((g) => '- ' + g).join('\n') || '(none recorded)'}

${application.company_research?.overview ? 'COMPANY NOTES\n' + text(application.company_research.overview, 1500) : ''}

Produce:
1. proof_points: 4 to 6 items. Each pairs one requirement the posting states with the single strongest piece of evidence from the resume, quoting the metric where one exists. Phrase the evidence as something the candidate can say out loud in 1 or 2 sentences.
2. gap_responses: one item per known gap (skip if none). A short, honest way to address it that neither hides it nor apologizes for it, pointing to the closest real experience.
3. likely_questions: 4 to 6 questions this interviewer is likely to ask for this specific role.
4. questions_to_ask: 3 sharp questions the candidate should ask the employer, specific to this role and company, that show commercial understanding of the job.

Plain language. No filler.`;

  const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: PREP_SCHEMA
  });

  return {
    proof_points: pairs(result?.proof_points, 'requirement', 'evidence', 6),
    gap_responses: pairs(result?.gap_responses, 'gap', 'response', 8),
    likely_questions: list(result?.likely_questions, 6, 300),
    questions_to_ask: list(result?.questions_to_ask, 4, 300),
    generated_at: new Date().toISOString()
  };
}

async function uploadPrivatePdf(base44: any, bytes: Uint8Array, filename: string) {
  const file = new File([new Uint8Array(bytes) as unknown as BlobPart], filename, { type: 'application/pdf' });
  const { file_uri } = await base44.asServiceRole.integrations.Core.UploadPrivateFile({ file });
  const { signed_url } = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
    file_uri,
    expires_in: LINK_SECONDS
  });
  return { file_uri, signed_url };
}

function composeEmail(opts: {
  user: any;
  application: any;
  resumeLink: string | null;
  letterLink: string | null;
  prep: any;
  note: string;
}) {
  const { user, application: a, resumeLink, letterLink, prep, note } = opts;
  const firstName = text(user.full_name, 80).split(' ')[0] || 'there';
  const L: string[] = [];

  L.push(`Hi ${firstName},`);
  L.push('');
  L.push(`Here is your application package for ${text(a.job_title, 200)} at ${text(a.company, 200)}.`);
  if (note) {
    L.push('');
    L.push('Your note: ' + note);
  }

  L.push('');
  L.push('YOUR DOCUMENTS');
  L.push(`Links stay live for ${LINK_DAYS} days. Download and keep your copies.`);
  if (resumeLink) L.push('Resume (PDF): ' + resumeLink);
  if (letterLink) L.push('Cover letter (PDF): ' + letterLink);
  if (!resumeLink && !letterLink) L.push('(No documents were included.)');

  L.push('');
  L.push('THE JOB');
  L.push('Title: ' + text(a.job_title, 200));
  L.push('Company: ' + text(a.company, 200));
  if (a.work_address) L.push('Location: ' + text(a.work_address, 300));
  if (a.drive_distance_km || a.drive_minutes) {
    const bits = [];
    if (a.drive_distance_km) bits.push(`${Math.round(a.drive_distance_km)} km`);
    if (a.drive_minutes) bits.push(`about ${Math.round(a.drive_minutes)} min drive`);
    L.push('Commute: ' + bits.join(', '));
  }
  if (a.source_url) L.push('Posting: ' + text(a.source_url, 500));
  if (a.status) L.push('Status in Spokefolio: ' + text(a.status, 40).replace(/_/g, ' '));

  if (a.match_summary) {
    L.push('');
    L.push('HOW YOU MATCH');
    L.push(text(a.match_summary, 2000));
  }

  const gaps = list(a.gaps, 10, 300);
  if (gaps.length) {
    L.push('');
    L.push('KNOWN GAPS');
    for (const g of gaps) L.push('- ' + g);
  }

  const r = a.company_research;
  if (r && (r.overview || r.what_they_do)) {
    L.push('');
    L.push('ABOUT THE COMPANY');
    if (r.overview) L.push(text(r.overview, 1200));
    if (r.what_they_do) L.push('What they do: ' + text(r.what_they_do, 800));
    if (r.size) L.push('Size: ' + text(r.size, 200));
    if (r.headquarters) L.push('Headquarters: ' + text(r.headquarters, 200));
    if (r.labour_reputation) L.push('Workplace reputation: ' + text(r.labour_reputation, 800));
  }

  if (prep) {
    L.push('');
    L.push('INTERVIEW PREP');
    if (prep.proof_points?.length) {
      L.push('');
      L.push('Your proof points (what they want, and your evidence):');
      prep.proof_points.forEach((p: any, i: number) => {
        L.push(`${i + 1}. ${p.requirement}`);
        L.push(`   Say: ${p.evidence}`);
      });
    }
    if (prep.gap_responses?.length) {
      L.push('');
      L.push('If they raise a gap:');
      for (const g of prep.gap_responses) {
        L.push(`- ${g.gap}`);
        L.push(`  ${g.response}`);
      }
    }
    if (prep.likely_questions?.length) {
      L.push('');
      L.push('Questions to expect:');
      for (const q of prep.likely_questions) L.push('- ' + q);
    }
    if (prep.questions_to_ask?.length) {
      L.push('');
      L.push('Questions worth asking them:');
      for (const q of prep.questions_to_ask) L.push('- ' + q);
    }
  }

  L.push('');
  L.push('Good luck.');
  L.push('Spokefolio');

  return L.join('\n');
}

export default async function (req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user?.email) {
      return Response.json({ error: 'Sign in to send your package.' }, { status: 401 });
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch (_e) {
      body = {};
    }

    const applicationId = text(body?.application_id, 64);
    if (!applicationId) {
      return Response.json({ error: 'An application is required.' }, { status: 400 });
    }

    // Read through the user's own scope so another account's record is never reachable.
    const application = await base44.entities.JobApplication.get(applicationId);
    if (!application) {
      return Response.json({ error: 'Application not found.' }, { status: 404 });
    }

    const includeResume = body?.include_resume !== false;
    const includeLetter = body?.include_letter !== false;
    const includePrep = body?.include_prep !== false;
    const note = text(body?.note, 1000);

    const resume = body?.resume && typeof body.resume === 'object' ? body.resume : application.resume || {};
    const coverLetter = typeof body?.cover_letter === 'string' ? body.cover_letter : application.cover_letter || '';
    const template = text(body?.template, 60) || application.resume_template || '';

    const profiles = await base44.entities.ResumeProfile.list('-updated_date', 1).catch(() => []);
    const profile = profiles?.[0] || { full_name: user.full_name, email: user.email };

    const included: string[] = [];
    let resumeLink: string | null = null;
    let letterLink: string | null = null;

    if (includeResume) {
      const hasContent = resume?.summary || (Array.isArray(resume?.experience) && resume.experience.length);
      if (!hasContent) {
        return Response.json({ error: 'Build the résumé before sending it.' }, { status: 400 });
      }
      const pdf = await buildResumePdf({ profile, resume, template });
      resumeLink = (await uploadPrivatePdf(base44, pdf.bytes, pdf.filename)).signed_url;
      included.push('resume');
    }

    if (includeLetter) {
      if (!coverLetter.trim()) {
        if (!includeResume) {
          return Response.json({ error: 'There is no cover letter to send yet.' }, { status: 400 });
        }
        // A missing letter is skipped quietly when the résumé is going anyway.
      } else {
        const pdf = await buildCoverLetterPdf({
          profile,
          cover_letter: coverLetter,
          recipient: { company: application.company, job_title: application.job_title }
        });
        letterLink = (await uploadPrivatePdf(base44, pdf.bytes, pdf.filename)).signed_url;
        included.push('cover_letter');
      }
    }

    // Interview prep is generated once per application and kept on the record, so repeat
    // sends reuse it rather than paying for a new generation. A rewrite of the résumé
    // clears it from the client side.
    let prep = application.interview_prep || null;
    if (includePrep) {
      if (!prep || !prep.proof_points?.length || body?.refresh_prep === true) {
        prep = await buildInterviewPrep(base44, application, resume);
      }
      included.push('interview_prep');
    } else {
      prep = null;
    }

    const emailBody = composeEmail({ user, application, resumeLink, letterLink, prep, note });
    const subject = `Application package: ${text(application.job_title, 120)} at ${text(application.company, 120)}`;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: user.email,
      subject,
      body: emailBody,
      from_name: 'Spokefolio'
    });

    const sentAt = new Date().toISOString();
    const patch: any = { last_sent_to: user.email, last_sent_at: sentAt };
    if (includePrep && prep) patch.interview_prep = prep;
    await base44.entities.JobApplication.update(applicationId, patch).catch(() => {});

    return Response.json({
      ok: true,
      sent_to: user.email,
      sent_at: sentAt,
      included,
      link_days: LINK_DAYS
    });
  } catch (error: any) {
    return Response.json({ error: error?.message || 'The package could not be sent.' }, { status: 500 });
  }
}
