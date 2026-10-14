// Reads a wage or salary out of a job posting so it can be shown beside the application.
// It works from the posting text itself, so applications saved earlier show it too.

const PERIODS = [
  { re: /(per\s+hour|an?\s+hour|hourly|\/\s?h(?:r|our)\b|\bper\s+hr\b)/i, label: '/hr' },
  { re: /(per\s+year|a\s+year|annually|annual|yearly|\/\s?yr\b|\bper\s+annum\b)/i, label: '/yr' },
  { re: /(per\s+month|a\s+month|monthly|\/\s?mo\b)/i, label: '/mo' },
  { re: /(per\s+week|a\s+week|weekly|\/\s?wk\b)/i, label: '/wk' },
  { re: /(per\s+day|a\s+day|daily|\/\s?day\b)/i, label: '/day' }
];

const MONEY = /\$\s?(\d[\d,]*(?:\.\d{1,2})?\s?[kK]?)(?:\s?(?:-|–|—|to|up to)\s?\$?\s?(\d[\d,]*(?:\.\d{1,2})?\s?[kK]?))?/g;
const LABEL = /(salary|wage|rate of pay|pay rate|hourly rate|pay|compensation|remuneration|earnings|starting pay|starting at)/i;
const QUALIFIER = /(up to|starting at|from|minimum of|maximum of|at least)\s*$/i;
// Money that sits in an "extra" clause rather than in the pay offer.
const EXTRAS = /(overtime|premium|differential|bonus|allowance|stipend|mileage|commission)/i;

function segmentAround(text, start, end) {
  let from = 0;
  let to = text.length;
  for (const mark of ['.', ';', '•', '!', '?']) {
    from = Math.max(from, text.lastIndexOf(mark, start - 1) + 1);
    const at = text.indexOf(mark, end);
    if (at !== -1) to = Math.min(to, at);
  }
  return text.slice(from, to);
}

function readAmount(value) {
  const compact = value.replace(/[\s,]/g, '');
  const number = /k$/i.test(compact) ? Number(compact.slice(0, -1)) * 1000 : Number(compact);
  if (!Number.isFinite(number)) return null;
  return {
    number,
    text: Number.isInteger(number)
      ? number.toLocaleString('en-US')
      : number.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  };
}

export function extractSalary(description) {
  const text = (description || '').replace(/\s+/g, ' ').trim();
  if (!text || !text.includes('$')) return null;

  const found = [];
  for (const match of text.matchAll(MONEY)) {
    const [full, rawLow, rawHigh] = match;
    const end = match.index + full.length;
    const low = readAmount(rawLow);
    if (!low) continue;
    // "$25 million in sales" is a figure about the business, not about pay.
    if (/^\s*(million|billion|thousand|m\b)/i.test(text.slice(end, end + 60))) continue;

    const segment = segmentAround(text, match.index, end);
    const period = PERIODS.find((item) => item.re.test(segment));
    const labelled = LABEL.test(segment);
    if (!labelled && !period) continue;
    if (!labelled && EXTRAS.test(segment)) continue;
    if (period && period.label === '/hr' && low.number >= 1000) continue;
    if (period && period.label === '/yr' && low.number < 1000) continue;

    const high = rawHigh ? readAmount(rawHigh) : null;
    const amount = high && high.text !== low.text ? `$${low.text}–$${high.text}` : `$${low.text}`;
    const before = text.slice(Math.max(0, match.index - 60), match.index);
    const qualifier = (QUALIFIER.exec(before) || [])[1];
    const prefix = qualifier && /up to|starting at|from/i.test(qualifier) ? `${qualifier.toLowerCase()} ` : '';
    found.push({
      rank: labelled && period ? 0 : labelled ? 1 : 2,
      index: match.index,
      text: `${prefix}${amount}${period ? period.label : ''}`
    });
  }

  if (!found.length) return null;
  found.sort((a, b) => a.rank - b.rank || a.index - b.index);
  return found[0].text;
}