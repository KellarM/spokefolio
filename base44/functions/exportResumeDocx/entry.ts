import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { buildResumeDocx } from '../../shared/docx.ts';
import { resolveDocxConfig, sanitizeResumeLayout, sanitizeResumeStyleOverrides } from '../../shared/resumeTemplates.ts';
import { loadPhoto } from '../../shared/photo.ts';

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
    const label = typeof body?.label === 'string' ? body.label : '';
    const template = typeof body?.template === 'string' ? body.template : '';
    // The manual adjustments made on the style panel: heading placement, the sections kept,
    // and whether the portrait is used.
    const layout = sanitizeResumeLayout(body?.layout);

    // A style that sets a portrait needs the real image, signed and read here so the
    // document can carry it. A portrait that cannot be read just leaves the résumé plain.
    const config = resolveDocxConfig(template, layout);
    let photo = null;
    if (config.photo && typeof profile.photo_uri === 'string' && profile.photo_uri) {
      try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (user) {
          const { signed_url } = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
            file_uri: profile.photo_uri,
            expires_in: 300
          });
          photo = await loadPhoto(signed_url);
        }
      } catch (e) {
        photo = null;
      }
    }

    const overrides = sanitizeResumeStyleOverrides(body?.style_overrides);
    const { base64, filename } = buildResumeDocx({ profile, resume, label, template, photo, layout, overrides });

    return Response.json({ base64, filename });
  } catch (error) {
    return Response.json({ error: error.message || 'The Word document could not be built.' }, { status: 500 });
  }
}