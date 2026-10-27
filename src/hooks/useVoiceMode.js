import { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { createDictationRecorder } from '@/lib/dictationRecorder';
import { parseSpokenDetails } from '@/lib/spokenDetails';

// Voice Mode: one tap opens a hands-free conversation. The person talks; the
// microphone stops itself when they pause; what they said is transcribed and
// parsed, and the app answers out loud. Nothing is saved until the person
// presses Save - this engine only hands parsed details to the page.
const TURN_MAX_MS = 25000;        // one spoken turn caps at 25 seconds
const SILENCE_STOP_MS = 2400;     // this much quiet after speech ends the turn - long enough for a deliberate pause mid-email
const SPEECH_MIN_MS = 350;        // speech must last this long before silence-stop can arm
const LISTEN_NUDGE_MS = 12000;    // nothing said: show the hint again
const SESSION_MAX_TURNS = 40;     // hard stop so a forgotten tab never runs forever
const LEVEL_THRESHOLD = 0.015;   // quiet rooms sit far below this; AGC lifts speech above it
const BARGE_LEVEL = 0.05;         // barge-in needs a voice louder than speaker echo
const BARGE_SUSTAIN_MS = 400;     // ...sustained for this long, so the app never cuts itself off

const CLOSERS = ['close', 'stop', "that's all", 'thats all', "that's it", 'thats it', 'goodbye', 'end session', 'terminar', 'termina', 'terminer', 'auf wiedersehen', 'tschuess'];
const CONFIRMERS = ['correct', "that's correct", 'thats correct', 'keep it', 'keep', 'save it', 'yes', 'sounds good', 'perfect', 'si', 'sí', 'oui', 'ja', 'certo', 'corretto', 'richtig', 'perfecto'];
const SAVERS = ['save', 'save it', "save it now", 'save my details', 'save everything', 'guardar', 'guardalo', 'enregistrer', 'enregistre', 'speichern', 'salvare', 'salva', 'salvar', 'salve'];
const REDOERS = ['redo', 'wrong', 'nope', 'try again', 'say it again', 'change it', "isn't right", 'mentira', 'nochmal', 'wiederholen', 'corrige'];

// Commands match whole words only, accented or not: "Jane" must never
// trip the German "ja", and "correct" must not match inside "incorrectly".
const escapeRe = (word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const matchesAny = (lower, words) =>
  words.some((word) => new RegExp('(^|[^a-zà-ÿ0-9])' + escapeRe(word) + '([^a-zà-ÿ0-9]|$)').test(lower));

const LANG_TO_BCP47 = {
  English: 'en-CA', 'Español': 'es-ES', 'Français': 'fr-FR',
  Deutsch: 'de-DE', 'Italiano': 'it-IT', 'Português': 'pt-BR'
};

export default function useVoiceMode({ t, onApply, onSave, language }) {
  const [active, setActive] = useState(false);
  const [phase, setPhase] = useState('idle'); // idle | listening | writing | speaking | closing
  const [said, setSaid] = useState('');
  const [heard, setHeard] = useState('');

  const activeRef = useRef(false);
  const recorderRef = useRef(null);
  const watcherRef = useRef(null);
  const pendingRef = useRef(null);
  const turnCountRef = useRef(0);
  const turnResolveRef = useRef(null);
  const tRef = useRef(t);
  const onApplyRef = useRef(onApply);
  const onSaveRef = useRef(onSave);
  const langRef = useRef(language);
  tRef.current = t;
  onApplyRef.current = onApply;
  onSaveRef.current = onSave;
  langRef.current = language;

  // Speak one line, then resolve. The text always lands on screen too, so a
  // person who cannot hear the app still sees every answer.
  // Barge-in: while the app speaks, the microphone listens for a loud,
  // sustained voice. Hearing one cuts the speech mid-sentence and hands
  // the session straight back to the person - their command comes next.
  const say = (text, { bargeable = true } = {}) => new Promise((resolve) => {
    setSaid(text);
    let settled = false;
    let bargeRecorder = null;
    let bargeSustain = 0;
    let lastLevelAt = 0;
    const done = () => {
      if (settled) return;
      settled = true;
      if (bargeRecorder) {
        try { bargeRecorder.dispose(); } catch {}
        bargeRecorder = null;
      }
      resolve();
    };
    try {
      const synth = window.speechSynthesis;
      if (!synth || !window.SpeechSynthesisUtterance) return done();
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = LANG_TO_BCP47[langRef.current] || 'en-CA';
      utterance.onend = done;
      utterance.onerror = done;
      setTimeout(done, 2500 + text.length * 70); // safety net: never hang the session
      synth.speak(utterance);
      if (bargeable && activeRef.current) {
        try {
          bargeRecorder = createDictationRecorder({
            onLevel: (peak) => {
              const now = Date.now();
              if (!lastLevelAt) { lastLevelAt = now; return; }
              if (peak > BARGE_LEVEL) bargeSustain += now - lastLevelAt;
              else bargeSustain = 0;
              lastLevelAt = now;
              if (bargeSustain >= BARGE_SUSTAIN_MS) {
                bargeSustain = 0;
                try { synth.cancel(); } catch {}
                done(); // resolves early; the session opens the mic for the command
              }
            }
          });
          bargeRecorder.start().then((ok) => {
            if (!ok || settled) done();
          }).catch(() => {
            // No barge microphone (iOS, denied permission): speech simply
            // plays to the end, as before.
            if (bargeRecorder) { try { bargeRecorder.dispose(); } catch {} }
            bargeRecorder = null;
          });
        } catch {
          bargeRecorder = null;
        }
      }
    } catch {
      done();
    }
  });

  const clearWatcher = () => {
    if (watcherRef.current) clearInterval(watcherRef.current);
    watcherRef.current = null;
  };

  const settleTurn = () => {
    if (turnResolveRef.current) {
      const resolve = turnResolveRef.current;
      turnResolveRef.current = null;
      resolve();
    }
  };

  const stopSession = (reason = 'user') => {
    activeRef.current = false;
    clearWatcher();
    pendingRef.current = null;
    turnCountRef.current = 0;
    if (reason !== 'unmount') {
      try { window.speechSynthesis?.cancel(); } catch {}
      setPhase('idle');
      setActive(false);
    }
    settleTurn();
  };

  const transcribe = async (file) => {
    const uploaded = await base44.integrations.Core.UploadPrivateFile({ file });
    const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({
      file_uri: uploaded.file_uri, expires_in: 600
    });
    const response = await base44.functions.invoke('transcribeDictation', {
      file_uri: uploaded.file_uri, audio_url: signed_url
    });
    return (response.data?.transcript || '').trim();
  };

  const applyPending = () => {
    const pending = pendingRef.current;
    pendingRef.current = null;
    if (pending && Object.keys(pending).length) onApplyRef.current(pending);
  };

  const spokenDetails = (parsed) => {
    const names = {
      full_name: tRef.current('profile.fullName'),
      email: tRef.current('profile.email'),
      phone: tRef.current('profile.phone'),
      home_address: tRef.current('profile.homeAddress'),
      location: tRef.current('profile.location'),
      preferred_language: tRef.current('profile.language'),
      linkedin: 'LinkedIn',
      website: 'Website'
    };
    return Object.entries(parsed)
      .map(([key, value]) => `${names[key] || key}: ${value}`)
      .join('; ');
  };

  // One utterance came back. Explicit close ends the session; anything that
  // parses as details becomes the pending answer; otherwise the utterance is
  // read as a command against the pending answer (correct / redo).
  const processUtterance = async (rawText) => {
    const text = (rawText || '').replace(/\s+/g, ' ').trim();
    setHeard(text);
    const lower = ' ' + text.toLowerCase() + ' ';

    if (text && matchesAny(lower, CLOSERS)) {
      applyPending();
      setPhase('closing');
      await say(tRef.current('voice.closed'), { bargeable: false });
      stopSession();
      return;
    }

    // The total verbal loop: saying save stores the form and ends the
    // session. It also carries any pending answer into the save, so
    // "save" doubles as a final "correct".
    if (text && matchesAny(lower, SAVERS)) {
      applyPending();
      setPhase('speaking');
      let ok = false;
      try { ok = await onSaveRef.current?.(); } catch { ok = false; }
      await say(ok ? tRef.current('voice.saved') : tRef.current('voice.saveFailed'), { bargeable: false });
      if (ok) stopSession();
      return; // a failed save keeps the session alive for another try
    }

    const parsed = text ? parseSpokenDetails(text) : {};
    if (Object.keys(parsed).length) {
      applyPending(); // a new answer replaces whatever was still waiting
      pendingRef.current = parsed;
      setPhase('speaking');
      await say(`${tRef.current('voice.heardPrefix')} ${spokenDetails(parsed)}. ${tRef.current('voice.confirmShort')}`);
      return;
    }

    if (pendingRef.current && matchesAny(lower, CONFIRMERS)) {
      applyPending();
      setPhase('speaking');
      await say(tRef.current('voice.kept'));
      return;
    }
    if (pendingRef.current && matchesAny(lower, REDOERS)) {
      pendingRef.current = null;
      setPhase('speaking');
      await say(tRef.current('voice.redo'));
      return;
    }

    setPhase('speaking');
    await say(tRef.current('voice.nothingHeard'));
  };

  // One full turn: open the microphone, listen until the person pauses,
  // transcribe, answer. The promise settles when the whole turn is done, so
  // the next turn can never open while the app is still speaking.
  const runTurn = () => new Promise((resolve) => {
    turnResolveRef.current = resolve;
    let voiceAt = 0;
    let spokeFor = 0;
    let startedAt = 0;
    const recorder = createDictationRecorder({
      onLevel: (peak) => {
        if (peak > LEVEL_THRESHOLD) { voiceAt = Date.now(); spokeFor += 50; }
      }
    });

    const finishTurn = (file) => {
      recorderRef.current = null;
      clearWatcher();
      setPhase('writing');
      (async () => {
        try {
          const text = await transcribe(file);
          if (!activeRef.current) return;
          await processUtterance(text);
        } catch {
          if (activeRef.current) {
            setPhase('speaking');
            await say(tRef.current('voice.trouble'));
          }
          stopSession();
          return;
        }
        settleTurn();
      })();
    };

    recorder.start().then((ok) => {
      if (!activeRef.current || !ok) {
        try { recorder.dispose(); } catch {}
        if (!activeRef.current) settleTurn();
        else {
          setPhase('speaking');
          say(tRef.current('voice.trouble')).then(() => { stopSession(); });
        }
        return;
      }
      recorderRef.current = recorder;
      turnCountRef.current += 1;
      startedAt = Date.now();
      setPhase('listening');
      watcherRef.current = setInterval(() => {
        if (!activeRef.current) { clearWatcher(); try { recorder.dispose(); } catch {} settleTurn(); return; }
        const now = Date.now();
        const quietFor = voiceAt ? now - voiceAt : 0;
        const elapsed = now - startedAt;
        if (voiceAt && spokeFor >= SPEECH_MIN_MS && quietFor >= SILENCE_STOP_MS) {
          clearWatcher();
          try { finishTurn(recorder.finish()); } catch { stopSession(); }
        } else if (voiceAt && elapsed >= TURN_MAX_MS) {
          clearWatcher();
          try { finishTurn(recorder.finish()); } catch { stopSession(); }
        } else if (!voiceAt && elapsed >= LISTEN_NUDGE_MS) {
          startedAt = now;
          setSaid(tRef.current('voice.prompt'));
        }
      }, 50);
    }).catch(() => {
      if (activeRef.current) {
        setPhase('speaking');
        say(tRef.current('voice.trouble')).then(() => { stopSession(); });
      } else settleTurn();
    });
  });

  useEffect(() => () => stopSession('unmount'), []);

  const start = async () => {
    if (activeRef.current) return;
    activeRef.current = true;
    setActive(true);
    setSaid('');
    setHeard('');
    pendingRef.current = null;
    turnCountRef.current = 0;
    setPhase('speaking');
    await say(tRef.current('voice.greeting'));
    while (activeRef.current && turnCountRef.current < SESSION_MAX_TURNS) {
      await runTurn();
    }
    if (activeRef.current) {
      applyPending();
      setPhase('closing');
      await say(tRef.current('voice.closed'), { bargeable: false });
      stopSession();
    }
  };

  const stop = () => {
    if (recorderRef.current) {
      try { recorderRef.current.dispose(); } catch {}
    }
    applyPending();
    stopSession();
  };

  return { active, phase, said, heard, start, stop };
}
