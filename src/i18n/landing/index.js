import en from './en';
import es from './es';
import fr from './fr';
import de from './de';
import it from './it';
import pt from './pt';

// Languages with a baked dictionary for the landing page. A language not
// listed here falls back to English until a dictionary is added — we never
// machine-guess copy in front of a visitor.
const DICTIONARIES = {
  English: en,
  Español: es,
  Français: fr,
  Deutsch: de,
  Italiano: it,
  Português: pt
};

export const hasLandingDictionary = (language) => Object.prototype.hasOwnProperty.call(DICTIONARIES, language);

// Everything the page shows, in the chosen language, with English filling
// any gap the dictionary leaves.
export const landingStrings = (language) => ({
  ...en,
  ...(DICTIONARIES[language] || {})
});
