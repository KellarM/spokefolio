// Client mirror of base44/shared/geo.ts. Kept identical: the search function
// runs the server copy, the board directory runs this one. Unknown resolves
// to CA so existing Canadian profiles keep their current behaviour.

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

// 'CA' | 'US' | ''
export function detectCountry(location) {
  const text = String(location || '').trim().toLowerCase();
  if (!text) return '';

  if (/\bcanada\b/.test(text)) return 'CA';
  if (/united states|(^|\b)usa\b|u\.s\.a|(^|\b)us\b/.test(text)) return 'US';

  const parts = text.split(/[^a-z]+/).filter(Boolean);

  if (PROVINCES.some((p) => text.includes(p))) return 'CA';
  if (STATES.some((s) => text.includes(s))) return 'US';

  if (parts.some((part) => PROVINCE_CODES.includes(part))) return 'CA';
  if (parts.some((part) => STATE_CODES.includes(part))) return 'US';

  return '';
}
