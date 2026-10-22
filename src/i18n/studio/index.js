import en from './en';
import es from './es';
import fr from './fr';
import de from './de';
import it from './it';
import pt from './pt';

// Languages with a baked dictionary for the studio. A language not listed here
// falls back to English until a dictionary is added — the app never
// machine-guesses copy in front of a client.
const DICTIONARIES = {
  English: en,
  Español: es,
  Français: fr,
  Deutsch: de,
  Italiano: it,
  Português: pt
};

export const hasStudioDictionary = (language) =>
  Object.prototype.hasOwnProperty.call(DICTIONARIES, language);

// Everything the studio shows, in the chosen language, with English filling
// any gap the dictionary leaves.
export const studioStrings = (language) => ({
  ...en,
  ...(DICTIONARIES[language] || {})
});
