import { cleanText } from './career.ts';

// Where in North America a free-text location points. Profile locations are
// "City, Region, Country", but older profiles hold "City, Province" and some
// hold just a city. Detection runs country word first, then full province /
// state names, then two-letter codes. Unknown resolves to CA so existing
// Canadian profiles keep their current behaviour.

const PROVINCES = [
  'alberta', 'british columbia', 'manitoba', 'new brunswick', 'newfoundland',
  'nova scotia', 'northwest territories', 'nunavut', 'ontario',
  'prince edward island', 'quebec', 'saskatchewan', 'yukon'
];

const PROVINCE_CODES = ['ab', 'bc', 'mb', 'nb', 'nl', 'ns', 'nt', 'nu', 'on', 'pe', 'qc', 'sk', 'yt'];

const STATES = [
  'alabama', 'alaska', 'arizona', 'arkansas', 'california', 'colorado',
  'connecticut', 'delaware', 'florida', 'georgia', 'hawaii', 'idaho',
  'illinois', 'indiana', 'iowa', 'kansas', 'kentucky', 'louisiana', 'maine',
  'maryland', 'massachusetts', 'michigan', 'minnesota', 'mississippi',
  'missouri', 'montana', 'nebraska', 'nevada', 'new hampshire', 'new jersey',
  'new mexico', 'new york', 'north carolina', 'north dakota', 'ohio',
  'oklahoma', 'oregon', 'pennsylvania', 'rhode island', 'south carolina',
  'south dakota', 'tennessee', 'texas', 'utah', 'vermont', 'virginia',
  'washington', 'west virginia', 'wisconsin', 'wyoming'
];

const STATE_CODES = [
  'al', 'ak', 'az', 'ar', 'co', 'ct', 'de', 'fl', 'ga', 'hi', 'id', 'il', 'in',
  'ia', 'ks', 'ky', 'la', 'me', 'md', 'ma', 'mi', 'mn', 'ms', 'mo', 'mt', 'ne',
  'nv', 'nh', 'nj', 'nm', 'ny', 'nc', 'nd', 'oh', 'ok', 'or', 'pa', 'ri', 'sc',
  'sd', 'tn', 'tx', 'ut', 'vt', 'va', 'wa', 'wv', 'wi', 'wy', 'ca'
];
// 'ca' as a lone region code reads as California: the "City, CA" shape is a
// very common US form, and a Canadian location carrying its province ("City,
// AB") is matched by the province codes before these are ever reached.

const segments = (location) =>
  cleanText(location, 160)
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter(Boolean);

// 'CA' | 'US' | ''
export function detectCountry(location) {
  const text = cleanText(location, 160).toLowerCase();
  if (!text) return '';

  if (/\bcanada\b/.test(text)) return 'CA';
  if (/united states|(^|\b)usa\b|u\.s\.a|(^|\b)us\b/.test(text)) return 'US';

  const parts = segments(location);

  if (PROVINCES.some((p) => text.includes(p))) return 'CA';
  if (STATES.some((s) => text.includes(s))) return 'US';

  if (parts.some((part) => PROVINCE_CODES.includes(part))) return 'CA';
  if (parts.some((part) => STATE_CODES.includes(part))) return 'US';

  return '';
}
