import { cleanText } from './career.ts';

// Canada's national job board. Its search pages list live postings with the employer, the place,
// the pay and the date, and every posting has its own page the app can read in full.
const JOB_BANK = 'https://www.jobbank.gc.ca';
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

const plain = (value, max = 400) =>
  cleanText(
    String(value == null ? '' : value)
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&#39;|&apos;/gi, "'")
      .replace(/&quot;/gi, '"')
      .replace(/\s+/g, ' '),
    max
  );

// Comparing place names: accents and punctuation are dropped, so "Rivière-du-Loup" reads as "riviere du loup".
const fold = (value) =>
  cleanText(String(value == null ? '' : value), 200)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

// What the person typed as a place: the city they are near, and the province when they named one.
export function readPlace(value) {
  const raw = cleanText(String(value == null ? '' : value), 120);
  if (!raw) return { city: '', province: '' };

  const folded = ` ${fold(raw)} `;
  let province = '';
  Object.entries(PROVINCE_NAMES).forEach(([name, code]) => {
    if (folded.includes(` ${name} `)) province = code;
  });
  if (!province) {
    const code = folded.match(/\s(ab|bc|mb|nb|nl|ns|nt|nu|on|pe|qc|sk|yt)\s/);
    if (code) province = code[1].toUpperCase();
  }

  let city = fold(String(raw.split(',')[0] || '').replace(/\b(ab|bc|mb|nb|nl|ns|nt|nu|on|pe|qc|sk|yt)\b/gi, ' '));
  if (city === 'canada' || city === 'remote') city = '';
  if (Object.prototype.hasOwnProperty.call(PROVINCE_NAMES, city)) city = '';

  return { city, province };
}

function readPosting(chunk) {
  const id = (chunk.match(/<article id="article-(\d+)"/) || [])[1];
  const title = plain((chunk.match(/<span class="noctitle">([\s\S]*?)<\/span>/) || [])[1], 160);
  if (!id || !title) return null;

  return {
    id,
    title,
    company: plain((chunk.match(/<li class="business">([\s\S]*?)<\/li>/) || [])[1], 160),
    posted: plain((chunk.match(/<li class="date">([\s\S]*?)<\/li>/) || [])[1], 60),
    place: plain((chunk.match(/<li class="location">([\s\S]*?)<\/li>/) || [])[1], 120).replace(/^Location\s*/i, ''),
    pay: plain((chunk.match(/<li class="salary">([\s\S]*?)<\/li>/) || [])[1], 120).replace(/^Salary\s*/i, ''),
    mode: plain((chunk.match(/<span class="telework">([\s\S]*?)<\/span>/) || [])[1], 40)
  };
}

function readPostings(html) {
  return html
    .split('</article>')
    .filter((chunk) => chunk.includes('<article id="article-'))
    .map((chunk) => readPosting(chunk.slice(chunk.lastIndexOf('<article id="article-'))))
    .filter(Boolean);
}

async function listingPage(keywords, province, page) {
  const term = encodeURIComponent(keywords).replace(/%20/g, '+');
  const url = `${JOB_BANK}/jobsearch/jobsearch?searchstring=${term}&sort=D${province ? `&fprov=${province}` : ''}${
    page > 1 ? `&page=${page}` : ''
  }`;
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'en-CA,en;q=0.9' },
    signal: AbortSignal.timeout(12000)
  });
  if (!response.ok) return [];
  return readPostings(await response.text());
}

// The pay a posting states, worked out for a year, so a minimum pay can be applied to it.
function annualPay(pay) {
  const text = fold(pay);
  const amounts = (cleanText(pay, 120).match(/\d[\d,]*(?:\.\d+)?/g) || [])
    .map((amount) => Number(amount.replace(/,/g, '')))
    .filter((amount) => amount > 0);
  if (!amounts.length) return 0;
  const amount = Math.max(...amounts);
  if (/hour|\bhr\b/.test(text)) return amount * HOURS_A_YEAR;
  if (/week/.test(text)) return amount * 52;
  if (/month/.test(text)) return amount * 12;
  if (/day/.test(text)) return amount * 260;
  if (/year|annual/.test(text)) return amount;
  return 0;
}

function toResult(item) {
  const address = item.place.replace(/\s*\(([A-Za-z]{2})\)\s*$/, ', $1');
  return {
    job_title: item.title,
    company: item.company || 'Not stated',
    work_address: address,
    summary: `Listed on Canada's Job Bank${
      item.mode ? ` · ${item.mode}` : ''
    }. Open the posting to read the full description, the requirements and how to apply.`,
    source_url: `${JOB_BANK}/jobsearch/jobposting/${item.id}`,
    posted: item.posted,
    pay: item.pay || 'Pay not stated',
    origin: 'jobbank'
  };
}

// Postings from Job Bank for one set of words, narrowed to the place and pay the person asked for.
export async function searchJobBank({ keywords, location = '', distanceKm = 0, minPay = 0, payPeriod = 'year', limit = 5 }) {
  const term = cleanText(String(keywords == null ? '' : keywords), 120);
  if (term.length < 2) return [];

  const place = readPlace(location);
  // A named city is only a hard filter when no distance is chosen to reach past it.
  const cityWanted = place.city && (distanceKm > 0 || !place.province);
  const floor = minPay > 0 ? (payPeriod === 'hour' ? minPay * HOURS_A_YEAR : minPay) : 0;
  const pages = place.city && !place.province ? 3 : 2;

  const found = [];
  const seen = new Set();

  for (let page = 1; page <= pages; page += 1) {
    let items = [];
    try {
      items = await listingPage(term, place.province, page);
    } catch (error) {
      break;
    }
    if (!items.length) break;

    items.forEach((item) => {
      if (found.length >= limit || seen.has(item.id)) return;

      const where = fold(item.place);
      const remote = /remote|telework/i.test(item.mode) || /remote/.test(where);
      if (cityWanted && !remote && !where.includes(place.city)) return;

      if (floor) {
        const pay = annualPay(item.pay);
        if (pay && pay < floor) return;
      }

      seen.add(item.id);
      found.push(toResult(item));
    });

    if (found.length >= limit || items.length < PER_PAGE) break;
  }

  return found.slice(0, limit);
}