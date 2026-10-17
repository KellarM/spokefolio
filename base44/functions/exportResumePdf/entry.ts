import { buildResumePdf } from '../../shared/pdf.ts';

// Draws the tailored résumé on the server, in the style that application uses, and hands
// the bytes back for download. The PDF is built from the application's own résumé object,
// the same one the Word export and the emailed package use.
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

    const { bytes, filename, pages } = await buildResumePdf({ profile, resume, template });

    return Response.json({ base64: toBase64(bytes), filename, pages });
  } catch (error) {
    return Response.json({ error: error.message || 'The PDF could not be built.' }, { status: 500 });
  }
}