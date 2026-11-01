// Splitting one dictation into the jobs it actually describes.
//
// The dictation box collects speech, and speech arrives as a stream: a client
// works through fifteen years of history in one breath and everything used to
// land in a single entry with a single date range. This finds the boundaries
// they already speak out loud and gives each job its own dates.
//
// The rule that matters: a phrase alone is not a boundary. "I helped start a
// new job-costing system" is a sentence about a system, not a new employer.
// A boundary is the trigger phrase AND a date range in the same sentence, so
// the dates do the confirming. Everything here is pure - text in, segments out
// - so the behaviour can be tested without a microphone or a server.

// The phrases a client actually says, in all six studio languages. Matched
// case-insensitively, word-bounded, and deliberately loose: recognizers drop
// articles and swap "function" for "role" mid-sentence.
const TRIGGERS = [
  // English
  /\bstart(?:ing|s)?\s+(?:a\s+|the\s+|my\s+)?(?:new\s+)?(?:job|function|role|position|employer)\b/i,
  /\b(?:new|next|another)\s+(?:job|function|role|position|employer)\b/i,
  /\bbegin(?:ning|s)?\s+(?:a\s+|the\s+|my\s+)?(?:new\s+)?(?:job|function|role|position)\b/i,
  // Spanish
  /\b(?:empiezo|empecé|comienzo|nuevo|nueva|siguiente)\s+(?:un\s+|otro\s+)?(?:trabajo|puesto|rol|empleo|cargo)\b/i,
  // French
  /\b(?:je\s+commence|commence|nouvel?|nouvelle|prochain)\s+(?:un\s+|une\s+|autre\s+|nouveau\s+|nouvel\s+|nouvelle\s+)*(?:emploi|poste|r[oô]le|travail)\b/i,
  // German
  /\b(?:neue|neuen|neuer|n[äa]chste)\s+(?:stelle|job|position|rolle|arbeitgeber)\b/i,
  /\b(?:beginne|fange)\s+(?:eine\s+|einen\s+)?(?:neue|neuen)\b/i,
  // Italian
  /\b(?:nuovo|nuova|prossimo|inizio)\s+(?:un\s+|altro\s+)?(?:lavoro|posizione|ruolo|impiego)\b/i,
  // Portuguese
  /\b(?:novo|nova|pr[óo]ximo|come[çc]o)\s+(?:um\s+|outro\s+)?(?:emprego|trabalho|fun[çc][aã]o|cargo)\b/i
];

// "present" in every language the studio speaks, plus the ways people actually
// say a job has not ended.
const PRESENT = /\b(?:present|presente|current|currently|now|today|ongoing|date|aujourd'hui|actuel|actuellement|heute|derzeit|aktuell|attuale|attualmente|atual|atualmente|hoje|hoy|oggi|actualmente|jetzt)\b/i;

// The words that join one end of a range to the other. Word boundaries are not
// optional here: without them the "a" in "March" is read as the Spanish joiner
// and the month gets cut in half.
const JOINERS = /(?:\s*(?:(?:-|–|—)|\b(?:to|until|till|through|thru|bis|a|ad|au|al|ao|hasta)\b|à|até|jusqu['’]à)\s*,?\s*)/i;

// People say "mayo de 2020" and "March of 2019", so a month and its year are
// allowed a small word between them.
const GAP = /(?:\s*(?:de|del|of|do|da|di|von|el|the)\s*)?/i;

const MONTH = /\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch|zo|s|ço)?|apr(?:il|il)?|may|mayo|mai|mag(?:gio)?|jun(?:e|io|i)?|jul(?:y|io|i)?|aug(?:ust)?|ago(?:sto)?|sep(?:t(?:ember|iembre|embre))?|oct(?:ober|ubre|obre)?|nov(?:ember|iembre|embre)?|dec(?:ember|iembre|embre)?|janvier|février|fevrier|juin|juillet|août|aout|januar|jänner|februar|märz|april|juni|juli|oktober|dezember|gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre|janeiro|fevereiro|março|abril|maio|junho|julho|setembro|outubro|novembro|dezembro|enero|febrero|marzo|abril|mayo|junio|julio|septiembre|octubre|noviembre|diciembre)\b\.?/i;

const YEAR = /\b(?:19|20)\d{2}\b/;
// A date end: a year, optionally dressed with a month ("March 2019", "early
// 2019"). Non-capturing throughout so the range can wrap it in its own groups.
const DATE_END = new RegExp(
  `(?:(?:${MONTH.source}${GAP.source}\\s*)?(?:early\\s+|mid\\s+|late\\s+)?${YEAR.source}(?:\\s*${MONTH.source})?)`,
  'i'
);
const PRESENT_END = new RegExp(`(${PRESENT.source})`, 'i');
const SINCE = /\b(?:since|from|desde|depuis|seit|dal|desde|a partir de|starting|beginning)\b/i;

const tidy = (value) => String(value || '').replace(/\s+/g, ' ').replace(/^[\s,;:.\-–—]+|[\s,;:.\-–—]+$/g, '').trim();

// The date range a piece of text states, in the client's own words. Verbatim
// on purpose: the studio stores "March 2019" and "present" the way they said
// it, and the tailorer keeps proper nouns and dates as given.
export function parseRange(text) {
  const raw = String(text || '');
  if (!raw.trim()) return null;

  // A joined range first: "March 2019 to June 2021", "2019 - 2021", "2018 to present".
  // Both ends are captured by the match itself - splitting the phrase on the
  // joiner afterwards is what cut "March" into "M" and "rch 2019".
  const joined = new RegExp(
    `(${DATE_END.source})${JOINERS.source}(${DATE_END.source}|${PRESENT.source})`,
    'i'
  ).exec(raw);
  if (joined) {
    const start = tidy(joined[1]);
    const end = tidy(joined[2]);
    if (start && end) return { start_date: start, end_date: end, phrase: tidy(joined[0]) };
  }

  // "since May 2019", "from 2018", "desde 2019" - a job that is still running.
  const open = new RegExp(`${SINCE.source}\\s*(${DATE_END.source})`, 'i').exec(raw);
  if (open && !PRESENT_END.test(raw.slice(open.index + open[0].length))) {
    return { start_date: tidy(open[1]), end_date: 'present', phrase: tidy(open[0]) };
  }

  // A month and year on its own is still a start date ("Mar 2019").
  const monthYear = new RegExp(`${MONTH.source}\\s*${YEAR.source}`, 'i').exec(raw);
  if (monthYear) return { start_date: tidy(monthYear[0]), end_date: '', phrase: tidy(monthYear[0]) };

  return null;
}

// Where a segment boundary sits, if one does. The phrase and the dates must
// share a sentence - that is the guard against "start a new job-costing system".
export function findTrigger(text) {
  const raw = String(text || '');
  for (const pattern of TRIGGERS) {
    const match = pattern.exec(raw);
    if (!match) continue;
    const sentence = sentenceAround(raw, match.index, match[0].length);
    const range = parseRange(sentence.text);
    if (range) {
      return {
        phrase: match[0],
        range,
        // The whole sentence is the boundary, so it can be removed to undo it
        // and never lands in the entry the parser reads.
        start: sentence.start,
        end: sentence.end
      };
    }
  }
  return null;
}

// The sentence containing a match: from the previous full stop or line break to
// the next one. Newlines count because dictation arrives line by line.
function sentenceAround(raw, index, length) {
  const stop = /[.!?\n;]/;
  let start = index;
  while (start > 0 && !stop.test(raw[start - 1])) start -= 1;
  let end = index + length;
  while (end < raw.length && !stop.test(raw[end])) end += 1;
  return { start, end: end < raw.length ? end + 1 : end, text: raw.slice(start, end + 1) };
}

// One dictation in, the jobs it describes out. Every segment keeps its own
// dates and its own text; a boundary sentence is never folded into an entry.
export function splitSegments(text) {
  const raw = String(text || '');
  if (!raw.trim()) return [];

  const segments = [];
  let cursor = 0;
  let range = null;

  while (cursor < raw.length) {
    const rest = raw.slice(cursor);
    const trigger = findTrigger(rest);
    if (!trigger) break;
    const boundaryAt = cursor + trigger.start;
    const body = raw.slice(cursor, boundaryAt);
    const nextRange = trigger.range;
    segments.push(formatSegment(body, range));
    cursor = cursor + trigger.end;
    range = nextRange;
  }
  segments.push(formatSegment(raw.slice(cursor), range));

  // Text before the first boundary belongs to the job that was described first.
  return segments
    .map((segment, index) => ({ ...segment, index }))
    .filter((segment) => segment.text || segment.start_date);
}

function formatSegment(body, range) {
  const own = range || parseRange(body);
  return {
    // The parsed body never carries the boundary sentence, so the entry the
    // server structures is the job itself and nothing else.
    body: String(body || '').trim(),
    text: tidy(String(body || '')),
    start_date: own?.start_date || '',
    end_date: own?.end_date || '',
    rangePhrase: own?.phrase || ''
  };
}

// Removing a boundary puts the pieces back together: the trigger sentence goes,
// the text stays. Undo has to be lossless or the client will not trust it.
export function removeBoundary(text, triggerStart, triggerEnd) {
  const raw = String(text || '');
  return tidy(raw.slice(0, triggerStart) + ' ' + raw.slice(triggerEnd));
}

// Every boundary in the buffer, for the tray and for undo.
export function boundariesIn(text) {
  const raw = String(text || '');
  const found = [];
  let cursor = 0;
  while (cursor < raw.length) {
    const trigger = findTrigger(raw.slice(cursor));
    if (!trigger) break;
    found.push({ start: cursor + trigger.start, end: cursor + trigger.end, phrase: trigger.phrase, range: trigger.range });
    cursor = cursor + trigger.end;
  }
  return found;
}

// Saving several jobs in one tap, kept pure so it can be tested with fakes.
//
// Two rules it exists to enforce. The dates spoken in the boundary sentence are
// merged in only where the parser left them empty - the parser read the body
// and its answer is never overwritten. And nothing spoken is dropped: a segment
// that fails, and anything past the batch limit, comes back as leftovers for
// the next tap.
export async function captureSegments({ segments, limit, invoke, create, onWarning }) {
  const usable = (segments || []).filter((segment) => segment && segment.text);
  const batch = usable.slice(0, limit);
  const overflow = usable.slice(limit);
  const created = [];
  const failed = [];

  for (const segment of batch) {
    try {
      const parsed = (await invoke(segment.text)) || {};
      const merged = {
        ...parsed,
        start_date: parsed.start_date || segment.start_date || '',
        end_date: parsed.end_date || segment.end_date || ''
      };
      created.push(await create(merged, segment.text));
      if (parsed.warning && onWarning) onWarning(parsed.warning);
    } catch {
      failed.push(segment);
    }
  }

  return { created, failed, overflow, attempted: batch.length };
}
