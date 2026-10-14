import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const MAX_URI_LENGTH = 400;

// Turns one recorded dictation clip into text. The clip must be a file already
// uploaded to this app's private storage by the signed-in user.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Please sign in.' }, { status: 401 });

    let body = {};
    try {
      body = await req.json();
    } catch (e) {
      body = {};
    }

    const fileUri = typeof body?.file_uri === 'string' ? body.file_uri.trim() : '';
    if (!fileUri || fileUri.length > MAX_URI_LENGTH || /^https?:/i.test(fileUri)) {
      return Response.json({ error: 'A recorded audio file is required.' }, { status: 400 });
    }

    const { signed_url } = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
      file_uri: fileUri,
      expires_in: 600
    });

    const result = await base44.asServiceRole.integrations.Core.TranscribeAudio({ audio_url: signed_url });
    const text = typeof result === 'string' ? result : result?.text || '';

    return Response.json({ transcript: String(text).trim().slice(0, 20000) });
  } catch (error) {
    return Response.json({ error: error.message || 'That recording could not be transcribed.' }, { status: 500 });
  }
}