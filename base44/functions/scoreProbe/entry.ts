import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Temporary: scores one already-finished drill so its result can be shown.
export default async function (req: Request) {
  const base44 = createClientFromRequest(req);
  const body: any = await req.json().catch(() => ({}));
  const application = await base44.asServiceRole.entities.JobApplication.get(body.application_id);
  const all = application?.mock_interviews || [];
  const session =
    all.find((s: any) => s.id === body.session_id) ||
    all.find((s: any) => s.status === 'finished' && s.session_type === 'practice' && s.summary);
  if (!session) return Response.json({ error: 'session not found' }, { status: 404 });

  const transcript = (session.turns || [])
    .map((t: any) => `INTERVIEWER: ${String(t.question || '').slice(0, 500)}\nCANDIDATE: ${String(t.answer || '(no answer)').slice(0, 2500)}`)
    .join('\n\n');

  const scored: any = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `You are the hiring manager who just interviewed this candidate for this job.

JOB
Title: ${application.job_title || ''}
Company: ${application.company || ''}
Posting:
"""
${String(application.job_description || '').slice(0, 6000)}
"""

RESUME THE ROOM SAW
${JSON.stringify(session.summary?.best_proof_points || [])}

Transcript of the interview:
${transcript}

Give two answers only:
1. interview_score: a whole number from 0 to 100 for how this candidate performed in this interview. 85 to 100 would carry an offer, 65 to 84 is solid with something left to prove, 45 to 64 is competent but unconvincing, below 45 would not survive the room. Judge only what was said.
2. verdict: "yes" if they would get the job on this interview, "next_round" if they are worth another conversation but not decided, "no" if they would be turned down.`,
    response_json_schema: {
      type: 'object',
      properties: { interview_score: { type: 'integer' }, verdict: { type: 'string' } },
      required: ['interview_score', 'verdict']
    }
  });

  return Response.json({ scored });
}