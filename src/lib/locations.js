// Location search for the typeahead: the packed rows from locationsData.js,
// parsed once on first use and never again. The module itself is imported
// dynamically, so the dataset travels only with the field that needs it.
import { LOCATION_ROWS } from './locationsData';

let parsed = null;

const parseAll = () => {
  if (!parsed) {
    parsed = LOCATION_ROWS.map((row) => {
      const at = row.indexOf('|');
      const at2 = row.indexOf('|', at + 1);
      return {
        city: row.slice(0, at),
        region: row.slice(at + 1, at2),
        country: row.slice(at2 + 1),
        tokens: `${row.slice(0, at2)}`.toLowerCase().split(/[^a-z]+/).filter(Boolean)
      };
    });
  }
  return parsed;
};

const queryTokens = (value) =>
  String(value || '')
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter(Boolean);

// Suggestions for what the person has typed so far. A city matches when every
// query token is a prefix of (or inside) its name or region: "edmo" finds
// Edmonton, "edmonton al" still finds it, and "vancouver was" finds the
// Washington one. City-name matches rank first, then region matches, then
// alphabetical, so the list below the field reads in a predictable order.
export async function searchLocations(value, limit = 8) {
  const tokens = queryTokens(value);
  if (tokens.length < 1 || tokens.join('').length < 2) return [];

  const rows = parseAll();
  const scored = [];
  for (const row of rows) {
    let cityHit = false;
    let ok = true;
    for (const token of tokens) {
      const hit = row.tokens.some((t) => t.startsWith(token) || t.includes(token));
      if (!hit) {
        ok = false;
        break;
      }
      if (row.tokens[0].startsWith(token) || row.tokens[0].includes(token)) cityHit = true;
    }
    if (ok) {
      scored.push({ row, cityHit });
    }
  }

  scored.sort((a, b) => {
    if (a.cityHit !== b.cityHit) return a.cityHit ? -1 : 1;
    const byCity = a.row.city.localeCompare(b.row.city);
    if (byCity !== 0) return byCity;
    return a.row.region.localeCompare(b.row.region);
  });

  return scored.slice(0, limit).map(({ row }) => ({
    city: row.city,
    region: row.region,
    country: row.country,
    label: `${row.city}, ${row.region}, ${row.country}`
  }));
}

// A city recognized inside free text - a spoken home address, for example.
// The longest city names test first so longer matches win over short ones,
// and the text must carry the city as its own word ("... in Edmonton, ...")
// so "Fort" never matches inside "Fort McMurray".
export function searchInText(text) {
  const low = ' ' + String(text || '').toLowerCase().replace(/[^a-z]+/g, ' ').trim() + ' ';
  if (low === '  ') return null;
  if (!searchInText.cache) {
    searchInText.cache = parseAll().slice().sort((a, b) => b.city.length - a.city.length);
  }
  for (const row of searchInText.cache) {
    const city = row.city.toLowerCase().replace(/[^a-z]+/g, ' ').trim();
    if (city && low.includes(' ' + city + ' ')) {
      return { city: row.city, region: row.region, country: row.country, label: `${row.city}, ${row.region}, ${row.country}` };
    }
  }
  return null;
}

export default searchLocations;
