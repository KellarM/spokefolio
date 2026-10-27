import { useCallback, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { createDictationRecorder } from '@/lib/dictationRecorder';
import { shapeUtterance } from '@/lib/speech';

// Voice primitives for the mock interview. The interviewer speaks with the
// same assistant voice that runs Voice Mode everywhere else; the candidate's
// microphone stops itself when they pause, exactly like the profile's loop.
// The panel-level conversation (question -> answer -> feedback -> next) is
// orchestrated by InterviewVoice; this hook only knows how to talk and hear.

const TURN_MAX_MS = 60000;       // one spoken interview answer caps at a minute
const SILENCE_STOP_MS = 3000;   // this much quiet after speech ends the turn
const SPEECH_MIN_MS = 350;       // speech must last this long before silence-stop can arm
const LISTEN_NUDGE_MS = 12000;   // nothing said for this long: the mic gives up
const LEVEL_THRESHOLD = 0.015;   // quiet rooms sit far below this; AGC lifts speech above it
const BARGE_LEVEL = 0.05;        // barge-in needs a voice louder than speaker echo
const BARGE_SUSTAIN_MS = 400;    // ...sustained for this long, so a question never cuts itself off

export default function useInterviewVoice() {
  const [phase, setPhase] = useState('idle'); // idle | speaking | listening | thinking
  const [heard, setHeard] = useState('');

  const recorderRef = useRef(null);
  const watcherRef = useRef(null);
  const settleListenRef = useRef(null); // so stopAll settles a pending listen

  const clearWatcher = () => {
    if (watcherRef.current) clearInterval(watcherRef.current);
    watcherRef.current = null;
  };

  // Speak one line with the working assistant voice, then resolve. Barge-in:
  // while the interviewer speaks, a loud sustained voice cuts the line early
  // so a candidate who has heard enough can jump straight to their answer.
  const say = useCallback((text, { bargeable = true } = {}) => new Promise((resolve) => {
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
      const utterance = new SpeechSynthesisUtterance(String(text || ''));
      shapeUtterance(utterance, { profile: 'assistant' });
      utterance.onend = done;
      utterance.onerror = done;
      setTimeout(done, 2500 + String(text || '').length * 70); // safety net: never hang the loop
      synth.speak(utterance);
      if (bargeable) {
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
                done(); // resolves early: the caller opens the mic for the answer
              }
            }
          });
          bargeRecorder.start().then((ok) => {
            if (!ok || settled) done();
          }).catch(() => {
            // No barge microphone (iOS, denied permission): the line simply
            // plays to the end. Same posture as Voice Mode.
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
  }), []);

  // One listening turn: open the microphone, stop when the candidate pauses,
  // transcribe, and hand back the words. Empty string means nothing audible.
  const listenOnce = useCallback(() => new Promise((resolve) => {
    let settled = false;
    const settle = (value) => {
      if (settled) return;
      settled = true;
      settleListenRef.current = null;
      resolve(value);
    };
    settleListenRef.current = settle;
    let voiceAt = 0;
    let spokeFor = 0;
    let startedAt = 0;
    const finish = (file) => {
      recorderRef.current = null;
      clearWatcher();
      (async () => {
        let transcript = '';
        try {
          if (file) {
            const uploaded = await base44.integrations.Core.UploadPrivateFile({ file });
            const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({
              file_uri: uploaded.file_uri, expires_in: 600
            });
            const response = await base44.functions.invoke('transcribeDictation', {
              file_uri: uploaded.file_uri, audio_url: signed_url
            });
            transcript = (response.data?.transcript || '').trim();
          }
        } catch {
          transcript = '';
        }
        settle(transcript);
      })();
    };
    const giveUp = () => {
      try { recorder?.dispose(); } catch {}
      clearWatcher();
      settle('');
    };
    const recorder = createDictationRecorder({
      onLevel: (peak) => {
        if (peak > LEVEL_THRESHOLD) { voiceAt = Date.now(); spokeFor += 50; }
      }
    });
    recorder.start().then((ok) => {
      if (!ok) { giveUp(); return; }
      recorderRef.current = recorder;
      startedAt = Date.now();
      setPhase('listening');
      watcherRef.current = setInterval(() => {
        const now = Date.now();
        const quietFor = voiceAt ? now - voiceAt : 0;
        const elapsed = now - startedAt;
        if (voiceAt && spokeFor >= SPEECH_MIN_MS && quietFor >= SILENCE_STOP_MS) {
          clearWatcher();
          try { finish(recorder.finish()); } catch { giveUp(); }
        } else if (elapsed >= TURN_MAX_MS) {
          clearWatcher();
          try { finish(recorder.finish()); } catch { giveUp(); }
        } else if (!voiceAt && elapsed >= LISTEN_NUDGE_MS) {
          giveUp(); // twelve seconds of silence: stop waiting for words
        }
      }, 50);
    }).catch(giveUp);
  }), []);

  // Silence the voice engine: the panel calls this when voice mode ends or
  // the component unmounts, so no line and no microphone outlives the loop.
  const stopAll = useCallback(() => {
    clearWatcher();
    if (settleListenRef.current) settleListenRef.current(''); // no zombie awaits
    if (recorderRef.current) {
      try { recorderRef.current.dispose(); } catch {}
      recorderRef.current = null;
    }
    try { window.speechSynthesis?.cancel(); } catch {}
    setPhase('idle');
  }, []);

  useEffect(() => () => stopAll(), [stopAll]);

  return { phase, setPhase, heard, setHeard, say, listenOnce, stopAll };
}
