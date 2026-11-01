import { languageCode } from './languageCode';

// The control says what it does. An unlabelled circled "i" beside a heading
// reads as decoration; a gold pill that says "How this works" does not.
const LABELS = {
  en: 'How this works',
  de: 'So funktioniert’s',
  fr: 'Comment ça marche',
  es: 'Cómo funciona',
  it: 'Come funziona',
  pt: 'Como funciona'
};

export function guideLabel(language) {
  return LABELS[languageCode(language)];
}
