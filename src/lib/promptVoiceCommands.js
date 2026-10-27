// The spoken vocabulary of the follow-up prompts. Pure data and pure logic,
// no imports, so the answers can be tested in a plain Node run.

// Whole words only, accented or not: "no" must not match inside "noteworthy".
const escapeRe = (word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const matchesAny = (lower, words) =>
  words.some((word) => new RegExp('(^|[^a-zà-ÿ0-9])' + escapeRe(word) + '([^a-zà-ÿ0-9]|$)').test(lower));

export const PROMPT_CLOSERS = ['close', 'stop', 'exit', 'turn it off', 'cerrar', 'terminar', 'arrête', 'arrêter', 'schließen', 'stoppen', 'chiudi', 'fermar', 'fechar', 'parar'];
export const PROMPT_SAVERS = ['save', 'save it', 'save the entry', 'save this entry', 'save everything', "i'm done", 'im done', 'all done', 'finish', 'finished', 'guardar', 'guardalo', 'enregistrer', 'speichern', 'salvare', 'salva', 'salvar', 'salve', 'terminar'];
export const PROMPT_NOS = ['no', 'nope', 'nah', 'not really', "that's not me", 'thats not me', 'never did that', 'non', 'nein', 'no'];
export const PROMPT_NEXTS = ['next', 'next prompt', 'skip', 'skip it', 'pass', 'pass on it', 'later', 'siguiente', 'suivant', 'nächste', 'naechste', 'prossimo', 'próximo', 'proximo', 'passar'];
export const PROMPT_REPEATS = ['repeat', 'repeat that', 'say it again', 'say the question again', 'what was the question', 'again', 'répète', 'repetir', 'wiederholen', 'ancora'];
export const PROMPT_BARE_YES = ['yes', 'yeah', 'yep', 'sure', 'sí', 'si', 'oui', 'ja', 'certo', 'sì'];

// One spoken answer becomes one panel decision. Priority keeps a sentence
// like "no, next" on the safer, plainer path (a plain no beats skipping).
export function parsePromptAnswer(raw) {
  const text = (raw || '').trim();
  if (!text) return { kind: 'unrecognized' };
  const lower = text.toLowerCase();
  if (matchesAny(lower, PROMPT_CLOSERS)) return { kind: 'close' };
  if (matchesAny(lower, PROMPT_SAVERS)) return { kind: 'save' };
  if (matchesAny(lower, PROMPT_NOS)) return { kind: 'no' };
  if (matchesAny(lower, PROMPT_NEXTS)) return { kind: 'next' };
  if (matchesAny(lower, PROMPT_REPEATS)) return { kind: 'repeat' };
  if (matchesAny(lower, PROMPT_BARE_YES) && text.split(/\s+/).length <= 2) {
    return { kind: 'bare_yes' };
  }
  return { kind: 'detail', text };
}
