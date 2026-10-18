import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Mock interview drill for one application. The LLM plays the hiring company's HR
// interviewer for this specific role, grounded strictly in the job description, the
// candidate's tailored resume, company research, and known gaps. It never invents
// facts about the company.
//
// Modes:
//   start  - open a session: in-character greeting + first question
//   answer - grade the candidate's latest answer (what landed, what to improve),
//            then ask the next question (or signal done)
//   finish - close the session with a readiness summary
//
// The full transcript lives on the application record (mock_interviews, capped at the
// five most recent sessions), so a drill survives refreshes and can be reviewed later.
// The record is read through the caller's own scope: nobody else's application is reachable.

const MAX_SESSIONS = 5;
const MAX_TURNS = 12;

const START_SCHEMA = {
  type: 'object',
  properties: {
    greeting: { type: 'string' },
    first_question: { type: 'string' }
  },
  required: ['greeting', 'first_question']
};

const ANSWER_SCHEMA = {
  type: 'object',
  properties: {
    landed: { type: 'string' },
    improve: { type: 'string' },
    model_answer: { type: 'string' },
    next_question: { type: ['string', 'null'] }
  },
  required: ['landed', 'model_answer', 'next_question']
};

const SUMMARY_SCHEMA = {
  type: 'object',
  properties: {
    readiness: { type: 'string' },
    strengths: { type: 'array', items: { type: 'string' } },
    rehearse: { type: 'array', items: { type: 'string' } },
    best_proof_points: { type: 'array', items: { type: 'string' } }
  },
  required: ['readiness', 'strengths', 'rehearse', 'best_proof_points']
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

function resumeOutline(resume: any): string {
  const lines: string[] = [];
  if (resume?.summary) lines.push('Summary: ' + text(resume.summary, 1200));
  for (const role of Array.isArray(resume?.experience) ? resume.experience : []) {
    lines.push(`${text(role.title, 120)} at ${text(role.organization, 120)} (${text(role.dates, 60)})`);
    for (const bullet of Array.isArray(role.bullets) ? role.bullets.slice(0, 8) : []) {
      lines.push('  - ' + text(bullet, 400));
    }
  }
  const skills = list(resume?.skills, 30, 80);
  if (skills.length) lines.push('Skills: ' + skills.join(', '));
  const certs = list(resume?.certifications, 15, 120);
  if (certs.length) lines.push('Certifications: ' + certs.join('; '));
  for (const item of Array.isArray(resume?.education) ? resume.education : []) {
    lines.push(`Education: ${text(item.degree, 120)}, ${text(item.institution, 120)} ${text(item.dates, 40)}`);
  }
  return lines.join('\n') || '(resume not tailored yet)';
}

function transcriptOf(session: any): string {
  const lines: string[] = [];
  for (const turn of Array.isArray(session?.turns) ? session.turns : []) {
    lines.push('INTERVIEWER: ' + text(turn.question, 500));
    lines.push('CANDIDATE: ' + text(turn.answer, 2500) || '(no answer)');
    if (turn.feedback) {
      lines.push(`(feedback given: landed: ${text(turn.feedback.landed, 400)}; improve: ${text(turn.feedback.improve, 400)})`);
    }
  }
  return lines.join('\n');
}

function contextBlock(application: any, resume: any): string {
  const a = application;
  const r = a.company_research || {};
  const gaps = list(a.gaps, 10, 300);
  return `JOB
Title: ${text(a.job_title, 200)}
Company: ${text(a.company, 200)}
Posting:
"""
${text(a.job_description, 6000)}
"""

CANDIDATE'S TAILORED RESUME (the only source of truth about the candidate)
${resumeOutline(resume)}

KNOWN GAPS (already identified; probe these honestly, do not pretend they are strengths)
${gaps.map((g) => '- ' + g).join('\n') || '(none recorded)'}

COMPANY RESEARCH (the only company facts you may rely on; invent nothing else)
${text(r.overview, 1200) || '(none captured)'}
${r.what_they_do ? 'What they do: ' + text(r.what_they_do, 800) : ''}`;
}

function activeSession(sessions: any[]): any | null {
  return Array.isArray(sessions) ? sessions.find((s) => s && s.status === 'active') || null : null;
}

function trimSessions(sessions: any[]): any[] {
  const cleaned = (Array.isArray(sessions) ? sessions : []).filter(Boolean);
  // Most recent first, keep at most MAX_SESSIONS.
  return cleaned.slice(0, MAX_SESSIONS);
}

export default async function (req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user?.email) {
      return Response.json({ error: 'Sign in to run an interview drill.' }, { status: 401 });
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

    const application = await base44.entities.JobApplication.get(applicationId);
    if (!application) {
      return Response.json({ error: 'Application not found.' }, { status: 404 });
    }

    const mode = text(body?.mode, 20) || 'start';
    const resume = application.resume || {};
    let sessions = trimSessions(application.mock_interviews);
    const now = new Date().toISOString();

    if (mode === 'start') {
      const existing = activeSession(sessions);
      if (existing) {
        return Response.json({ error: 'An interview drill is already in progress on this application.' }, { status: 400 });
      }

      const result: any = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `${contextBlock(application, resume)}

You are the HR interviewer for this role at this company. You are about to open the interview.

Rules for your character:
- Professional, warm, but probing. You are evaluating, not chatting.
- Ground everything in the posting above. Invent no facts about the company beyond the research notes.
- Plain, spoken language. No filler, no flattery.

Produce:
1. greeting: 1 or 2 sentences in character that open the interview and set the scene (who you are, roughly how the interview will go).
2. first_question: the single best opening question for THIS specific role. Usually "walk me through your background and what brings you to this role" or a sharper variant suggested by the posting. One question only.`,
        response_json_schema: START_SCHEMA
      });

      const session = {
        id: crypto.randomUUID(),
        started_at: now,
        finished_at: '',
        status: 'active',
        greeting: text(result?.greeting, 600),
        turns: [
          {
            question: text(result?.first_question, 500),
            answer: '',
            feedback: null,
            asked_at: now,
            answered_at: ''
          }
        ],
        summary: null
      };
      sessions = trimSessions([session, ...sessions]);
      await base44.entities.JobApplication.update(applicationId, { mock_interviews: sessions });
      return Response.json({ ok: true, mock_interviews: sessions });
    }

    if (mode === 'answer') {
      const session = activeSession(sessions);
      if (!session) {
        return Response.json({ error: 'No interview drill is in progress. Start one first.' }, { status: 400 });
      }
      const answer = text(body?.answer, 3000);
      if (!answer) {
        return Response.json({ error: 'Say something first; the interviewer is waiting.' }, { status: 400 });
      }

      // Grade the latest unanswered turn.
      const turns = Array.isArray(session.turns) ? session.turns : [];
      const openIndex = turns.map((t: any) => String(t?.answer || '').trim()).lastIndexOf('');
      if (openIndex === -1) {
        return Response.json({ error: 'No open question on this drill.' }, { status: 400 });
      }
      turns[openIndex].answer = answer;
      turns[openIndex].answered_at = now;

      const askedCount = turns.length;

      const result: any = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `${contextBlock(application, resume)}

You are the HR interviewer for this role. The interview is in progress. So far:

${transcriptOf(session)}

CANDIDATE JUST ANSWERED THE LAST QUESTION WITH:
"""
${answer}
"""

Grade the answer as a real interviewer would, then continue.

Rules:
- Ground every judgment in the resume and the posting. If the answer dodges the question, misses an obvious metric from the resume, or sounds rehearsed and hollow, say so plainly in "improve". No flattery. If the answer is genuinely strong, "improve" is a short coaching note or empty.
- Never invent experience the candidate does not have. If they claimed something not in the resume, call it out in "improve".
- model_answer is the answer you wish they had given: the same answer done properly. First person, in the candidate's own voice, using only experience that is in the resume above. 3 to 5 spoken sentences that directly answer this question, name the specific example, and include a concrete detail from the resume (a number, a system, a program) where one exists. Fold in whatever "improve" says was missing. Invent nothing new.
- Questions already asked: ${askedCount}. Cover the posting's requirements across the drill; do not repeat a question.
${askedCount >= MAX_TURNS ? '- The drill has reached its question limit: set next_question to null.' : ''}

Produce:
1. landed: 1 or 2 sentences, what worked in the answer.
2. improve: 1 or 2 sentences, what was weak, evasive, or missing. Empty string if nothing material.
3. model_answer: the answer that would have landed, written as their own words (see the rules above).
4. next_question: your next question in character, one question only. Set it to null only when the posting's main requirements have all been probed or the question limit is reached.`,
        response_json_schema: ANSWER_SCHEMA
      });

      turns[openIndex].feedback = {
        landed: text(result?.landed, 600),
        improve: text(result?.improve, 600),
        model_answer: text(result?.model_answer, 1600)
      };

      const nextQuestion = text(result?.next_question, 500);
      if (nextQuestion && askedCount < MAX_TURNS) {
        turns.push({ question: nextQuestion, answer: '', feedback: null, asked_at: now, answered_at: '' });
      }

      await base44.entities.JobApplication.update(applicationId, { mock_interviews: sessions });
      const done = !nextQuestion || turns.every((t: any) => String(t?.answer || '').trim() !== '');
      return Response.json({ ok: true, mock_interviews: sessions, done });
    }

    if (mode === 'finish') {
      const session = activeSession(sessions);
      if (!session) {
        return Response.json({ error: 'No interview drill is in progress to finish.' }, { status: 400 });
      }

      const result: any = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `${contextBlock(application, resume)}

The mock interview is over. Full transcript:

${transcriptOf(session)}

Produce a readiness report for the candidate, as a sharp coach would:
1. readiness: one honest paragraph. Is this candidate ready to interview for this role, and what is the overall impression the transcript leaves? No flattery; if the answers were vague, say so.
2. strengths: 2 to 4 things that clearly landed, each one specific to the transcript.
3. rehearse: 2 to 4 things to practice before the real interview, each specific to what went wrong or missing in the transcript.
4. best_proof_points: 2 or 3 proof points from the resume that this candidate should make sure they say out loud in the real interview, phrased in the candidate's voice.

Plain language. No filler.`,
        response_json_schema: SUMMARY_SCHEMA
      });

      session.status = 'finished';
      session.finished_at = now;
      // Drop any unanswered question left hanging.
      session.turns = (Array.isArray(session.turns) ? session.turns : []).filter((t: any) => String(t?.answer || '').trim() !== '');
      session.summary = {
        readiness: text(result?.readiness, 1500),
        strengths: list(result?.strengths, 4, 300),
        rehearse: list(result?.rehearse, 4, 300),
        best_proof_points: list(result?.best_proof_points, 3, 300)
      };

      await base44.entities.JobApplication.update(applicationId, { mock_interviews: sessions });
      return Response.json({ ok: true, mock_interviews: sessions });
    }

    return Response.json({ error: 'Unknown interview mode.' }, { status: 400 });
  } catch (error: any) {
    return Response.json({ error: error?.message || 'The interview drill could not run.' }, { status: 500 });
  }
}