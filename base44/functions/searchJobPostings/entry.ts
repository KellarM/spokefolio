import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { cleanText } from '../../shared/career.ts';

const MAX_RESULTS = 8;
const MAX_HISTORY = 10;

const asList = (values, max, width) =>
  (Array.isArray(values) ? values : [])
    .map((value) => cleanText(value, width))
    .filter(Boolean)
    .slice(0, max);

// What the person has actually done, in the form the search gets shaped by.
function candidateBrief(profile, entries) {
  const person = profile || {};
  const history = (Array.isArray(entries) ? entries : [])
    .filter((entry) => entry && cleanText(entry.title, 160))
    .slice(0, MAX_HISTORY)
    .map((entry) => {
      const facts = [
        `${cleanText(entry.title, 160)}${entry.organization ? ` at ${cleanText(entry.organization, 160)}` : ''}`,
        `kind of entry: ${cleanText(entry.entry_type, 40) || 'work'}`,
        asList(entry.skills, 8, 60).length ? `skills: ${asList(entry.skills, 8, 60).join(', ')}` : '',
        asList(entry.accomplishments, 3, 220).length
          ? `did: ${asList(entry.accomplishments, 3, 220).join(' | ')}`
          : ''
      ].filter(Boolean);
      return `- ${facts.join(' · ')}`;
    });

  return [
    `Lives in: ${cleanText(person.location, 120) || 'not stated'}`,
    `Headline: ${cleanText(person.headline, 200) || 'not stated'}`,
    `Their own summary of their career: ${cleanText(person.master_summary, 700) || 'not stated'}`,
    `Roles they say they are aiming for: ${asList(person.target_titles, 6, 80).join(', ') || 'not stated'}`,
    `Skills they claim: ${asList(person.core_skills, 16, 60).join(', ') || 'not stated'}`,
    'Their recorded history:',
    ...(history.length ? history : ['- nothing recorded yet'])
  ].join('\n');
}

const RULES = [
  'Rules you must follow:',
  '- Only postings you actually found in search results. Never invent a company, a role, a location, a summary or a link.',
  '- Every source_url must be the direct link to one specific posting, exactly as it appeared in a result. Never return a search results page, a job board category page, or an employer careers index.',
  '- Never return the same posting twice.',
  '- summary: two or three plain sentences on what the role is and what it asks for, taken only from that posting. No advice, no opinion, no comment on the person.',
  '- work_address: the location exactly as the posting states it, or "Remote". Empty string when it does not say.',
  '- posted: roughly when it was posted, or an empty string.',
  `- At most ${MAX_RESULTS} postings. Fewer is fine. None is fine: then return an empty list and say why in note.`,
  '- note: one short, plain line to the person about this search.'
].join('\n');

// Search result listings, category pages and careers indexes are not postings: only a link to one job is usable.
const LISTING_PAGE =
  /([?&](q|query|search|keywords?|k|s)=)|(\/q-[^/]*jobs\.html)|(\/search)|(\/jobsearch)|(\/jobs\/search)|(\/job-search)|(\/careers\/?$)|(\/jobs\/?$)/i;

const isListingPage = (url) => {
  if (!url) return false;
  if (LISTING_PAGE.test(url)) return true;
  try {
    // A link carrying a pile of filter parameters is a filtered list, not one posting.
    return [...new URL(url).searchParams.keys()].length >= 4;
  } catch (error) {
    return false;
  }
};

const SEARCH_SCHEMA = {
  type: 'object',
  properties: {
    results: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          job_title: { type: 'string' },
          company: { type: 'string' },
          work_address: { type: 'string' },
          summary: { type: 'string' },
          source_url: { type: 'string' },
          posted: { type: 'string' }
        },
        required: ['job_title', 'company', 'summary']
      }
    },
    note: { type: 'string' }
  },
  required: ['results']
};

function buildPrompt(mode, category, location, brief) {
  if (mode === 'profile') {
    return [
      'Search the live web - job boards and employer career pages (Indeed, LinkedIn, company career sites, government job banks and similar) - for current postings this person is genuinely suited to.',
      '',
      'About the person. This is their real history: use nothing that is not in it.',
      brief,
      '',
      location
        ? `Search around: ${location}. Include that area and remote roles it allows.`
        : 'Their location is not given: search broadly and include remote roles.',
      '',
      'First work out which role titles their history actually supports, from their own titles, skills and accomplishments. Never suggest a role, a field or a level of seniority their history does not show. Then search for those titles.'
    ].join('\n');
  }

  return [
    'Search the live web - job boards and employer career pages (Indeed, LinkedIn, company career sites, government job banks and similar) - for current postings matching this search.',
    '',
    `Category or role: ${category}`,
    location
      ? `Location: ${location}. Include that area and remote roles it allows.`
      : 'Location: not given: search broadly and include remote roles.',
    '',
    'Return only postings whose title and content are for this kind of work. Leave out postings for other kinds of work.'
  ].join('\n');
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

    const mode = body?.mode === 'profile' ? 'profile' : 'criteria';
    const category = cleanText(body?.category, 120);
    const location = cleanText(body?.location, 120);

    if (mode === 'profile' && !body?.profile && !Array.isArray(body?.entries)) {
      return Response.json(
        { error: 'There is no career history to search from yet. Capture some history first, or search by category.' },
        { status: 400 }
      );
    }
    if (mode === 'criteria' && category.length < 2) {
      return Response.json({ error: 'Enter a job category or role title to search for.' }, { status: 400 });
    }

    const brief = mode === 'profile' ? candidateBrief(body?.profile, body?.entries) : '';

    const found = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: [buildPrompt(mode, category, location, brief), '', RULES].join('\n'),
      add_context_from_internet: true,
      response_json_schema: SEARCH_SCHEMA
    });

    const results = (Array.isArray(found?.results) ? found.results : [])
      .map((item) => {
        const url = cleanText(item?.source_url, 1000);
        return {
          job_title: cleanText(item?.job_title, 160),
          company: cleanText(item?.company, 160),
          work_address: cleanText(item?.work_address, 200),
          summary: cleanText(item?.summary, 900),
          source_url: /^https?:\/\//i.test(url) ? url : '',
          posted: cleanText(item?.posted, 60)
        };
      })
      .filter((item) => item.job_title && item.company && !isListingPage(item.source_url))
      .slice(0, MAX_RESULTS);

    // The line to the person always matches the list they are looking at.
    const searched =
      mode === 'profile'
        ? `roles that fit your history${location ? ` around ${location}` : ''}`
        : `"${category}"${location ? ` around ${location}` : ''}`;

    return Response.json({
      status: 'ok',
      mode,
      category,
      location,
      results,
      note: results.length
        ? cleanText(found?.note, 300)
        : `No single posting came back for ${searched}. Some job sites will only show a search page to an automatic search. Try a broader category, or a nearby city or region.`
    });
  } catch (error) {
    return Response.json({ error: error.message || 'The job search did not go through.' }, { status: 500 });
  }
}