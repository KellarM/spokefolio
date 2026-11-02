import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { buildCompanyPrompt, COMPANY_SCHEMA, briefIsStale } from '../../shared/company.ts';

// Brings the employer briefings already on file up to the current field set.
//
// Briefings are written once and then cached with the application, so a field
// added later - the website, the drug-screening read - exists only on
// applications researched after the change. This walks the signed-in user's
// applications, finds the ones whose briefing predates the current shape, and
// re-runs them through the same prompt the single lookup uses.
//
// It is deliberately batched: each briefing is a web-grounded model call, so a
// user with twenty applications would blow through any request timeout. The
// caller asks for a small batch and repeats while "remaining" is above zero.
const DEFAULT_LIMIT = 2;
const MAX_LIMIT = 5;

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json().catch(() => ({}));
    const asked = Number(payload?.limit);
    const limit = Math.min(Math.max(Number.isFinite(asked) && asked > 0 ? Math.floor(asked) : DEFAULT_LIMIT, 1), MAX_LIMIT);

    const applications = await base44.entities.JobApplication.list('-created_date', 200);
    const stale = (applications || []).filter(
      (application) => (application.company || '').trim() && briefIsStale(application.company_research)
    );

    const batch = stale.slice(0, limit);
    const updated = [];
    const failed = [];

    for (const application of batch) {
      try {
        const research = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: buildCompanyPrompt(application),
          add_context_from_internet: true,
          response_json_schema: COMPANY_SCHEMA
        });
        if (!research || !research.overview) throw new Error('No company information came back.');
        const researchedAt = new Date().toISOString();
        await base44.entities.JobApplication.update(application.id, {
          company_research: research,
          company_researched_at: researchedAt
        });
        updated.push({ id: application.id, company: application.company, researched_at: researchedAt });
      } catch (error) {
        failed.push({ id: application.id, company: application.company, error: error?.message || 'Failed' });
      }
    }

    return Response.json({
      updated,
      failed,
      remaining: Math.max(stale.length - updated.length - failed.length, 0),
      stale_total: stale.length
    });
  } catch (error) {
    return Response.json({ error: error.message || 'Could not refresh the company breakdowns.' }, { status: 500 });
  }
}
