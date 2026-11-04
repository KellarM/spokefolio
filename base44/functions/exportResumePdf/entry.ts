import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { buildResumePdf } from '../../shared/pdf.ts';
import { resolveCompanyForDocument } from '../../shared/companyForName.ts';
import { sanitizeResumeLayout, sanitizeResumeStyleOverrides } from '../../shared/resumeTemplates.ts';

// Draws the tailored résumé on the server, in the style that application uses, and hands
// the bytes back for download. The PDF is built from the application's own résumé object,
// the same one the Word export and the emailed package use.
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

    const resume = body?.resume;
    if (!resume || typeof resume !== 'object') {
      return Response.json({ error: 'A resume is required to export.' }, { status: 400 });
    }

    const profile = body?.profile && typeof body.profile === 'object' ? body.profile : {};
    const template = typeof body?.template === 'string' ? body.template : '';
    // The manual adjustments made on the style panel: heading placement, the sections kept,
    // and whether the portrait is used.
    const layout = sanitizeResumeLayout(body?.layout);

    const overrides = sanitizeResumeStyleOverrides(body?.style_overrides);
    // The posting this résumé is aimed at, so the file carries the company in its name.
    const company = await resolveCompanyForDocument({
      company: body?.company,
      label: body?.label,
      listApplications: () => applicationsFor(req)
    });
    const { bytes, filename, pages } = await buildResumePdf({ profile, resume, template, layout, overrides, company });

    return Response.json({ base64: toBase64(bytes), filename, pages });
  } catch (error) {
    return Response.json({ error: error.message || 'The PDF could not be built.' }, { status: 500 });
  }
}