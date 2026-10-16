import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { cleanText } from '../../shared/career.ts';
import { matchesLocationFilter, searchJobBank } from '../../shared/jobBank.ts';

const MAX_RESULTS = 8;
const MAX_HISTORY = 10;
const MAX_TITLES = 2;
const BANK_PER_TERM = 5;

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
  '- A link that ends in a city or a job category rather than the posting itself (like /jobs/edmonton/accountant) is a list, not a posting: leave it out.',
  '- Look for postings whose link points straight at the posting itself: an employer careers page, a government job bank posting, Indeed, ZipRecruiter, Glassdoor, Randstad, or a company hiring system.',
  '- Run more than one search if that is what it takes, then keep only the postings that hold up.',
  '- When a board only shows you a search page, do not stop: open the posting on its own page, or on the employer careers page, and use that link. Links ending in q-anything-jobs.html, or containing /jobsearch, /search or a plain city or category name, are search pages and are thrown away.',
  '- Never return the same posting twice.',
  '- summary: two or three plain sentences on what the role is and what it asks for, taken only from that posting. No advice, no opinion, no comment on the person.',
  '- work_address: the location exactly as the posting states it, or "Remote". Empty string when it does not say.',
  '- posted: roughly when it was posted, or an empty string.',
  '- pay: the pay the posting states, in the posting\'s own words (like "$62,000 a year" or "$31.50 an hour"). "Pay not stated" when the posting does not say.',
  `- At most ${MAX_RESULTS} postings. Fewer is fine. None is fine: then return an empty list and say why in note.`,
  '- note: one short, plain line about this search, describing only the postings in your results. Never say how many you found and use no numbers or figures.'
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

// A link to one posting carries that posting's own reference; a board page carries only a place or a category.
const hasPostingId = (url) => {
  if (!url) return false;
  if (/\d{5,}/.test(url)) return true;
  const tokens = url.match(/[A-Za-z0-9_-]{12,}/g) || [];
  return tokens.some((token) => /\d/.test(token));
};

const isUsablePosting = (url) => Boolean(url) && !isListingPage(url) && hasPostingId(url);

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
          posted: { type: 'string' },
          pay: { type: 'string' }
        },
        required: ['job_title', 'company', 'summary']
      }
    },
    note: { type: 'string' }
  },
  required: ['results']
};

const TITLES_SCHEMA = {
  type: 'object',
  properties: { titles: { type: 'array', items: { type: 'string' } } },
  required: ['titles']
};

function payLine(minPay, payPeriod) {
  const amount = `$${minPay.toLocaleString()}`;
  return payPeriod === 'hour'
    ? `Pay: at least ${amount} an hour, or the same rate worked out for a year.`
    : `Pay: at least ${amount} a year, or the same rate worked out for an hour.`;
}

function buildPrompt(category, location, distanceKm, homeLocation, limits) {
  const origin = homeLocation || location;
  const locationLine = location
    ? distanceKm > 0
      ? `Location: within ${distanceKm} km of ${origin} (around ${location}). Include postings in cities/towns within ${distanceKm} km of ${origin}, plus remote roles.`
      : `Location: strictly in ${location} only. Do NOT return postings from other cities in the same province or country (for example, if searching Edmonton, never return Calgary, Red Deer, or other cities).`
    : 'Location: not given: search broadly and include remote roles.';

  return [
    'Search the live web - job boards and employer career pages (Indeed, LinkedIn, company career sites, government job banks and similar) - for current postings matching this search.',
    '',
    `Category or role: ${category}`,
    locationLine,
    ...(limits.length ? ['', ...limits] : []),
    '',
    'Return only postings whose title and content are for this kind of work. Leave out postings for other kinds of work.'
  ].join('\n');
}

function buildTitlesPrompt(brief) {
  return [
    'You are given one person\'s real career history. Name the job titles they could credibly apply for today, so that postings can be searched for.',
    '',
    brief,
    '',
    `Return at most ${MAX_TITLES} titles.`,
    'Rules:',
    '- Each title must be one an employer would actually advertise for, worded the way a posting would word it.',
    '- Only titles their own history supports: no promotion, no field they have not worked in, no seniority they have not held.',
    '- Most recent and most senior work first.',
    `- ${MAX_TITLES} titles is the limit, not a target. One is the right answer when only one is supported.`
  ].join('\n');
}

const normalise = (item) => {
  const url = cleanText(item?.source_url, 1000);
  return {
    job_title: cleanText(item?.job_title, 160),
    company: cleanText(item?.company, 160),
    work_address: cleanText(item?.work_address, 200),
    summary: cleanText(item?.summary, 900),
    source_url: /^https?:\/\//i.test(url) ? url : '',
    posted: cleanText(item?.posted, 60),
    pay: cleanText(item?.pay, 120)
  };
};

const keyOf = (item) => item.source_url || `${item.job_title}|${item.company}`;

// One search of the live web for one category, with the limits applied.
async function searchOnce(base44, category, location, homeLocation, distanceKm, limits) {
  const found = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: [buildPrompt(category, location, distanceKm, homeLocation, limits), '', RULES].join('\n'),
    add_context_from_internet: true,
    response_json_schema: SEARCH_SCHEMA
  });

  const candidates = (Array.isArray(found?.results) ? found.results : [])
    .map(normalise)
    .filter((item) => item.job_title && item.company && isUsablePosting(item.source_url));

  const filtered = [];
  for (const item of candidates) {
    if (filtered.length >= MAX_RESULTS) break;
    if (location || homeLocation) {
      const ok = await matchesLocationFilter({
        itemPlace: item.work_address || '',
        itemMode: item.work_address || '',
        targetLocation: location,
        homeLocation,
        distanceKm
      });
      if (!ok) continue;
    }
    filtered.push(item);
  }

  return { results: filtered };
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
    const homeLocation = cleanText(body?.homeLocation || body?.profile?.location, 160);
    const location = cleanText(body?.location, 120) || homeLocation;

    const wantedDistance = Number(body?.distanceKm);
    const distanceKm = Number.isFinite(wantedDistance) ? Math.min(500, Math.max(0, Math.round(wantedDistance))) : 0;
    const wantedPay = Number(body?.minPay);
    const minPay = Number.isFinite(wantedPay) ? Math.min(10000000, Math.max(0, Math.round(wantedPay))) : 0;
    const payPeriod = body?.payPeriod === 'hour' ? 'hour' : 'year';

    if (mode === 'profile' && !body?.profile && !Array.isArray(body?.entries)) {
      return Response.json(
        { error: 'There is no career history to search from yet. Capture some history first, or search by category.' },
        { status: 400 }
      );
    }
    if (mode === 'criteria' && category.length < 2) {
      return Response.json({ error: 'Enter a job category or role title to search for.' }, { status: 400 });
    }

    const limits = [];
    if (distanceKm && (homeLocation || location)) {
      const origin = homeLocation || location;
      limits.push(
        `Distance: only postings whose stated location is within ${distanceKm} km of the applicant's home (${origin}). Leave out anything further away.`
      );
    } else if (location) {
      limits.push(
        `Strict city match: only postings located in ${location}. Leave out postings in any other city.`
      );
    }
    if (minPay) {
      limits.push(payLine(minPay, payPeriod));
      limits.push(
        'Leave out any posting whose stated pay is clearly below that. Where a posting does not state pay at all it may still be returned: put "Pay not stated" in the pay field.'
      );
    }

    let results = [];
    let titles = [];

    if (mode === 'profile') {
      // First the history says which roles it supports; then each of those is searched for like any category.
      const brief = candidateBrief(body?.profile, body?.entries);
      const derived = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: buildTitlesPrompt(brief),
        response_json_schema: TITLES_SCHEMA
      });

      titles = (Array.isArray(derived?.titles) ? derived.titles : [])
        .map((title) => cleanText(title, 80))
        .filter(Boolean)
        .slice(0, MAX_TITLES);

      // Both sources go out together for each title: Job Bank first, then the wider web search.
      const attempts = await Promise.allSettled(
        titles.map((title) =>
          Promise.all([
            searchJobBank({
              keywords: title,
              location,
              homeLocation,
              distanceKm,
              minPay,
              payPeriod,
              limit: BANK_PER_TERM
            }).catch(() => []),
            searchOnce(base44, title, location, homeLocation, distanceKm, limits)
          ])
        )
      );

      attempts.forEach((attempt) => {
        if (attempt.status !== 'fulfilled') return;
        const [bank, web] = attempt.value;
        [...bank, ...web.results].forEach((item) => {
          if (results.length >= MAX_RESULTS) return;
          if (results.some((kept) => keyOf(kept) === keyOf(item))) return;
          results.push(item);
        });
      });
    } else {
      // The national board and the wider web search run together, Job Bank postings first.
      const [bank, found] = await Promise.all([
        searchJobBank({
          keywords: category,
          location,
          homeLocation,
          distanceKm,
          minPay,
          payPeriod,
          limit: BANK_PER_TERM
        }).catch(() => []),
        searchOnce(base44, category, location, homeLocation, distanceKm, limits)
      ]);
      results = [...bank, ...found.results].slice(0, MAX_RESULTS);
    }

    const where = location ? ` around ${location}` : '';
    const searched =
      mode === 'profile'
        ? `roles that fit your history (${titles.length ? titles.join(', ') : 'no titles could be drawn from it yet'})${where}`
        : `"${category}"${where}`;

    return Response.json({
      status: 'ok',
      mode,
      category,
      location,
      titles,
      results,
      // A line is shown only when there is something to explain: an empty list, and what to try instead.
      note: results.length
        ? ''
        : `No single posting came back from Canada's Job Bank or the job sites for ${searched}. Some job sites will only show a search page to an automatic search. Try a broader category, a wider distance, or a nearby city or region.`
    });
  } catch (error) {
    return Response.json({ error: error.message || 'The job search did not go through.' }, { status: 500 });
  }
}