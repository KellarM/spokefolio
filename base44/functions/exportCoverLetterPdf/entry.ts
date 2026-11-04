import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { buildCoverLetterPdf } from '../../shared/pdf.ts';
import { resolveCompanyForDocument } from '../../shared/companyForName.ts';

// Draws the cover letter as a PDF — the same document the Word export and the
// emailed application package carry, drawn with pdf-lib in the shared style.
// Reads the candidate's own applications so a document can still be named after the
// company when the page that asked for it did not say which company that was.
async function applicationsFor(req: any) {
  const base44 = createClientFromRequest(req);
  return await base44.entities.JobApplication.list('-updated_date', 50);
}

function toBase64(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
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
      // The page sends the company on the recipient and, since this fix, beside it too.
      company: recipient.company || body?.company,
      label: body?.label,
      jobTitle: recipient.job_title || body?.job_title,
      listApplications: () => applicationsFor(req)
    });

    const { bytes, filename, pages } = await buildCoverLetterPdf({ profile, cover_letter: letter, recipient });

    return Response.json({ base64: toBase64(bytes), filename, pages });
  } catch (error) {
    return Response.json({ error: error.message || 'The cover letter PDF could not be built.' }, { status: 500 });
  }
}