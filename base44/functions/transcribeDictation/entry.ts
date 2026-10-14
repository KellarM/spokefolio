import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';

const MAX_URI_LENGTH = 400;
const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

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

    const appId = secrets.get('BASE44_APP_ID');
    const fileUri = typeof body?.file_uri === 'string' ? body.file_uri.trim() : '';
    const audioUrl = typeof body?.audio_url === 'string' ? body.audio_url : '';
    if (!fileUri.startsWith(`mp/private/${appId}/`) || fileUri.length > MAX_URI_LENGTH || !/\.(wav|mp3|m4a|webm|ogg)$/i.test(fileUri)) {
      return Response.json({ error: 'A private recording from this app is required.' }, { status: 400 });
    }
    let url;
    try { url = new URL(audioUrl); } catch {
      return Response.json({ error: 'Your recording could not be opened. Please retry.' }, { status: 400 });
    }
    const storagePath = fileUri.slice(3);
    if (audioUrl.length > 2500 || url.origin !== 'https://media.base44.com' || url.username || url.password || url.hash ||
        !['files', 'videos', 'images'].some(kind => url.pathname === `/${kind}/${storagePath}`) || !url.searchParams.get('token')) {
      return Response.json({ error: 'A signed link to your private recording is required.' }, { status: 400 });
    }
    const audio = await fetch(audioUrl, { method: 'HEAD', redirect: 'manual', signal: AbortSignal.timeout(15000) });
    if (!audio.ok) return Response.json({ error: 'Your recording link expired or could not be opened. Please retry.' }, { status: 400 });
    const size = Number(audio.headers.get('content-length'));
    if (!size || size > MAX_AUDIO_BYTES) return Response.json({ error: 'Please record a clip of no more than five minutes.' }, { status: 400 });

    const result = await base44.asServiceRole.integrations.Core.TranscribeAudio({ audio_url: audioUrl });
    const text = typeof result === 'string' ? result : result?.text || '';

    return Response.json({ transcript: String(text).trim().slice(0, 20000) });
  } catch (error) {
    if (error.status === 401 || error.response?.status === 401) {
      return Response.json({ error: 'Please sign in again before dictating.' }, { status: 401 });
    }
    console.error('Dictation transcription failed', {
      status: error.status || error.response?.status || 500,
      name: error.name,
      message: String(error.message || '').replace(/https?:\/\/[^\s'"<>]+/g, '[recording link]')
    });
    return Response.json({ error: 'That recording could not be transcribed. Please retry writing.' }, { status: 500 });
  }
}