// The studio stores a language by name ("German"), not by code.
const BY_NAME = {
  english: 'en',
  german: 'de',
  deutsch: 'de',
  french: 'fr',
  français: 'fr',
  spanish: 'es',
  español: 'es',
  italian: 'it',
  italiano: 'it',
  portuguese: 'pt',
  português: 'pt'
};

export function languageCode(language) {
  return BY_NAME[String(language || '').toLowerCase()] || 'en';
}
