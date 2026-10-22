import { buildCoverLetterPdf } from '../../shared/pdf.ts';

// Draws the cover letter as a PDF — the same document the Word export and the
// emailed application package carry, drawn with pdf-lib in the shared style.
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
    const recipient = body?.recipient && typeof body.recipient === 'object' ? body.recipient : {};

    const { bytes, filename, pages } = await buildCoverLetterPdf({ profile, cover_letter: letter, recipient });

    return Response.json({ base64: toBase64(bytes), filename, pages });
  } catch (error) {
    return Response.json({ error: error.message || 'The cover letter PDF could not be built.' }, { status: 500 });
  }
}
