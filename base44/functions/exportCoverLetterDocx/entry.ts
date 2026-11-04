import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { buildCoverLetterDocx } from '../../shared/docx.ts';
import { resolveCompanyForDocument } from '../../shared/companyForName.ts';

// Reads the candidate's own applications so a document can still be named after the
// company when the page that asked for it did not say which company that was.
async function applicationsFor(req: any) {
  const base44 = createClientFromRequest(req);
  return await base44.entities.JobApplication.list('-updated_date', 50);
}

export default async function (req) {
  try {
    let body = {};
    try {
      body = await req.json();
    } catch (e) {
      body = {};
    }

    const letter = typeof body?.cover_letter === 'string' ? body.cover_letter.trim() : '';
    if (!letter) {
      return Response.json({ error: 'A cover letter is required to export.' }, { status: 400 });
    }

    const profile = body?.profile && typeof body.profile === 'object' ? body.profile : {};
    const recipient = body?.recipient && typeof body.recipient === 'object' ? { ...body.recipient } : {};
    // Named after the company the letter is written to, whether the page said so or not.
    recipient.company = await resolveCompanyForDocument({
      company: recipient.company,
      label: body?.label,
      jobTitle: recipient.job_title,
      listApplications: () => applicationsFor(req)
    });

    const { base64, filename } = buildCoverLetterDocx({ profile, cover_letter: letter, recipient });

    return Response.json({ base64, filename });
  } catch (error) {
    return Response.json({ error: error.message || 'The cover letter could not be built.' }, { status: 500 });
  }
}