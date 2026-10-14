import { buildCoverLetterDocx } from '../../shared/docx.ts';

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

    const { base64, filename } = buildCoverLetterDocx({ profile, cover_letter: letter, recipient });

    return Response.json({ base64, filename });
  } catch (error) {
    return Response.json({ error: error.message || 'The cover letter could not be built.' }, { status: 500 });
  }
}