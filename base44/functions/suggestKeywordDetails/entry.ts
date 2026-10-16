import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    suggested_title: { type: 'string' },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          text: { type: 'string' },
          category: {
            type: 'string',
            enum: ['certification', 'equipment', 'duty', 'compliance', 'accomplishment']
          }
        },
        required: ['text', 'category']
      }
    }
  },
  required: ['suggested_title', 'items']
};

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const query = typeof body?.query === 'string' ? body.query.trim() : '';
    const existing = Array.isArray(body?.existing)
      ? body.existing.map((s) => String(s || '').trim()).filter(Boolean).slice(0, 40)
      : [];

    if (!query) {
      return Response.json({ error: 'Enter a word, tool, role, or short description first.' }, { status: 400 });
    }
    if (query.length > 600) {
      return Response.json({ error: 'Keep the keyword or description under 600 characters.' }, { status: 400 });
    }

    const prompt = `You are a career history and resume specialist.
The user entered the following word, equipment, skill, job title, or short description to build out their career history:
"${query}"

Generate 10 to 12 concise, practical point-form details that someone with experience in "${query}" can drag and drop into their career history.

RULES:
- Include a practical mix of:
  1. Certifications / licenses (category: "certification") — e.g. "Certification License", "WHMIS & OSHA Safety Certification"
  2. Equipment, attachments, tools, or systems (category: "equipment") — e.g. "Clamp Truck", "Reach Truck & Order Picker", "RF Barcode Scanner"
  3. Core duties & daily operations (category: "duty") — e.g. "Unloading / Loading", "Pallet Stacking, Wrapping & Staging"
  4. Logs, inspections, safety & compliance (category: "compliance") — e.g. "Daily Maintenance Activity Log", "Pre-Shift Circle Check & Inspection"
  5. Strong resume bullet points (category: "accomplishment") — 2 to 3 ready-to-use action-oriented resume phrases
- Keep the first 8-9 items punchy and scannable in point form (2 to 7 words each, like "Certification License", "Clamp Truck", "Unloading / Loading", "Daily Maintenance Activity Log"), and the last 2-3 items as fuller action-oriented resume bullets.
- Do NOT repeat any of these existing items: ${JSON.stringify(existing)}
- Also return "suggested_title": a clean role or skill title for "${query}" (e.g., "Forklift & Material Handling Operator" for "Fork Truck").`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: RESPONSE_SCHEMA
    });

    return Response.json({
      suggested_title: result?.suggested_title || query,
      items: Array.isArray(result?.items) ? result.items : []
    });
  } catch (error) {
    return Response.json(
      { error: error.message || 'Could not generate details for that keyword.' },
      { status: 500 }
    );
  }
}