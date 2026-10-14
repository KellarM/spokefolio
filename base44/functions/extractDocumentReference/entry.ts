import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { cleanText } from '../../shared/career.ts';

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    facts: { type: 'array', items: { type: 'string' } }
  },
  required: ['summary', 'facts']
};

const UNREADABLE_NOTE =
  'This file could not be read automatically. Text, PDF and image files work best. The document is still saved here as a reference for your own use.';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);

    let body = {};
    try {
      body = await req.json();
    } catch (e) {
      body = {};
    }

    const documentId = cleanText(body?.document_id, 80);
    const fileUri = cleanText(body?.file_uri, 600);
    const name = cleanText(body?.name, 200) || 'reference document';
    const docType = cleanText(body?.doc_type, 40) || 'other';

    if (!documentId || !fileUri) {
      return Response.json({ error: 'A saved document id and file are required.' }, { status: 400 });
    }

    const save = async (patch) => {
      await base44.asServiceRole.entities.SupportingDocument.update(documentId, patch);
    };

    try {
      const signed = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
        file_uri: fileUri,
        expires_in: 900
      });

      const prompt = `You are cataloguing one piece of reference material for a single person's resume.

Attached file: "${name}" (type: ${docType}).

Read it and report the career evidence it contains.
- summary: 3-6 factual sentences describing what the document shows: roles, employers, dates, projects, technologies, responsibilities, results, or the customer praise it contains. Quote numbers exactly as written.
- facts: up to 12 short, standalone facts worth reusing on a resume, one line each.

Report only what the file actually contains. Never add outside information or invent details.`;

      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt,
        file_urls: [signed.signed_url],
        response_json_schema: RESPONSE_SCHEMA
      });

      const summary = cleanText(result?.summary, 4000);
      const facts = Array.isArray(result?.facts) ? result.facts.map((f) => cleanText(f, 300)).filter(Boolean).slice(0, 12) : [];

      await save({
        extracted_summary: [summary, facts.length ? '\nKey facts:\n- ' + facts.join('\n- ') : ''].join('').trim(),
        status: 'ready'
      });

      return Response.json({ ok: true, status: 'ready' });
    } catch (readError) {
      await save({ extracted_summary: UNREADABLE_NOTE, status: 'unreadable' });
      return Response.json({ ok: true, status: 'unreadable' });
    }
  } catch (error) {
    return Response.json({ error: error.message || 'The reference file could not be catalogued.' }, { status: 500 });
  }
}