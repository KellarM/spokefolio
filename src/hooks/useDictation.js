import { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { createDictationRecorder } from '@/lib/dictationRecorder';

// A single dictation clip is capped at five minutes.
const MAX_SECONDS = 300;

// Places a dictated passage under whatever is already in the field.
export function appendLine(current, addition) {
  const base = (current || '').trim();
  const text = (addition || '').trim();
  if (!text) return base;
  return base ? `${base}\n${text}` : text;
}

// Records one clip, has it transcribed by the app, and hands the words back.
export default function useDictation(onTranscript) {
  const { toast } = useToast();
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState('');
  const clipRef = useRef(null);
  const startingRef = useRef(false);
  const recorderRef = useRef(null);
  const mountedRef = useRef(true);
  const timerRef = useRef(null);
  const handlerRef = useRef(onTranscript);
  handlerRef.current = onTranscript;

  const clearTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearTimer();
      recorderRef.current?.dispose();
      recorderRef.current = null;
    };
  }, []);

  const reportFailure = (message) => {
    setError(message);
    toast({ title: 'Could not write down your recording', description: message, variant: 'destructive' });
  };

  const transcribe = async (clip) => {
    setBusy(true);
    setError('');
    try {
      if (!clip.file_uri) {
        const uploaded = await base44.integrations.Core.UploadPrivateFile({ file: clip.file });
        clip.file_uri = uploaded.file_uri;
        if (!clip.file_uri) throw new Error('Your recording could not be uploaded. Please retry.');
      }
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: clip.file_uri, expires_in: 600 });
      const response = await base44.functions.invoke('transcribeDictation', { file_uri: clip.file_uri, audio_url: signed_url });
      const transcript = (response.data?.transcript || '').trim();
      if (!transcript) throw new Error('No speech was picked up. Please record again, speaking closer to your microphone.');
      if (mountedRef.current) {
        handlerRef.current?.(transcript);
        clipRef.current = null;
        toast({ title: 'Words added', description: 'Check them over in the field.' });
      }
    } catch (error) {
      if (mountedRef.current) {
        const message = error?.response?.data?.error || error.message || 'The recording could not be transcribed.';
        reportFailure(`${message} Your recording is kept here; tap Retry writing to try again.`);
      }
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  };

  const stop = () => {
    const recorder = recorderRef.current;
    if (!recorder || startingRef.current) return;
    recorderRef.current = null;
    clearTimer();
    setRecording(false);
    try {
      const clip = { file: recorder.finish() };
      clipRef.current = clip;
      transcribe(clip);
    } catch (error) {
      setBusy(false);
      reportFailure(error.message);
    }
  };

  const start = async () => {
    if (recording || busy || startingRef.current) return;
    startingRef.current = true;
    setError('');
    try {
      const recorder = createDictationRecorder();
      recorderRef.current = recorder;
      if (!await recorder.start() || !mountedRef.current) return;
      clipRef.current = null;
      setRecording(true);
      setSeconds(0);
      const startedAt = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startedAt) / 1000);
        setSeconds(elapsed);
        if (elapsed >= MAX_SECONDS) stop();
      }, 500);
    } catch (error) {
      recorderRef.current?.dispose();
      recorderRef.current = null;
      if (mountedRef.current) {
        const message = error.name === 'NotAllowedError'
          ? 'Allow microphone access for this site, then click Dictate again.'
          : error.name === 'NotFoundError'
            ? 'No microphone was found. Connect a microphone and try again.'
            : error.message;
        reportFailure(message);
      }
    } finally {
      startingRef.current = false;
    }
  };

  const retry = () => {
    if (!busy && !recording && clipRef.current) transcribe(clipRef.current);
  };

  return { recording, busy, seconds, error, canRetry: !!clipRef.current, start, stop, retry };
}