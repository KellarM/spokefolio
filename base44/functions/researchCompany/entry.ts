import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { buildCompanyPrompt, COMPANY_SCHEMA } from '../../shared/company.ts';

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

    const research = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: buildCompanyPrompt({ company, job_title: application.job_title, work_address: application.work_address, job_description: application.job_description }),
      add_context_from_internet: true,
      response_json_schema: COMPANY_SCHEMA
    });

    if (!research || !research.overview) throw new Error('No company information came back. Try again in a moment.');

    const researchedAt = new Date().toISOString();
    await base44.entities.JobApplication.update(id, { company_research: research, company_researched_at: researchedAt });
    return Response.json({ research, researched_at: researchedAt, cached: false });
  } catch (error) {
    return Response.json({ error: error.message || 'Could not research this company.' }, { status: 500 });
  }
}