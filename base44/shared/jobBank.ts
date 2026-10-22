import { cleanText } from './career.ts';

// Canada's national job board. Its search pages list live postings with the employer, the place,
// the pay and the date, and every posting has its own page the app can read in full.
const JOB_BANK = 'https://www.jobbank.gc.ca';
// The same national board in French. Postings exist on both mirrors under the
// same id, so a French client sees natively French postings, not translations.
const JOB_BANK_FR = 'https://www.guichet-emplois.gc.ca';

const jobBankBase = (language) => (language === 'Français' ? JOB_BANK_FR : JOB_BANK);
const PER_PAGE = 25;
const HOURS_A_YEAR = 2080;
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

const PROVINCE_NAMES = {
  alberta: 'AB',
  'british columbia': 'BC',
  manitoba: 'MB',
  'new brunswick': 'NB',
  'newfoundland and labrador': 'NL',
  'nova scotia': 'NS',
  'northwest territories': 'NT',
  nunavut: 'NU',
  ontario: 'ON',
  'prince edward island': 'PE',
  quebec: 'QC',
  'quebec city': 'QC',
  saskatchewan: 'SK',
  yukon: 'YT'
};

// Coordinates for Canadian cities and metro hubs so distance-based filtering works reliably and fast.
const CITY_COORDS = {
  'edmonton|ab': { lat: 53.5461, lon: -113.4938 },
  'sherwood park|ab': { lat: 53.5168, lon: -113.3187 },
  'st albert|ab': { lat: 53.6305, lon: -113.6256 },
  'saint albert|ab': { lat: 53.6305, lon: -113.6256 },
  'nisku|ab': { lat: 53.3378, lon: -113.5314 },
  'leduc|ab': { lat: 53.2594, lon: -113.5491 },
  'acheson|ab': { lat: 53.5492, lon: -113.7669 },
  'spruce grove|ab': { lat: 53.545, lon: -113.9008 },
  'stony plain|ab': { lat: 53.5264, lon: -114.0069 },
  'fort saskatchewan|ab': { lat: 53.7128, lon: -113.2131 },
  'beaumont|ab': { lat: 53.3572, lon: -113.4147 },
  'devon|ab': { lat: 53.3633, lon: -113.7311 },
  'morinville|ab': { lat: 53.8014, lon: -113.6497 },
  'gibbons|ab': { lat: 53.8275, lon: -113.3228 },
  'calmar|ab': { lat: 53.265, lon: -113.8122 },
  'wetaskiwin|ab': { lat: 52.9694, lon: -113.3769 },
  'camrose|ab': { lat: 53.0169, lon: -112.8333 },
  'red deer|ab': { lat: 52.2681, lon: -113.8112 },
  'lacombe|ab': { lat: 52.4683, lon: -113.7369 },
  'sylvan lake|ab': { lat: 52.3083, lon: -114.0964 },
  'ponoka|ab': { lat: 52.6778, lon: -113.5819 },
  'calgary|ab': { lat: 51.0447, lon: -114.0719 },
  'airdrie|ab': { lat: 51.2917, lon: -114.0144 },
  'cochrane|ab': { lat: 51.1894, lon: -114.4678 },
  'okotoks|ab': { lat: 50.7256, lon: -113.9747 },
  'chestermere|ab': { lat: 51.05, lon: -113.8225 },
  'balzac|ab': { lat: 51.2139, lon: -114.0069 },
  'high river|ab': { lat: 50.5808, lon: -113.8744 },
  'strathmore|ab': { lat: 51.0378, lon: -113.4003 },
  'canmore|ab': { lat: 51.0884, lon: -115.3479 },
  'banff|ab': { lat: 51.1784, lon: -115.5708 },
  'lethbridge|ab': { lat: 49.6956, lon: -112.8451 },
  'medicine hat|ab': { lat: 50.0405, lon: -110.6764 },
  'grande prairie|ab': { lat: 55.1707, lon: -118.7884 },
  'fort mcmurray|ab': { lat: 56.7267, lon: -111.379 },
  'lloydminster|ab': { lat: 53.278, lon: -110.005 },
  'cold lake|ab': { lat: 54.4642, lon: -110.1825 },
  'edson|ab': { lat: 53.5817, lon: -116.4344 },
  'hinton|ab': { lat: 53.4005, lon: -117.5864 },
  'whitecourt|ab': { lat: 54.1422, lon: -115.6844 },
  'drayton valley|ab': { lat: 53.2225, lon: -114.9769 },
  'slave lake|ab': { lat: 55.2856, lon: -114.7692 },
  'peace river|ab': { lat: 56.2339, lon: -117.2897 },
  'brooks|ab': { lat: 50.5642, lon: -111.8989 },
  'olds|ab': { lat: 51.7928, lon: -114.1069 },
  'innisfail|ab': { lat: 52.0294, lon: -113.95 },
  'rocky mountain house|ab': { lat: 52.3753, lon: -114.9217 },
  'drumheller|ab': { lat: 51.4636, lon: -112.7108 },
  'vancouver|bc': { lat: 49.2827, lon: -123.1207 },
  'burnaby|bc': { lat: 49.2488, lon: -122.9805 },
  'surrey|bc': { lat: 49.1913, lon: -122.849 },
  'richmond|bc': { lat: 49.1666, lon: -123.1336 },
  'delta|bc': { lat: 49.0847, lon: -123.0586 },
  'coquitlam|bc': { lat: 49.2838, lon: -122.7932 },
  'langley|bc': { lat: 49.1044, lon: -122.6604 },
  'abbotsford|bc': { lat: 49.0504, lon: -122.3045 },
  'chilliwack|bc': { lat: 49.1579, lon: -121.9515 },
  'victoria|bc': { lat: 48.4284, lon: -123.3656 },
  'kelowna|bc': { lat: 49.888, lon: -119.496 },
  'kamloops|bc': { lat: 50.6745, lon: -120.3273 },
  'nanaimo|bc': { lat: 49.1659, lon: -123.9401 },
  'prince george|bc': { lat: 53.9171, lon: -122.7497 },
  'saskatoon|sk': { lat: 52.1579, lon: -106.6702 },
  'regina|sk': { lat: 50.4452, lon: -104.6189 },
  'winnipeg|mb': { lat: 49.8951, lon: -97.1384 },
  'brandon|mb': { lat: 49.8485, lon: -99.9501 },
  'toronto|on': { lat: 43.6532, lon: -79.3832 },
  'mississauga|on': { lat: 43.589, lon: -79.6441 },
  'brampton|on': { lat: 43.7315, lon: -79.7624 },
  'markham|on': { lat: 43.8561, lon: -79.337 },
  'vaughan|on': { lat: 43.8563, lon: -79.5085 },
  'oakville|on': { lat: 43.4675, lon: -79.6877 },
  'burlington|on': { lat: 43.3255, lon: -79.799 },
  'hamilton|on': { lat: 43.2557, lon: -79.8711 },
  'ottawa|on': { lat: 45.4215, lon: -75.6972 },
  'london|on': { lat: 42.9849, lon: -81.2453 },
  'kitchener|on': { lat: 43.4516, lon: -80.4925 },
  'waterloo|on': { lat: 43.4643, lon: -80.5204 },
  'windsor|on': { lat: 42.3149, lon: -83.0364 },
  'montreal|qc': { lat: 45.5017, lon: -73.5673 },
  'quebec|qc': { lat: 46.8139, lon: -71.208 },
  'laval|qc': { lat: 45.6066, lon: -73.7124 },
  'gatineau|qc': { lat: 45.4765, lon: -75.7013 },
  'halifax|ns': { lat: 44.6488, lon: -63.5752 },
  'moncton|nb': { lat: 46.0878, lon: -64.7782 },
  'fredericton|nb': { lat: 45.9636, lon: -66.6431 },
  'saint john|nb': { lat: 45.2733, lon: -66.0633 },
  'st johns|nl': { lat: 47.5615, lon: -52.7126 },
  'charlottetown|pe': { lat: 46.2382, lon: -63.1311 }
};

const geocodeCache = new Map();

const decodeHtml = (value) =>
  String(value == null ? '' : value)
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');

const plain = (value, max = 400) =>
  cleanText(
    decodeHtml(decodeHtml(value))
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' '),
    max
  );

const cleanBlock = (value, max = 16000) =>
  cleanText(
    decodeHtml(decodeHtml(value))
      .replace(/<(br|\/p|\/div|\/li|\/h[1-6])\s*\/?>/gi, '\n')
      .replace(/<[^>]*>/g, ' ')
      .split('\n')
      .map((line) => line.replace(/[ \t\u00a0]+/g, ' ').trim())
      .filter(Boolean)
      .join('\n'),
    max
  );

// Comparing place names: accents and punctuation are dropped, so "Rivière-du-Loup" reads as "riviere du loup".
export const fold = (value) =>
  cleanText(String(value == null ? '' : value), 200)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const PROVINCE_WORD_REGEX = new RegExp(
  `\\b(${[...Object.keys(PROVINCE_NAMES), ...Object.values(PROVINCE_NAMES).map((c) => c.toLowerCase())].join('|')}|canada)\\b`,
  'gi'
);

// What the person typed as a place: the city they are near, and the province when they named one.
export function readPlace(value) {
  const raw = cleanText(String(value == null ? '' : value), 160);
  if (!raw) return { city: '', province: '', remote: false };

  const folded = ` ${fold(raw)} `;
  if (/\bremote\b/.test(folded)) {
    return { city: '', province: '', remote: true };
  }

  let province = '';
  Object.entries(PROVINCE_NAMES).forEach(([name, code]) => {
    if (folded.includes(` ${name} `)) province = code;
  });
  if (!province) {
    const code = folded.match(/\s(ab|bc|mb|nb|nl|ns|nt|nu|on|pe|qc|sk|yt)\s/);
    if (code) province = code[1].toUpperCase();
  }

  const parts = raw
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  let cityCandidate = parts[0] || raw;
  // When someone has a full street address ("11613 91 Street NW, Edmonton, Alberta"), pick the city segment.
  if (parts.length >= 2 && /\d/.test(parts[0])) {
    cityCandidate = parts[1];
  }

  let city = fold(cityCandidate.replace(PROVINCE_WORD_REGEX, ' ').replace(/\b[a-z]\d[a-z]\s*\d[a-z]\d\b/gi, ' '));
  if (city === 'canada' || city === 'remote') city = '';
  if (Object.prototype.hasOwnProperty.call(PROVINCE_NAMES, city)) city = '';

  return { city, province, remote: false };
}

function haversineKm(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  // Multiply straight-line distance by 1.2 to approximate driving distance.
  return 2 * R * Math.asin(Math.sqrt(h)) * 1.2;
}

export async function resolveCoords(placeText) {
  const place = readPlace(placeText);
  if (!place.city) return null;
  const key = `${place.city}|${(place.province || '').toLowerCase()}`;
  if (CITY_COORDS[key]) return CITY_COORDS[key];
  if (geocodeCache.has(key)) return geocodeCache.get(key);

  for (const [knownKey, coords] of Object.entries(CITY_COORDS)) {
    const [knownCity, knownProv] = knownKey.split('|');
    if (knownCity === place.city && (!place.province || knownProv === place.province.toLowerCase())) {
      geocodeCache.set(key, coords);
      return coords;
    }
  }

  try {
    const q = place.province ? `${place.city}, ${place.province}, Canada` : `${place.city}, Canada`;
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ca&q=${encodeURIComponent(q)}`,
      {
        headers: { 'User-Agent': 'IndividualResumeCraft/1.0' },
        signal: AbortSignal.timeout(4000)
      }
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data[0]?.lat && data[0]?.lon) {
        const coords = { lat: Number(data[0].lat), lon: Number(data[0].lon) };
        geocodeCache.set(key, coords);
        return coords;
      }
    }
  } catch (error) {
    // Fall back to city name matching when geocoding is unavailable.
  }

  geocodeCache.set(key, null);
  return null;
}

// Checks whether a posting's stated location matches the user's location or falls within distanceKm of their home/search location.
export async function matchesLocationFilter({
  itemPlace,
  itemMode = '',
  targetLocation = '',
  homeLocation = '',
  distanceKm = 0
}) {
  const target = readPlace(targetLocation || homeLocation);
  if (target.remote) {
    return /remote|telework/i.test(itemMode) || /remote/i.test(itemPlace);
  }
  if (!target.city && !target.province) return true;

  const whereFolded = ` ${fold(itemPlace)} `;
  const isRemote = /remote|telework/i.test(itemMode) || /\bremote\b/.test(whereFolded);
  if (isRemote && distanceKm > 0) return true;

  const itemParsed = readPlace(itemPlace);

  // If the user named a province and the posting names a different province, reject unless within border distance.
  if (target.province && itemParsed.province && target.province !== itemParsed.province && !distanceKm) {
    return false;
  }

  // Exact city match when no distance radius is added.
  if (target.city && !distanceKm) {
    return itemParsed.city === target.city || whereFolded.includes(` ${target.city} `);
  }

  // When a distance is specified, measure from the applicant's home address (or search city) to the job's city.
  if (distanceKm > 0) {
    const originText = homeLocation || targetLocation;
    const originParsed = readPlace(originText);
    if (originParsed.city && (itemParsed.city === originParsed.city || whereFolded.includes(` ${originParsed.city} `))) {
      return true;
    }
    if (target.city && (itemParsed.city === target.city || whereFolded.includes(` ${target.city} `))) {
      return true;
    }
    const [originCoords, destCoords] = await Promise.all([resolveCoords(originText), resolveCoords(itemPlace)]);
    if (originCoords && destCoords) {
      return haversineKm(originCoords, destCoords) <= distanceKm;
    }
    // If coordinates could not be resolved, require the same city so distant cities never slip in.
    return target.city ? itemParsed.city === target.city || whereFolded.includes(` ${target.city} `) : true;
  }

  return true;
}

function readPosting(chunk) {
  const id = (chunk.match(/<article id="article-(\d+)"/) || [])[1];
  const title = plain((chunk.match(/<span class="noctitle">([\s\S]*?)<\/span>/) || [])[1], 160);
  if (!id || !title) return null;

  const sourceBoard = plain(
    (chunk.match(/<li class="source">[\s\S]*?<span class="wb-inv">([^<]+)<\/span>/i) ||
      chunk.match(/<span class="job-source[^"]*"><span class="wb-inv">([^<]+)<\/span><\/span>/i) ||
      [])[1],
    80
  );

  return {
    id,
    title,
    company: plain((chunk.match(/<li class="business">([\s\S]*?)<\/li>/) || [])[1], 160),
    posted: plain((chunk.match(/<li class="date">([\s\S]*?)<\/li>/) || [])[1], 60),
    place: plain((chunk.match(/<li class="location">([\s\S]*?)<\/li>/) || [])[1], 120).replace(/^Location\s*/i, ''),
    pay: plain((chunk.match(/<li class="salary">([\s\S]*?)<\/li>/) || [])[1], 120).replace(/^Salary\s*/i, ''),
    mode: plain((chunk.match(/<span class="telework">([\s\S]*?)<\/span>/) || [])[1], 40),
    sourceBoard
  };
}

function readPostings(html) {
  return html
    .split('</article>')
    .filter((chunk) => chunk.includes('<article id="article-'))
    .map((chunk) => readPosting(chunk.slice(chunk.lastIndexOf('<article id="article-'))))
    .filter(Boolean);
}

async function listingPage(keywords, province, page, language) {
  const term = encodeURIComponent(keywords).replace(/%20/g, '+');
  const url = `${jobBankBase(language)}/jobsearch/jobsearch?searchstring=${term}&sort=D${province ? `&fprov=${province}` : ''}${
    page > 1 ? `&page=${page}` : ''
  }`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept-Language': language === 'Français' ? 'fr-CA,fr;q=0.9' : 'en-CA,en;q=0.9'
    },
    signal: AbortSignal.timeout(12000)
  });
  if (!response.ok) return [];
  return readPostings(await response.text());
}

// Reads a Job Bank detail page to extract the partner's original posting link (e.g., Indeed, Talent.com) and the embedded full job description.
export async function inspectJobBankPosting(jobBankIdOrUrl, language) {
  const idMatch = String(jobBankIdOrUrl || '').match(/(\d{6,})/);
  if (!idMatch) return null;
  const jobBankUrl = `${jobBankBase(language)}/jobsearch/jobposting/${idMatch[1]}`;

  try {
    const response = await fetch(jobBankUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept-Language': language === 'Français' ? 'fr-CA,fr;q=0.9' : 'en-CA,en;q=0.9'
      },
      signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) return null;
    const html = await response.text();

    const extMatch =
      html.match(/<a[^>]+id="externalJobLink"[^>]+href="([^"]+)"/i) ||
      html.match(/<a[^>]+href="([^"]+)"[^>]+id="externalJobLink"/i) ||
      html.match(/<div class="external-job[\s\S]*?<a[^>]+href="([^"]+)"/i);

    let externalUrl = extMatch ? decodeHtml(extMatch[1]).trim() : '';
    if (externalUrl && !/^https?:\/\//i.test(externalUrl)) {
      externalUrl = '';
    }

    const sourceMatch = html.match(/<span class="wb-inv">Source<\/span>[\s\S]*?<span>([^<]+)<\/span>/i);
    const partnerName = sourceMatch ? plain(sourceMatch[1], 80) : '';

    const descSpan = html.match(/<span[^>]+property="description"[^>]*>([\s\S]*?)<\/span>/i);
    const overviewBlock = html.match(
      /<div[^>]+class="[^"]*job-posting-detail-requirements[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<div class="job-posting-detail-apply"/i
    );

    const rawDesc = descSpan ? descSpan[1] : overviewBlock ? overviewBlock[1] : '';
    const fullDescription = cleanBlock(rawDesc, 16000);

    const titleMatch = html.match(/<span property="title">([\s\S]*?)<\/span>/i);
    const companyMatch = html.match(/<span property="hiringOrganization"[\s\S]*?<span property="name">([\s\S]*?)<\/span>/i);
    const localityMatch = html.match(/<span property="addressLocality">([\s\S]*?)<\/span>/i);
    const regionMatch = html.match(/<span property="addressRegion">([\s\S]*?)<\/span>/i);
    const streetMatch = html.match(/<span property="streetAddress">([\s\S]*?)<\/span>/i);

    const locParts = [
      streetMatch ? plain(streetMatch[1], 120) : '',
      localityMatch ? plain(localityMatch[1], 80) : '',
      regionMatch ? plain(regionMatch[1], 40) : ''
    ].filter(Boolean);

    return {
      jobBankUrl,
      externalUrl,
      partnerName,
      fullDescription,
      job_title: titleMatch ? plain(titleMatch[1], 160) : '',
      company: companyMatch ? plain(companyMatch[1], 160) : '',
      work_address: locParts.join(', ')
    };
  } catch (error) {
    return null;
  }
}

// The pay a posting states, worked out for a year, so a minimum pay can be applied to it.
function annualPay(pay) {
  const text = fold(pay);
  // French pay strings write decimals with a comma ("25,00 $ a l heure");
  // English ones use the comma as a thousands separator.
  const french = /heure|semaine|mois|jour\b|annuel|annee\b/.test(text);
  const amounts = (cleanText(pay, 120).match(/\d[\d,\s]*(?:[.,]\d+)?/g) || [])
    .map((raw) => {
      let value = raw.replace(/\s/g, '');
      if (french) value = value.replace(/,(\d{1,2})$/, '.$1').replace(/,/g, '');
      else value = value.replace(/,/g, '');
      return Number(value);
    })
    .filter((amount) => amount > 0);
  if (!amounts.length) return 0;
  const amount = Math.max(...amounts);
  if (/hour|\bhr\b|heure/.test(text)) return amount * HOURS_A_YEAR;
  if (/week|semaine/.test(text)) return amount * 52;
  if (/month|mois/.test(text)) return amount * 12;
  if (/\bday\b|jour\b/.test(text)) return amount * 260;
  if (/year|annual|annuel|annee\b/.test(text)) return amount;
  return 0;
}

async function toResult(item, language) {
  const address = item.place.replace(/\s*\(([A-Za-z]{2})\)\s*$/, ', $1');
  const jobBankUrl = `${jobBankBase(language)}/jobsearch/jobposting/${item.id}`;
  const details = await inspectJobBankPosting(item.id, language);

  const isPartner = Boolean(
    details?.externalUrl &&
      details.partnerName &&
      !/^job bank$/i.test(details.partnerName)
  ) || Boolean(item.sourceBoard && !/^job bank$/i.test(item.sourceBoard) && details?.externalUrl);

  const primaryUrl = details?.externalUrl || jobBankUrl;
  const fullDescription = details?.fullDescription || '';
  const summaryText = fullDescription
    ? plain(fullDescription, 340)
    : language === 'Français'
      ? `Offre affichée sur la Banque d'emplois du Canada${
          item.mode ? ` · ${item.mode}` : ''
        }. Ouvrez l'offre pour lire la description complète, les exigences et la façon de postuler.`
      : `Listed on Canada's Job Bank${
          item.mode ? ` · ${item.mode}` : ''
        }. Open the posting to read the full description, the requirements and how to apply.`;

  return {
    // French is claimed only when the French page actually served content;
    // anything else is marked English so the translator takes it.
    native_language: language === 'Français' && fullDescription ? 'Français' : 'English',
    job_title: item.title,
    company: item.company || details?.company || 'Not stated',
    work_address: details?.work_address || address,
    summary: summaryText,
    job_description: fullDescription,
    source_url: primaryUrl,
    jobbank_url: jobBankUrl,
    posted: item.posted,
    pay: item.pay || 'Pay not stated',
    origin: isPartner ? 'partner' : 'jobbank',
    partner_source: details?.partnerName || item.sourceBoard || ''
  };
}

// Postings from Job Bank for one set of words, narrowed to the place, distance and pay the person asked for.
export async function searchJobBank({
  keywords,
  location = '',
  homeLocation = '',
  distanceKm = 0,
  minPay = 0,
  payPeriod = 'year',
  limit = 5,
  language = 'English'
}) {
  const term = cleanText(String(keywords == null ? '' : keywords), 120);
  if (term.length < 2) return [];

  const place = readPlace(location || homeLocation);
  const floor = minPay > 0 ? (payPeriod === 'hour' ? minPay * HOURS_A_YEAR : minPay) : 0;

  // When searching for a specific city without a distance radius, include the city in the Job Bank search query so results focus on that city first.
  const queries = [];
  if (place.city && !distanceKm) {
    queries.push(`${term} ${place.city}`);
  } else {
    queries.push(term);
  }

  // One pass against one mirror of the board. A pass in French that finds
  // nothing is retried against the English mirror rather than showing an
  // empty board to a French-speaking client.
  const collect = async (searchLanguage) => {
    const matchedItems = [];
    const seen = new Set();

    for (const queryTerm of queries) {
      const pages = place.city ? 2 : 1;
      for (let page = 1; page <= pages; page += 1) {
        let items = [];
        try {
          items = await listingPage(queryTerm, place.province, page, searchLanguage);
        } catch (error) {
          break;
        }
      if (!items.length) break;

      for (const item of items) {
        if (matchedItems.length >= limit || seen.has(item.id)) continue;

        const locationOk = await matchesLocationFilter({
          itemPlace: item.place,
          itemMode: item.mode,
          targetLocation: location,
          homeLocation,
          distanceKm
        });
        if (!locationOk) continue;

        if (floor) {
          const pay = annualPay(item.pay);
          if (pay && pay < floor) continue;
        }

        seen.add(item.id);
        matchedItems.push(item);
      }

      if (matchedItems.length >= limit || items.length < PER_PAGE) break;
    }
  }

    return matchedItems.slice(0, limit);
  };

  let matchedItems = await collect(language);
  if (!matchedItems.length && language !== 'English') {
    matchedItems = await collect('English');
  }

  const results = await Promise.all(
    matchedItems.slice(0, limit).map((item) => toResult(item, language))
  );
  return results;
}