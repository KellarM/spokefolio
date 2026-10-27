import { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { createDictationRecorder } from '@/lib/dictationRecorder';
import { parsePromptAnswer } from '@/lib/promptVoiceCommands';
import { getStoredLanguage, normalizeLanguage } from '@/components/LanguageSelect';
import { shapeUtterance } from '@/lib/speech';

// Voice Mode for the follow-up prompts. The panel speaks each question
// aloud, the client answers out loud - the detail, or no / next / save /
// repeat / close - and the panel acts. One tap opens it; the whole
// capture loop then runs verbally. Modeled on the profile's Voice Mode
// engine: the microphone stops itself on a pause, every turn transcribes
// before the next begins.

const TURN_MAX_MS = 25000;
const SILENCE_STOP_MS = 2400;
const SPEECH_MIN_MS = 350;
const LEVEL_THRESHOLD = 0.015;
const SESSION_MAX_TURNS = 40;

const LANG_TO_BCP47 = {
  English: 'en-CA', 'Español': 'es-ES', 'Français': 'fr-FR',
  Deutsch: 'de-DE', 'Italiano': 'it-IT', 'Português': 'pt-BR'
};

export default function usePromptVoice({ getPrompt, onAnswer, onFinish }) {
  const [active, setActive] = useState(false);
  const [phase, setPhase] = useState('idle'); // idle | speaking | listening | writing

  const activeRef = useRef(false);
  const turnResolveRef = useRef(null);
  const turnCountRef = useRef(0);
  const watcherRef = useRef(null);
  const recorderRef = useRef(null);

  const getPromptRef = useRef(getPrompt);
  const onAnswerRef = useRef(onAnswer);
  const onFinishRef = useRef(onFinish);
  getPromptRef.current = getPrompt;
  onAnswerRef.current = onAnswer;
  onFinishRef.current = onFinish;

  const say = (text) => new Promise((resolve) => {
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      setPhase((p) => (p === 'speaking' ? 'idle' : p));
      resolve();
    };
    try {
      const synth = window.speechSynthesis;
      if (!synth || !window.SpeechSynthesisUtterance) return done();
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = LANG_TO_BCP47[normalizeLanguage(getStoredLanguage())] || 'en-CA';
      shapeUtterance(utterance, { profile: 'assistant' });
      utterance.onend = done;
      utterance.onerror = done;
      setTimeout(done, 2500 + text.length * 70); // never hang the loop
      setPhase('speaking');
      synth.speak(utterance);
    } catch {
      done();
    }
  });

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

  const stopSession = () => {
    activeRef.current = false;
    clearWatcher();
    try { window.speechSynthesis?.cancel(); } catch {}
    setActive(false);
    setPhase('idle');
    settleTurn();
  };

  // One spoken answer becomes one panel decision. The caller's onAnswer is
  // awaited, so a slow suggestion-merge never collides with the next prompt.
  const processUtterance = async (text) => {
    const answer = parsePromptAnswer(text);
    if (answer.kind === 'close') {
      activeRef.current = false;
      setActive(false);
      await say('Voice mode off.');
      return;
    }
    if (answer.kind === 'save') {
      activeRef.current = false;
      setActive(false);
      await say('Saving this entry.');
      onFinishRef.current?.();
      return;
    }
    if (answer.kind === 'repeat') return; // the loop re-reads the prompt below
    if (answer.kind === 'bare_yes') {
      await say('Tell me the detail - numbers, tools, scope, who it helped.');
      return;
    }
    if (answer.kind === 'no') {
      await onAnswerRef.current?.('no', '');
      return;
    }
    if (answer.kind === 'next') {
      await onAnswerRef.current?.('next', '');
      return;
    }
    if (answer.kind === 'detail') {
      await onAnswerRef.current?.('yes', answer.text);
      return;
    }
    await say("I didn't catch that. Answer with the detail, or say no, next, save, or close.");
  };

  // One full turn: open the microphone, listen until the person pauses,
  // transcribe, act. The promise settles only when the turn is complete.
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
          if (!activeRef.current) return settleTurn();
          await processUtterance(text);
        } catch {
          if (activeRef.current) await say('Sorry - I could not hear that clearly. Try again, or tap your answer.');
        }
        settleTurn();
      })();
    };

    recorder.start().then((ok) => {
      if (!activeRef.current || !ok) {
        try { recorder.dispose(); } catch {}
        if (activeRef.current) {
          say('I could not open the microphone. Tap your answer instead.').then(() => stopSession());
        }
        settleTurn();
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
        }
      }, 50);
    }).catch(() => {
      if (activeRef.current) {
        say('I could not open the microphone. Tap your answer instead.').then(() => stopSession());
      } else settleTurn();
    });
  });

  useEffect(() => () => stopSession(), []);

  const startSession = async () => {
    if (activeRef.current) return;
    activeRef.current = true;
    setActive(true);
    turnCountRef.current = 0;
    await say('Voice mode on. I read each prompt aloud - answer with the detail, or say no, next, save, or close.');
    while (activeRef.current && turnCountRef.current < SESSION_MAX_TURNS) {
      // Speak the current prompt (or the end-of-prompts line), then listen.
      const text = getPromptRef.current?.() || '';
      if (text) {
        await say(text);
        if (!activeRef.current) break;
      } else {
        await say('You have been through every prompt. Say save to store the entry, or close.');
        if (!activeRef.current) break;
      }
      await runTurn();
    }
    if (activeRef.current) stopSession();
  };

  return { active, phase, startSession, stopSession };
}
