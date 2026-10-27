// Words to fields: what one spoken sentence of details becomes, in any of
// the studio's six languages. Shared by the profile page's Tap to Talk and
// Voice Mode so both hear the person exactly the same way.

const SPOKEN_LANGUAGES = {
  english: 'English', 'espanol': 'Español', 'español': 'Español', spanish: 'Español',
  'francais': 'Français', 'français': 'Français', french: 'Français',
  deutsch: 'Deutsch', german: 'Deutsch',
  italiano: 'Italiano', italian: 'Italiano',
  'portugues': 'Português', 'português': 'Português', portuguese: 'Português'
};

// Lead-in words people actually say, contractions included. Apostrophes are
// normalized to straight ones before matching, so "name's" and "name's" with
// a curly apostrophe both land here.
const NAME_CUES = "my name is|name is|my name's|name's|i am|i'm|this is|call me|mi chiamo|me llamo|je m'appelle|m'appelle|ich heisse|heisse ich|ich hei\u00dfe|hei\u00dfe ich|meu nome \u00e9|me chamo|chamo-me|eu sou|soy yo";
const ADDRESS_CUES = "my address is|address is|i live at|live at|located at|il mio indirizzo \u00e8|indirizzo \u00e8|mi direcci\u00f3n es|direcci\u00f3n es|mon adresse est|adresse est|meine adresse ist|adresse ist|meu endere\u00e7o \u00e9|endere\u00e7o \u00e9|moro na|moro no|moro em";
const LOCATION_CUES = "i live in|vivo in|vivo a|vivo en|je vis \u00e0|j'habite \u00e0|j'habite \u00e0|ich lebe in|lebe in|moro em|habito en|habito em";

// Words that end a captured value: the next detail, a language declaration,
// or sentence punctuation.
const VALUE_BOUNDARIES = "my|mi|mon|ma|meine|meu|minha|courriel|correo|email|mail|telefon|telephone|t\u00e9l\u00e9phone|telefono|telefone|phone|tel|hablo|parlo|parle|spreche|speak|i speak|i live|i am|vivo|vis|lebe|moro|habito|whats|what's";

export function parseSpokenDetails(raw) {
  // Speech engines return curly apostrophes; the cues above are written
  // with straight ones, so every utterance is normalized before matching.
  const clean = (raw || '')
    .replace(/[\u2018\u2019\u02BC]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  const out = {};

  const email = clean.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  if (email) out.email = email[0].replace(/[.,;:!?'"<>]+$/, '');
  const phone = clean.match(/\+?\d[\d\s().-]{7,}\d/);
  if (phone) out.phone = phone[0].trim().replace(/[.,;:!?]+$/, '');

  const nameM = clean.match(new RegExp('(?:' + NAME_CUES + ')\\s+([A-Za-z\u00C0-\u017F\' -]{2,40}?)(?=\\s*(?:,|\\.|;|!|\\s+my\\s|\\s+mi\\s|\\s+mon\\s|\\s+meine\\s|\\s+meu\\s|\\s+il\\s|\\s+and\\s|\\s+i\\s+live|\\s+vivo|\\s+je\\s|\\s+ich\\s|$))', 'i'));
  if (nameM) out.full_name = nameM[1].trim().replace(/\s+/g, ' ');

  const addrM = clean.match(new RegExp('(?:' + ADDRESS_CUES + ')\\s*(.{6,120}?)(?=\\s*(?:,?\\s*(?:and\\s+|und\\s+)?(?:' + VALUE_BOUNDARIES + ')\\s|\\.\\s*|\\.|;|!|$))', 'i'));
  if (addrM) out.home_address = addrM[1].replace(/\s+/g, ' ').replace(/[,.;]+$/, '').trim();

  if (!out.home_address) {
    // Commas stay inside the city capture so "Edmonton, Alberta" keeps its
    // province; the lookahead stops at sentence punctuation, the next
    // detail, "and", or the end.
    const locM = clean.match(new RegExp('(?:' + LOCATION_CUES + ')\\s+([A-Za-z\u00C0-\u017F ,\'-]{2,60}?)(?=\\s*(?:\\.|;|!|\\s+my\\s|\\s+mi\\s|\\s+mon\\s|\\s+meine\\s|\\s+meu\\s|\\s+and\\s|\\s+i\\s+live|\\s+i\\s+speak|$))', 'i'));
    if (locM) out.location = locM[1].replace(/\s+/g, ' ').replace(/[,.;]+$/, '').trim();
  }

  const low = ' ' + clean.toLowerCase() + ' ';
  for (const [word, value] of Object.entries(SPOKEN_LANGUAGES)) {
    const re = new RegExp('[\\s.,;!?]' + word + '[\\s.,;!?]');
    if (re.test(low)) { out.preferred_language = value; break; }
  }
  return out;
}
