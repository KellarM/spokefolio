import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { cleanText } from '../../shared/career.ts';

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const MAX_HTML = 600000;
const MAX_TEXT = 16000;
const MIN_PAGE_TEXT = 400;
const MIN_PASTED_TEXT = 40;

const NAMED_ENTITIES = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  '#39': "'",
  '#x27': "'",
  '#x2f': '/',
  '#8217': '\u2019',
  '#8216': '\u2018',
  '#8220': '\u201c',
  '#8221': '\u201d',
  '#8211': '\u2013',
  '#8212': '\u2014',
  '#8230': '\u2026',
  '#160': ' '
};

const decodeEntities = (value) =>
  value.replace(/&(#?[a-zA-Z0-9]+);/g, (match, code) => (code in NAMED_ENTITIES ? NAMED_ENTITIES[code] : match));

// The readable text of a page, with scripts, styles and markup taken out.
function htmlToText(html) {
  return decodeEntities(
    html
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<(script|style|noscript|svg|template|iframe)[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<(br|\/p|\/div|\/li|\/tr|\/h[1-6]|\/section|\/article|\/ul|\/ol)\s*\/?>/gi, '\n')
      .replace(/<[^>]*>/g, ' ')
  )
    .split('\n')
    .map((line) => line.replace(/[ \t\u00a0]+/g, ' ').trim())
    .filter(Boolean)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .slice(0, MAX_TEXT);
}

// Only public web pages are ever fetched: no other schemes, no local or private addresses.
function readUrl(raw) {
  let url;
  try {
    url = new URL(raw);
  } catch (error) {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  const host = url.hostname.toLowerCase();
  if (!host.includes('.') || host === 'localhost') return null;
  if (/^(10|127|169\.254|192\.168)\./.test(host)) return null;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return null;
  if (/^(0\.0\.0\.0|::1|\[::1\])$/.test(host)) return null;
  if (/\.(local|internal|localhost|test|invalid)$/.test(host)) return null;
  return url;
}

// The employer, the role and where the work is - taken from the posting, never guessed.
async function readDetails(base44, sourceUrl, text, fromLink) {
  const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: [
      'You read a job posting and return it in a usable form for a resume-writing tool.',
      sourceUrl ? `Posting link: ${sourceUrl}` : 'The posting was pasted by the person themselves.',
      '',
      fromLink
        ? "The text below was taken from a public job page. It still carries the site's own furniture: navigation, cookie notices, apply buttons, adverts, recommended or unrelated jobs, other postings from the same employer, and footers."
        : 'The text below is the posting exactly as the person pasted it.',
      '',
      'Return:',
      '- company: the employer named in the posting. Empty string when the posting does not name one.',
      '- job_title: the title of the role being advertised, worded as the posting words it. Empty string when it is not stated.',
      '- work_address: the work location as the posting states it - street address, city and region, or "Remote". Empty string when the posting does not say.',
      fromLink
        ? "- job_description: the posting itself written out in full - role summary, duties, responsibilities, requirements, qualifications, schedule, pay and benefits - as one clean block of plain text, with no site furniture, no navigation, no adverts, no other jobs and no apply buttons. Keep the employer's own wording and every requirement. Never summarise, shorten, reword or add anything."
        : '- job_description: the pasted text exactly as it was given, unchanged.',
      '',
      'Rules:',
      '- Never invent a company, title, location, requirement or benefit. An empty string is the correct answer when the posting does not say.',
      '- Do not comment on the posting, the applicant or how well they match.',
      '',
      'Text:',
      '"""',
      text,
      '"""'
    ].join('\n'),
    response_json_schema: {
      type: 'object',
      properties: {
        company: { type: 'string' },
        job_title: { type: 'string' },
        work_address: { type: 'string' },
        job_description: { type: 'string' }
      },
      required: ['company', 'job_title', 'job_description']
    }
  });

  const description = cleanText(result?.job_description, 20000);
  return {
    company: cleanText(result?.company, 160),
    job_title: cleanText(result?.job_title, 160),
    work_address: cleanText(result?.work_address, 300),
    job_description: description.length >= 80 ? description : text
  };
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Please sign in.' }, { status: 401 });

    let body = {};
    try {
      body = await req.json();
    } catch (error) {
      body = {};
    }

    const pasted = cleanText(body?.text, 20000);
    const rawUrl = cleanText(body?.url, 1200);

    // Pasted text is used exactly as given: only the employer and role are read out of it.
    if (pasted.length >= MIN_PASTED_TEXT) {
      const details = await readDetails(base44, '', pasted, false);
      return Response.json({
        status: 'ok',
        source_url: '',
        company: details.company,
        job_title: details.job_title,
        work_address: details.work_address,
        job_description: pasted
      });
    }

    if (!rawUrl) {
      return Response.json({ error: 'Add a posting link, or paste the posting text.' }, { status: 400 });
    }

    const url = readUrl(rawUrl);
    if (!url) {
      return Response.json(
        { error: 'That does not look like a web link to a posting. Paste the link to the posting, or paste its text instead.' },
        { status: 400 }
      );
    }

    let page = '';
    try {
      const response = await fetch(url.toString(), {
        headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml' },
        redirect: 'follow',
        signal: AbortSignal.timeout(15000)
      });
      if (!response.ok) throw new Error(`the page answered with ${response.status}`);
      const html = await response.text();
      page = htmlToText(html.slice(0, MAX_HTML));
    } catch (error) {
      return Response.json({
        status: 'unreadable',
        source_url: url.toString(),
        note: `That posting could not be read (${error.message}). Some job sites block automatic reading. Paste the posting text instead - the tailoring works exactly the same.`
      });
    }

    if (page.length < MIN_PAGE_TEXT) {
      return Response.json({
        status: 'unreadable',
        source_url: url.toString(),
        note: 'This page did not show the posting text - it may build the page in the browser or ask you to sign in. Paste the posting text instead - the tailoring works exactly the same.'
      });
    }

    const details = await readDetails(base44, url.toString(), page, true);
    return Response.json({
      status: 'ok',
      source_url: url.toString(),
      company: details.company,
      job_title: details.job_title,
      work_address: details.work_address,
      job_description: details.job_description
    });
  } catch (error) {
    return Response.json({ error: error.message || 'That posting could not be read.' }, { status: 500 });
  }
}