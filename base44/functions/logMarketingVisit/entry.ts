import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Public beacon for the marketing website (xfhgamestudioltd.info).
// Anonymous by design: no account, no IP, no fingerprint - only enough
// to know that someone visited, which page they landed on, and where
// they came from. The admin dashboard counts unique visitor-days from
// these records. The beacon is sent as text/plain so it stays a simple
// CORS request with no preflight; the body is parsed as JSON regardless.
export default async function (req) {
  try {
    const body = await req.json().catch(() => ({}));
    const clean = (value, n) => String(value || '').slice(0, n).trim();

    const visitor = clean(body.visitor, 40);
    if (!visitor) {
      return Response.json({ ok: false, error: 'missing visitor' }, { status: 400 });
    }

    const page = clean(body.page, 60) || '/';
    const referrer = clean(body.referrer, 60);
    const lang = clean(body.lang, 8);

    const base44 = createClientFromRequest(req);
    await base44.asServiceRole.entities.AppEvent.create({
      event_type: 'site_visit',
      // Visitor id leads the JSON so the 200-char cap can never cut it
      // off; the dashboard reads it back with a regex fallback.
      metadata: JSON.stringify({ visitor, page, referrer, lang }).slice(0, 200)
    });

    return Response.json({ ok: true });
  } catch {
    // A beacon must never receive a page worth of error output.
    return Response.json({ ok: false }, { status: 500 });
  }
}
