import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Mock interview drill for one application. The LLM plays the hiring company's HR
// interviewer for this specific role, and works from what that interviewer could
// actually know: the job description, the candidate's tailored resume, company research,
// and the gaps those two expose. The candidate's wider recorded history is background for
// the model only, never something the room expects them to have said. It never invents
// facts about the company.
//
// Modes:
//   start  - open a session: 'practice' gets a greeting + first question, 'answers'
//            opens the workshop with a question plus two answers the candidate could
//            give, each drawn from a different experience in their history
//   answer - 'practice': grade the candidate's latest answer (what landed, what to
//            improve), then ask the next question (or signal done). 'answers': keep the
//            candidate's own answer, their third, on the question it belongs to and coach
//            them on it, including any claim the recorded history does not support
//   next   - workshop only: the next question with its pair of model answers [answers]
//   finish - close the session: practice gets a readiness summary, answers just closes
//            (there are no answers of their own to grade in the workshop)
//   redo   - reopen a question already answered, so the candidate gets a second attempt:
//            the answer and its feedback are cleared and the drill resumes there. In a
//            practice drill the questions that followed came out of that answer, so they
//            go with it; workshop questions stand alone and only the one is reopened
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

const WORKSHOP_START_SCHEMA = {
  type: 'object',
  properties: {
    greeting: { type: 'string' },
    question: { type: 'string' },
    examples: {
      type: 'array',
      items: {
        type: 'object',
        properties: { story: { type: 'string' }, answer: { type: 'string' } },
        required: ['story', 'answer']
      }
    }
  },
  required: ['greeting', 'question', 'examples']
};

const WORKSHOP_NEXT_SCHEMA = {
  type: 'object',
  properties: {
    question: { type: 'string' },
    examples: {
      type: 'array',
      items: {
        type: 'object',
        properties: { story: { type: 'string' }, answer: { type: 'string' } },
        required: ['story', 'answer']
      }
    }
  },
  required: ['question', 'examples']
};

const WORKSHOP_FEEDBACK_SCHEMA = {
  type: 'object',
  properties: {
    landed: { type: 'string' },
    improve: { type: 'string' }
  },
  required: ['landed', 'improve']
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
  let entries = 0;
  for (const role of Array.isArray(resume?.experience) ? resume.experience : []) {
    entries += 1;
    lines.push(`[Experience ${entries}] ${text(role.title, 120)} at ${text(role.organization, 120)} (${text(role.dates, 60)})`);
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
      if (turn.feedback.model_answer) {
        // Shown so the next answer to give cannot quietly become this one again.
        lines.push('(answer to give already offered - do not reuse or reword: ' + text(turn.feedback.model_answer, 600) + ')');
      }
    }
  }
  return lines.join('\n');
}

function examplesOf(value: unknown, max = 2): any[] {
  return Array.isArray(value)
    ? value
        .map((e: any) => ({ story: text(e?.story, 200), answer: text(e?.answer, 1600) }))
        .filter((e) => e.answer)
        .slice(0, max)
    : [];
}

// Whether two answers are the same answer.
//
// The workshop used to guard only against drawing a pair from the same
// experience, so the same story could come back under a new question with the
// wording barely disturbed: a real interviewer notices that instantly, and it
// makes the candidate sound rehearsed rather than experienced. These helpers
// read the words rather than the label, using three-word runs, so a lightly
// reworded answer still scores as the same answer.
const STOP_WORDS = new Set([
  'a', 'an', 'and', 'as', 'at', 'be', 'but', 'by', 'for', 'from', 'had', 'has', 'have',
  'he', 'her', 'his', 'i', 'if', 'in', 'is', 'it', 'its', 'me', 'my', 'of', 'on', 'or',
  'our', 'she', 'so', 'that', 'the', 'their', 'them', 'then', 'there', 'they', 'this',
  'to', 'was', 'we', 'were', 'what', 'when', 'which', 'who', 'will', 'with', 'would',
  'you', 'your'
]);

function contentWords(value: string): string[] {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, ' ')
    .split(/\s+/)
    .filter((word) => word && !STOP_WORDS.has(word));
}

function wordRuns(value: string): Set<string> {
  const words = contentWords(value);
  const runs = new Set<string>();
  for (let i = 0; i + 2 < words.length; i += 1) runs.add(words.slice(i, i + 3).join(' '));
  return runs;
}

// Containment rather than Jaccard, on two levels, because there are two ways to
// repeat yourself and each hides from the other. Copied-and-trimmed text keeps
// long word runs and moves almost none of its vocabulary, while a paraphrase
// keeps the vocabulary and breaks every run. Measured on real answers, a
// paraphrase of one story scored 13% on runs and 78% on words, so the larger of
// the two is what gets compared. Deliberately not averaged: an average would
// let a plain paraphrase through at around 45%.
function overlap(a: string, b: string): number {
  const leftRuns = wordRuns(a);
  const rightRuns = wordRuns(b);
  let byRun = 0;
  if (leftRuns.size && rightRuns.size) {
    let shared = 0;
    for (const run of leftRuns) if (rightRuns.has(run)) shared += 1;
    byRun = shared / Math.min(leftRuns.size, rightRuns.size);
  }

  const leftWords = new Set(contentWords(a));
  const rightWords = new Set(contentWords(b));
  let byWord = 0;
  if (leftWords.size && rightWords.size) {
    let shared = 0;
    for (const word of leftWords) if (rightWords.has(word)) shared += 1;
    byWord = shared / Math.min(leftWords.size, rightWords.size);
  }

  return Math.max(byRun, byWord);
}

// Every answer already on screen in this drill: both model answers per
// question, and the graded answer to give in a practice drill.
function priorAnswers(session: any): string[] {
  const out: string[] = [];
  for (const turn of Array.isArray(session?.turns) ? session.turns : []) {
    for (const example of Array.isArray(turn?.examples) ? turn.examples : []) {
      if (example?.answer) out.push(String(example.answer));
    }
    if (turn?.feedback?.model_answer) out.push(String(turn.feedback.model_answer));
  }
  return out;
}

// The worst clash in a fresh pair, against everything already said and against
// the other answer in the same pair. A pair with two answers from different
// experiences will share ordinary vocabulary, so the bar is high on purpose:
// this is looking for the same answer twice, not for shared words.
function reuseClash(examples: any[], priors: string[], limit: number) {
  const seen = [...priors];
  for (const example of examples) {
    const answer = text(example?.answer, 2000);
    if (!answer) continue;
    for (const earlier of seen) {
      const score = overlap(answer, earlier);
      if (score >= limit) return { score, answer, earlier };
    }
    seen.push(answer);
  }
  return null;
}

function worstOverlap(examples: any[], priors: string[]): number {
  let worst = 0;
  for (const example of examples) {
    for (const earlier of priors) worst = Math.max(worst, overlap(text(example?.answer, 2000), earlier));
  }
  const list = examples.map((example) => text(example?.answer, 2000)).filter(Boolean);
  for (let i = 0; i < list.length; i += 1) {
    for (let j = i + 1; j < list.length; j += 1) worst = Math.max(worst, overlap(list[i], list[j]));
  }
  return worst;
}

// One rewrite, then the better of the two: the drill has to hand back an answer
// either way, and a second rejection is not worth another model call.
async function uniqueExamples(prompt: string, schema: any, priors: string[]) {
  const limit = 0.55;
  const first: any = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: schema
  });
  const clash = reuseClash(examplesOf(first?.examples), priors, limit);
  if (!clash) return first;

  const second: any = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `${prompt}

CORRECTION REQUIRED. The pair you just wrote repeats an answer already given in this drill:
"""
${clash.answer}
"""
About ${Math.round(clash.score * 100)}% of it appears again, in the same order. Write the pair again. Neither answer may repeat that answer, its sentences, its opening or the same combination of evidence, and a light rewording does not count as a different answer. Draw on a different incident, or a different aspect of the same experience with different specifics, and keep every answer distinct from all the answers above.`,
    response_json_schema: schema
  });

  const firstScore = worstOverlap(examplesOf(first?.examples), priors);
  const secondScore = worstOverlap(examplesOf(second?.examples), priors);
  return secondScore <= firstScore ? second : first;
}

// What the answer workshop has already asked, and which experience each shown pair
// came from, so the next pair never repeats one.
function workshopTranscript(session: any): string {
  const lines: string[] = [];
  for (const turn of Array.isArray(session?.turns) ? session.turns : []) {
    lines.push('INTERVIEWER: ' + text(turn.question, 500));
    for (const example of Array.isArray(turn.examples) ? turn.examples : []) {
      // The answer itself, not just where it came from: the wording is what
      // must not come back.
      lines.push('  ALREADY GIVEN (do not reuse, quote or reword): ' + text(example.answer, 400));
      lines.push('    drawn from: ' + text(example.story, 200));
    }
  }
  return lines.join('\n') || '(nothing asked yet)';
}

const WORKSHOP_RULES = `Rules for each pair of answers:
- The two answers must come from two DIFFERENT experiences in the resume or the history: a different employer, role, project or period. Never the same one twice, never one already used in an earlier pair above, and never an invented one.
- Every fact inside an answer must be one the record holds for THAT ONE experience. Never move a detail from another role, project or period into it, and never merge two experiences into a single answer. If the record does not say how something was done (a system, a manual process, a team, a setting), leave that out instead of assuming it.
- The candidate will be held to these words in a real interview, so a wrong-looking sentence is worse than a thinner one. Use the record's own wording for names, systems, programs and numbers; do not rename or round anything.
- The answer must squarely answer the question asked. Read what the question assumes and check it against what is recorded: if the question describes a manual, paper-based process and their real experience ran on scanners, say so plainly and answer from the nearest genuine experience, naming where theirs differed. Never dress a recorded fact up to sound like the situation being asked about.
- Each answer is in the candidate's own voice, first person, spoken the way they would say it out loud: 3 to 5 sentences that directly answer the question, carrying the concrete detail the resume gives for that experience (a number, a system, a program, a certification).
- Both answers must be strong and usable on their own; the candidate will borrow whichever fits.
- No answer may repeat an earlier answer in this drill, or say the same thing in different words. In a real interview, answering two questions with one story twice is the clearest sign of a rehearsed script, so the words, the opening, the numbers and the sequence of events must all be different from every answer above. If the only experience left has already been used, take a different incident from it: a different task, a different outcome, different evidence. If nothing distinct is left in the record, answer from a different angle of the posting rather than telling the same story again.
- story: a short label naming the experience it came from, in the record's own terms: employer, role or project, and period, e.g. "Kuehne & Nagel - 3M Canada logistics, 1989-2008".
- examples: exactly 2.`;

// The wider record behind the tailored resume: every entry the candidate has captured,
// with its own summary, accomplishments and skills. It is background for the model alone,
// never something the interviewer in the room knows: it is here so that a real claim is
// never called unsupported, absent or invented just because the resume trimmed it away,
// and so the workshop's sample answers can use the candidate's real material.
function careerHistory(entries: any[]): string {
  const lines: string[] = [];
  let count = 0;
  for (const entry of (Array.isArray(entries) ? entries : []).slice(0, 12)) {
    const name = [text(entry?.title, 120), text(entry?.organization, 120)].filter(Boolean).join(' at ');
    if (!name) continue;
    count += 1;
    const dates = [text(entry?.start_date, 40), text(entry?.end_date, 40)].filter(Boolean).join(' to ');
    lines.push(`[History ${count}] ${name}${dates ? ' (' + dates + ')' : ''}`);
    if (entry?.summary) lines.push('  ' + text(entry.summary, 800));
    for (const line of list(entry?.accomplishments, 12, 300)) lines.push('  - ' + line);
    const skills = list(entry?.skills, 20, 60);
    if (skills.length) lines.push('  Skills: ' + skills.join(', '));
  }
  return lines.join('\n') || '(no recorded history)';
}

function contextBlock(application: any, resume: any, history: string): string {
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

CANDIDATE'S TAILORED RESUME FOR THIS JOB (trimmed to fit a page, so it leaves detail out)
${resumeOutline(resume)}

BACKGROUND NOTES ON THE CANDIDATE (private to you; the interviewer in the room has never seen this and only ever has the resume above)
${history}

WHAT THE ROOM KNOWS: the resume above, and the posting. Nobody who interviews this candidate can see anything their resume does not say, so nobody in that room can notice what was left out, and what a candidate puts on their own resume is their choice to make. So: never treat these notes as a list of what the candidate should have mentioned, never ask them to account for or explain a detail that appears only here, never fault an answer for omitting one, and never imply they were hiding it. The notes have exactly one use: before you call a claim unsupported, absent or invented, check them, and drop the objection when the record supports the claim.

KNOWN GAPS FROM THE RESUME (what the resume itself does not evidence against the posting: ask about these as open questions about the requirement, never as a challenge about something missing)
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

    // The candidate's whole recorded career, not just the trimmed resume on this
    // application: the accounts and projects it left out live here.
    const historyPage: any = await base44.entities.CareerEntry.filter(
      { created_by_id: user.id },
      { sort: '-created_date', limit: 40 }
    );
    // Hidden entries stay captured but never feed the drill.
    const visible = (Array.isArray(historyPage) ? historyPage : historyPage?.items || []).filter((entry: any) => !entry?.hidden);
    const history = careerHistory(visible);
    let sessions = trimSessions(application.mock_interviews);
    const now = new Date().toISOString();

    if (mode === 'start') {
      const existing = activeSession(sessions);
      if (existing) {
        return Response.json({ error: 'An interview drill is already in progress on this application.' }, { status: 400 });
      }

      if (text(body?.session_type, 20) === 'answers') {
        const workshop: any = await uniqueExamples(
          `${contextBlock(application, resume, history)}

You are the HR interviewer for this role at this company. You are running an answer workshop: you ask the question, then you show the candidate two answers they could give.

Rules for your character:
- Professional, warm, but probing. Ground everything in the posting above. Invent no facts about the company beyond the research notes.
- Plain, spoken language. No filler, no flattery.

${WORKSHOP_RULES}

Produce:
1. greeting: 1 or 2 sentences in character that open the workshop and say that after each question they will see two answers they could give.
2. question: the single best opening question for THIS specific role. One question only.
3. examples: exactly 2 answers, from two different experiences (see the rules above). Trace every detail in an answer back to that one experience's own lines before you write it, and drop anything you cannot.`,
          WORKSHOP_START_SCHEMA,
          []
        );

        const workshopSession = {
          id: crypto.randomUUID(),
          session_type: 'answers',
          started_at: now,
          finished_at: '',
          status: 'active',
          greeting: text(workshop?.greeting, 600),
          turns: [
            {
              question: text(workshop?.question, 500),
              examples: examplesOf(workshop?.examples),
              answer: '',
              feedback: null,
              asked_at: now,
              answered_at: ''
            }
          ],
          summary: null
        };
        sessions = trimSessions([workshopSession, ...sessions]);
        await base44.entities.JobApplication.update(applicationId, { mock_interviews: sessions });
        return Response.json({ ok: true, mock_interviews: sessions });
      }

      const result: any = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `${contextBlock(application, resume, history)}

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
        session_type: 'practice',
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
        return Response.json({ error: 'Write something first.' }, { status: 400 });
      }

      // Answer workshop: keep the candidate's own answer (their third) on the question it
      // belongs to, then coach them on it. The check that matters most here is whether the
      // answer only claims what the recorded history supports, since they may say it out loud.
      if (session.session_type === 'answers') {
        const owned = Array.isArray(session.turns) ? session.turns : [];
        const requested = Number(body?.turn_index);
        const ownedIndex =
          Number.isInteger(requested) && requested >= 0 && requested < owned.length ? requested : owned.length - 1;
        if (ownedIndex < 0 || !owned[ownedIndex]) {
          return Response.json({ error: 'There is no question to answer yet.' }, { status: 400 });
        }

        const workshopTurn = owned[ownedIndex];
        workshopTurn.answer = answer;
        workshopTurn.answered_at = now;

        const shown = (Array.isArray(workshopTurn.examples) ? workshopTurn.examples : [])
          .map((e: any, i: number) => `Answer ${i + 1} (${text(e?.story, 200)}): ${text(e?.answer, 1200)}`)
          .join('\n');

        const coached: any = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `${contextBlock(application, resume, history)}

You are the HR interviewer running an answer workshop for this role. You asked:

"""
${text(workshopTurn.question, 500)}
"""

You had already shown these two answers:
${shown || '(none shown)'}

THE CANDIDATE HAS NOW WRITTEN THEIR OWN ANSWER INSTEAD:
"""
${answer}
"""

Coach them on their own answer. Rules:
- Ground every judgment in the question asked and in the resume and posting above. No flattery.
- Stay in the interviewer's lane: the room knows this candidate only from the resume, so never fault their answer for leaving out something that appears only in the background notes, never ask them to account for it, and never hint that they were hiding it. Judge what they said the way the person across the table would, who can see nothing beyond the page in front of them.
- Say plainly whether the answer actually answers the question that was asked; if it drifts to a different subject or stays general, name that.
- Check the answer against the record, and do this first: if it claims an experience, system, method or number that neither the resume nor the recorded history supports for that experience, or carries a detail over from a different role or period, say so in "improve" and say what the record does support instead. Never call a claim unsupported until you have checked the history as well as the resume. A claim they cannot stand behind in the room outranks any polish.
- If the answer answers the question and the record supports it, "improve" must be an empty string and "landed" must say plainly that it holds up. Never manufacture a note to have something in the field. If their answer is one of the two you showed them, say so and leave "improve" empty: do not find fault with the answer you just gave them.

Produce:
1. landed: 1 or 2 sentences on what worked in their own answer.
2. improve: 1 or 2 sentences on what to fix (an unsupported claim, drift from the question, a missing concrete detail), or an empty string when their answer holds up. Empty is required when they used one of the answers you showed.`,
          response_json_schema: WORKSHOP_FEEDBACK_SCHEMA
        });

        workshopTurn.feedback = {
          landed: text(coached?.landed, 600),
          improve: text(coached?.improve, 600),
          model_answer: ''
        };

        await base44.entities.JobApplication.update(applicationId, { mock_interviews: sessions });
        return Response.json({ ok: true, mock_interviews: sessions });
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
        prompt: `${contextBlock(application, resume, history)}

You are the HR interviewer for this role. The interview is in progress. So far:

${transcriptOf(session)}

CANDIDATE JUST ANSWERED THE LAST QUESTION WITH:
"""
${answer}
"""

Grade the answer as a real interviewer would, then continue.

Rules:
- Grade against the bar of the real interview, not against a perfect answer: would a hiring manager for this role accept this answer in the room? If yes, it lands and "improve" is an empty string. Withholding credit to sound rigorous is itself a failure of the grade.
- "improve" is not a quota, and an empty one is a normal, correct outcome. Fill it only with something material that would change the outcome: a part of the question left unanswered, an unsupported claim, a metric the record holds that went unused. Never manufacture a shortcoming, a polish note or a "you could also have mentioned".
- When the candidate gives the very answer you gave them as model_answer, or words that land as well, treat it as the answer to give: "improve" empty, and "landed" says plainly that it holds up.
- Say a thing once: do not repeat a note you already made earlier in this drill, and always clear it once the answer has fixed it.
- Ground every judgment in the resume and the posting. If the answer dodges the question, misses an obvious metric from the resume, or sounds rehearsed and hollow, say so plainly in "improve". No flattery.
- Stay in the interviewer's lane: you know this candidate exactly as the person who will actually meet them does, from the resume and the posting, and they can only judge what was said out loud. Never fault an answer for leaving out something that appears only in the background notes, never ask them to account for it, and never suggest they were hiding it: what a candidate puts on their own resume is their call, and nobody in that room can miss what they never saw.
- Never invent experience the candidate does not have. If they claimed something that is in neither the resume nor the recorded history, call it out in "improve"; if the history does record it, they were right to say it, so judge the answer on how well it answered the question instead.
- Never hand back an answer to give that repeats one you already offered earlier in this drill, or says the same thing in different words: two questions answered with one story is what a rehearsed script sounds like. Where the natural example has already been used, reach for a different incident or a different aspect of it, with different evidence.
- model_answer is the answer you wish they had given: the same answer done properly. First person, in the candidate's own voice, using only experience that is in the resume or the history above. 3 to 5 spoken sentences that directly answer this question, name the specific example, and include a concrete detail from the resume (a number, a system, a program) where one exists. Fold in whatever "improve" says was missing. Invent nothing new, and keep every detail inside the one experience it came from: never move a fact to another role, and never state a system, method or setting the resume does not record for that experience. If the question assumes something the candidate's history does not have, answer from the nearest real experience and say plainly where theirs differed.
- Questions already asked: ${askedCount}. Cover the posting's requirements across the drill; do not repeat a question.
${askedCount >= MAX_TURNS ? '- The drill has reached its question limit: set next_question to null.' : ''}

Produce:
1. landed: 1 or 2 sentences, what worked in the answer.
2. improve: 1 or 2 sentences, what was weak, evasive or missing, or an empty string when the answer lands. Never fill it just to have something in it.
3. model_answer: the answer that would have landed, written as their own words (see the rules above). If their own answer already lands, this is their answer, kept as it stands.
4. next_question: your next question in character, one question only. Set it to null only when the posting's main requirements have all been probed or the question limit is reached.`,
        response_json_schema: ANSWER_SCHEMA
      });

      let modelAnswer = text(result?.model_answer, 1600);
      const alreadyGiven = turns
        .filter((turn: any) => turn !== turns[openIndex] && turn?.feedback?.model_answer)
        .map((turn: any) => String(turn.feedback.model_answer));
      const repeated = alreadyGiven
        .map((earlier: string) => ({ earlier, score: overlap(modelAnswer, earlier) }))
        .sort((a: any, b: any) => b.score - a.score)[0];
      if (repeated && repeated.score >= 0.6) {
        // The grade stands; only the words are rewritten, so this costs one
        // small call and cannot change what the candidate was told about their answer.
        const quoted = ['"""', repeated.earlier, '"""'].join('\n');
        const rewritten: any = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `${contextBlock(application, resume, history)}

You wrote this answer for a candidate to give, in reply to their interview question.

THE QUESTION: ${text(turns[openIndex].question, 500)}

YOUR ANSWER: ${modelAnswer}

It repeats an answer you already gave earlier in the same interview:
${quoted}

Rewrite YOUR ANSWER so it answers the same question at the same standard, but tells a different story or a different part of one: a different opening, different evidence, different numbers where the record has them, and nothing carried over from the answer above. Keep it first person, spoken, 3 to 5 sentences, and use only experience the resume or the history records. Invent nothing.

Return model_answer only.`,
          response_json_schema: {
            type: 'object',
            properties: { model_answer: { type: 'string' } },
            required: ['model_answer']
          }
        });
        const replacement = text(rewritten?.model_answer, 1600);
        if (replacement && overlap(replacement, repeated.earlier) < repeated.score) modelAnswer = replacement;
      }

      turns[openIndex].feedback = {
        landed: text(result?.landed, 600),
        improve: text(result?.improve, 600),
        model_answer: modelAnswer
      };

      const nextQuestion = text(result?.next_question, 500);
      if (nextQuestion && askedCount < MAX_TURNS) {
        turns.push({ question: nextQuestion, answer: '', feedback: null, asked_at: now, answered_at: '' });
      }

      await base44.entities.JobApplication.update(applicationId, { mock_interviews: sessions });
      const done = !nextQuestion || turns.every((t: any) => String(t?.answer || '').trim() !== '');
      return Response.json({ ok: true, mock_interviews: sessions, done });
    }

    if (mode === 'next') {
      const session = activeSession(sessions);
      if (!session || session.session_type !== 'answers') {
        return Response.json({ error: 'No answer workshop is in progress.' }, { status: 400 });
      }

      const workshopTurns = Array.isArray(session.turns) ? session.turns : [];
      if (workshopTurns.length >= MAX_TURNS) {
        return Response.json({ ok: true, mock_interviews: sessions, done: true });
      }

      const result: any = await uniqueExamples(
        `${contextBlock(application, resume, history)}

You are the HR interviewer running an answer workshop. What you have already asked, and what you have already offered as answers:

${workshopTranscript(session)}

Rules for your character:
- Professional, warm, but probing. Ground everything in the posting above. Invent no facts about the company beyond the research notes.
- Plain, spoken language. No filler, no flattery.

${WORKSHOP_RULES}

Produce:
1. question: your next question in character, one question only. Probe a requirement in the posting that has not been covered yet; do not repeat an earlier question. Return an empty string only when the posting's main requirements have all been covered.
2. examples: exactly 2 answers, from two different experiences (see the rules above). Trace every detail in an answer back to that one experience's own lines before you write it, and drop anything you cannot. Neither answer may repeat, quote or reword anything under ALREADY GIVEN.`,
        WORKSHOP_NEXT_SCHEMA,
        priorAnswers(session)
      );

      const nextQuestion = text(result?.question, 500);
      if (!nextQuestion) {
        return Response.json({ ok: true, mock_interviews: sessions, done: true });
      }

      workshopTurns.push({
        question: nextQuestion,
        examples: examplesOf(result?.examples),
        answer: '',
        feedback: null,
        asked_at: now,
        answered_at: ''
      });
      await base44.entities.JobApplication.update(applicationId, { mock_interviews: sessions });
      return Response.json({ ok: true, mock_interviews: sessions, done: false });
    }

    if (mode === 'finish') {
      const session = activeSession(sessions);
      if (!session) {
        return Response.json({ error: 'No interview drill is in progress to finish.' }, { status: 400 });
      }

      if (session.session_type === 'answers') {
        session.status = 'finished';
        session.finished_at = now;
        await base44.entities.JobApplication.update(applicationId, { mock_interviews: sessions });
        return Response.json({ ok: true, mock_interviews: sessions });
      }

      const result: any = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `${contextBlock(application, resume, history)}

The mock interview is over. Full transcript:

${transcriptOf(session)}

Judge them as the person who will actually interview them would, from the resume, the posting and this transcript alone: the wider background notes are not part of that room, so a detail the candidate chose not to put on their resume is neither a weakness nor anything to rehearse.

Produce a readiness report for the candidate, as a sharp coach would:
1. readiness: one honest paragraph on whether this candidate is ready to interview for this role, and the impression the transcript leaves. Judge the answers as they stand and be fair in both directions: if they answered the questions and held up under the follow-ups, say plainly, in those words, that the candidate is ready. If they were vague or dodged the questions, say that just as plainly. The verdict follows the transcript; it never averages toward caution.
2. strengths: 2 to 5 things that clearly landed, each one specific to the transcript. Credit what was actually said, including any question the candidate handled well.
3. rehearse: what to practice before the real interview, each item a real weakness from the transcript. This list may be empty: when the answers held up, an empty list is the honest answer, and items are never invented to fill it.
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

    if (mode === 'redo') {
      const session = activeSession(sessions);
      if (!session) {
        return Response.json({ error: 'No interview drill is in progress. Start one first.' }, { status: 400 });
      }

      const turns = Array.isArray(session.turns) ? session.turns : [];
      const requested = Number(body?.turn_index);
      if (!Number.isInteger(requested) || requested < 0 || requested >= turns.length) {
        return Response.json({ error: 'That question is not on this drill.' }, { status: 400 });
      }

      const turn = turns[requested];
      if (!String(turn?.answer || '').trim()) {
        return Response.json({ error: 'That question has not been answered yet.' }, { status: 400 });
      }

      turn.answer = '';
      turn.feedback = null;
      turn.answered_at = '';

      // A practice drill runs in order, so the questions that came after this answer were
      // asked because of it and go with it. Workshop questions stand alone: only this one
      // is reopened and the rest keep their answers.
      if (session.session_type !== 'answers') {
        session.turns = turns.slice(0, requested + 1);
      }

      await base44.entities.JobApplication.update(applicationId, { mock_interviews: sessions });
      return Response.json({ ok: true, mock_interviews: sessions, done: false });
    }

    return Response.json({ error: 'Unknown interview mode.' }, { status: 400 });
  } catch (error: any) {
    return Response.json({ error: error?.message || 'The interview drill could not run.' }, { status: 500 });
  }
}