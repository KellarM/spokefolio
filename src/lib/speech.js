// Voice selection and delivery for every spoken line in the studio.
// The browser's default utterance is the mechanical one Michael keeps
// hearing: no voice is ever chosen, so the OS hands over its worst robot.
// This module asks what the device actually has and picks the best, per
// profile - the mascot's voice is chosen to differ from the working
// assistant voice that runs the prompts and the profile.

let voicesCache = [];
let loaded = false;

export const MASCOT_MUTE_KEY = 'spokefolio.mascotMuted';
export const MASCOT_HIDDEN_KEY = 'spokefolio.mascotHidden';

// Anything that changes how the mascot behaves tells the running app, so a
// switch flipped on the profile page takes effect without a reload.
const announce = () => {
  try { window.dispatchEvent(new CustomEvent('spokefolio:mascotPrefs')); } catch {}
};

export const mascotMuted = () => {
  try { return window.localStorage.getItem(MASCOT_MUTE_KEY) === '1'; } catch { return false; }
};

export const setMascotMuted = (muted) => {
  try {
    window.localStorage.setItem(MASCOT_MUTE_KEY, muted ? '1' : '0');
  } catch {}
  announce();
};

// Off means gone: no ball, no bubble, no voice, nothing to park or drag.
export const mascotHidden = () => {
  try { return window.localStorage.getItem(MASCOT_HIDDEN_KEY) === '1'; } catch { return false; }
};

export const setMascotHidden = (hidden) => {
  try {
    window.localStorage.setItem(MASCOT_HIDDEN_KEY, hidden ? '1' : '0');
  } catch {}
  announce();
};

const refreshVoices = () => {
  try {
    voicesCache = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
  } catch {
    voicesCache = [];
  }
};

export const primeVoices = () => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  refreshVoices();
  if (!loaded) {
    loaded = true;
    // Voices arrive asynchronously on most platforms; without this
    // listener the first lines of a session speak in the robot voice.
    try {
      window.speechSynthesis.addEventListener('voiceschanged', refreshVoices);
    } catch {
      const fallback = setInterval(() => {
        refreshVoices();
        if (voicesCache.length) clearInterval(fallback);
      }, 400);
    }
  }
};

// Known female and male voice names across Windows, macOS and Chrome's
// network voices - the mascot reads warmer, so it leans female.
// Word-bounded: "Online (Natural)" must never count as a female voice
// (its "nat" is not the name "Nat"), and "Google UK English Female"
// must - the label itself is the signal there.
const FEMALE = /\b(female|samantha|zira|susan|hazel|aria|jenny|ana|amelie|sonia|libby|emma|michelle|ava|allison|victoria|fiona|karen|moira|tessa|serena|nicky|natasha|linda|heather|salli|joanna|kendra|kimberly|amy|ivy|catherine|celine|elizabeth|clara)\b/i;
const MALE = /david|mark|daniel|alex|fred|george|james|ryan|thomas|guy|brian|arthur|oliver|liam|noah|steffan|christopher|eric|christopher|richard|brian/i;

// Scoring is pure: given the pool, the language, the profile and the voice
// already taken by the other profile, rank what is left.
export function scoreVoice(voice, langBase, profile, taken) {
  const name = (voice.name || '').toLowerCase();
  let score = 0;
  if (!langBase || !(voice.lang || '').toLowerCase().replace('_', '-').startsWith(langBase)) return -1;
  if (taken && voice.name === taken) score -= 600; // the two profiles must never collide while the pool allows
  // Edge's "Microsoft X Online (Natural)" neural voices and Safari's
  // "Premium"/"Enhanced" voices are the closest thing to human in the pool.
  if (/natural|online|neural/.test(name)) score += 130;
  if (/premium|enhanced/.test(name)) score += 90;
  if (name.includes('google')) score += 80; // Chrome's network voices beat local ones
  if (name.includes('microsoft')) score += 30;
  if (name.includes('compact') || name.includes('eloquence')) score -= 80; // the robots of the pool
  if (profile === 'mascot' && FEMALE.test(name)) score += 40;
  // The working voice leans bright and friendly too: a female voice from
  // the pool reads warmer than the flat defaults that made it sound down
  // even with the pitch raised (Michael, Oct 26).
  if (profile === 'assistant' && FEMALE.test(name)) score += 25;
  return score;
}

// Profiles shape delivery too: the mascot is the brightest voice on screen;
// the assistant is bubbly and friendly now - it stopped being the deep,
// lecturing tone that read as strict and stern (Michael, Oct 26). When the
// pool is thin and both profiles land on the same voice, the pitch gap
// keeps them sounding distinct.
export const PROFILE_SHAPE = {
  mascot: { rate: 1.06, pitch: 1.14 },
  // Bright but sane: 1.18 pitched the working voice into caricature
  // ('a big Irish drunk woman', Michael, Oct 26). Voice choice now lives
  // in the client's hands via the picker - this default only applies to
  // whoever never opens it.
  assistant: { rate: 1.0, pitch: 1.04 }
};

export function pickVoice(voices, lang, profile, taken) {
  const langBase = String(lang || 'en').slice(0, 2);
  const rank = (pool) => pool
    .map((voice) => ({ voice, score: scoreVoice(voice, langBase, profile, taken) }))
    .filter((entry) => entry.score >= 0)
    .sort((a, b) => b.score - a.score);
  if (profile === 'mascot') {
    // The mascot has exactly one voice: a female one. If the language
    // offers any female voice the assistant did not take, the mascot's
    // candidates are female voices only - it can never fall back to the
    // other voice.
    const female = rank(voices.filter((voice) => FEMALE.test((voice.name || '').toLowerCase())));
    const available = female.filter((entry) => entry.voice.name !== taken);
    if (available.length) return available[0].voice;
  }
  const ranked = rank(voices);
  return ranked.length ? ranked[0].voice : null;
}

// The studio's languages, as the speech engine wants them. Shared by the
// voice picker; the working hooks keep their own copy.
export const LANGUAGE_TO_BCP47 = {
  English: 'en-CA', 'Español': 'es-ES', 'Français': 'fr-FR',
  Deutsch: 'de-DE', 'Italiano': 'it-IT', 'Português': 'pt-BR'
};

// ---- The client's own voice choices ----
// Every device carries a different voice pool, and tuning it blind
// produced some terrible defaults (Michael, Oct 26: 'a big Irish drunk
// woman'). A stored override wins over the automatic pick, per profile.
const OVERRIDE_KEY = (profile) => `spokefolio.voice:${profile}`;

export const getVoiceOverride = (profile) => {
  if (typeof window === 'undefined') return null;
  try { return window.localStorage.getItem(OVERRIDE_KEY(profile)) || null; } catch { return null; }
};

export const setVoiceOverride = (profile, name) => {
  try {
    if (name) window.localStorage.setItem(OVERRIDE_KEY(profile), name);
    else window.localStorage.removeItem(OVERRIDE_KEY(profile));
  } catch {}
  Object.keys(chosen).forEach((key) => { chosen[key] = {}; }); // apply it now
};

// Every voice the device offers for a language, best first - the picker's
// shelf. Pure names, no handles: the client previews and decides.
export const getVoicesForPicker = (lang) => {
  if (typeof window === 'undefined') return [];
  primeVoices();
  const base = String(lang || 'en').slice(0, 2);
  const seen = new Set();
  return voicesCache
    .filter((voice) => (voice.lang || '').toLowerCase().replace('_', '-').startsWith(base))
    .map((voice) => ({ voice, score: scoreVoice(voice, base, 'assistant', null) }))
    .filter((entry) => {
      if (seen.has(entry.voice.name)) return false; // some platforms list twice
      seen.add(entry.voice.name);
      return true;
    })
    .sort((a, b) => b.score - a.score)
    .map((entry) => ({ name: entry.voice.name, lang: entry.voice.lang || '' }));
};

// The chosen voices, remembered for the session so the two profiles can
// avoid each other: the assistant picks first at each language, the
// mascot picks from what remains.
const chosen = {};
export function voiceFor(lang, profile) {
  if (typeof window === 'undefined') return null;
  primeVoices();
  if (!voicesCache.length) return null;
  // The client's pick wins over every heuristic.
  const override = getVoiceOverride(profile);
  if (override) {
    const match = voicesCache.find((voice) => voice.name === override);
    if (match) return match;
  }
  const key = String(lang || 'en').slice(0, 2);
  if (!chosen[key]) chosen[key] = {};
  if (!chosen[key].assistant) {
    chosen[key].assistant = pickVoice(voicesCache, key, 'assistant', null);
  }
  if (!chosen[key][profile]) {
    chosen[key][profile] = profile === 'assistant'
      ? chosen[key].assistant
      : pickVoice(voicesCache, key, profile, chosen[key].assistant?.name);
  }
  return chosen[key][profile] || null;
}

// Apply a profile to an existing utterance - for the callers that run
// their own synthesis loop (the profile's barge-in engine).
export function shapeUtterance(utterance, { lang, profile = 'assistant' }) {
  const voice = voiceFor(lang, profile);
  if (voice) {
    utterance.voice = voice;
    if (voice.lang) utterance.lang = voice.lang;
  }
  const shape = PROFILE_SHAPE[profile] || PROFILE_SHAPE.assistant;
  utterance.rate = shape.rate;
  utterance.pitch = shape.pitch;
  return utterance;
}

// The browser's voice list lands a beat after the page does. The mascot
// waits for it (bounded) so its very first line is already in its own
// voice - never the default robot the assistant is allowed to use.
export const whenVoicesReady = (timeoutMs = 2500) => new Promise((resolve) => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return resolve(false);
  primeVoices();
  if (voicesCache.length) return resolve(true);
  let waited = 0;
  const poll = setInterval(() => {
    refreshVoices();
    waited += 200;
    if (voicesCache.length || waited >= timeoutMs) {
      clearInterval(poll);
      resolve(voicesCache.length > 0);
    }
  }, 200);
});

// Speak a line with a profile. Resolves when the line ends (or the safety
// net fires). Skips if something is already being said - the mascot never
// tramples the working voice mid-sentence.
export function speak(text, { lang, profile = 'assistant' } = {}) {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis || !text) return resolve();
    try {
      if (window.speechSynthesis.speaking && profile === 'mascot') return resolve();
      if (profile === 'mascot' && !voiceFor(lang, profile)) {
        // No voice attached yet: wait for the pool, and if no voice can be
        // attached, the mascot stays silent rather than speak as someone
        // else. The bubble still shows the line.
        whenVoicesReady().then((ready) => {
          if (ready && voiceFor(lang, profile)) {
            speak(text, { lang, profile }).then(resolve);
          } else {
            resolve();
          }
        });
        return;
      }
      const utterance = shapeUtterance(new SpeechSynthesisUtterance(text), { lang, profile });
      let settled = false;
      const done = () => {
        if (settled) return;
        settled = true;
        resolve();
      };
      utterance.onend = done;
      utterance.onerror = done;
      setTimeout(done, 2500 + text.length * 80);
      window.speechSynthesis.speak(utterance);
    } catch {
      resolve();
    }
  });
}
