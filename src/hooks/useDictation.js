import { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { createDictationFile } from '@/lib/dictationAudio';

// A single dictation clip is capped at five minutes.
const MAX_SECONDS = 300;

const PREFERRED_TYPES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];

// Places a dictated passage under whatever is already in the field.
export function appendLine(current, addition) {
  const base = (current || '').trim();
  const text = (addition || '').trim();
  if (!text) return base;
  return base ? `${base}\n${text}` : text;
}

const pickMimeType = () => {
  if (typeof MediaRecorder === 'undefined') return '';
  const supported = PREFERRED_TYPES.find((type) => {
    try {
      return MediaRecorder.isTypeSupported(type);
    } catch (e) {
      return false;
    }
  });
  return supported || '';
};

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
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const handlerRef = useRef(onTranscript);
  handlerRef.current = onTranscript;

  const releaseStream = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  useEffect(
    () => () => {
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== 'inactive') {
        recorder.onstop = null;
        recorder.stop();
      }
      releaseStream();
    },
    []
  );

  const reportFailure = (message) => {
    setError(message);
    toast({ title: 'Could not write down your recording', description: message, variant: 'destructive' });
  };

  const transcribe = async (clip) => {
    setBusy(true);
    setError('');
    try {
      // Preserve the clip and its upload so a failed request can be retried.
      clip.file ||= await createDictationFile(clip.blob);
      if (!clip.file_uri) {
        const uploaded = await base44.integrations.Core.UploadPrivateFile({ file: clip.file });
        clip.file_uri = uploaded.file_uri;
      }
      const response = await base44.functions.invoke('transcribeDictation', { file_uri: clip.file_uri });
      const transcript = (response.data?.transcript || '').trim();
      if (!transcript) {
        reportFailure('No speech was picked up. Please record again, speaking closer to your microphone.');
      } else {
        handlerRef.current?.(transcript);
        clipRef.current = null;
        toast({ title: 'Words added', description: 'Check them over in the field.' });
      }
    } catch {
      reportFailure('Your recording is kept here. Tap Retry writing to try again, or record another take.');
    } finally {
      setBusy(false);
    }
  };

  const start = async () => {
    if (recording || busy || startingRef.current) return;
    setError('');
    if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      toast({
        title: 'This browser cannot record audio',
        description: 'Use the microphone key on your phone keyboard to dictate instead.',
        variant: 'destructive'
      });
      return;
    }
    startingRef.current = true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = pickMimeType();
      const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);

      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const type = recorder.mimeType || mime || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type });
        chunksRef.current = [];
        releaseStream();
        setRecording(false);
        if (blob.size) {
          const clip = { blob };
          clipRef.current = clip;
          transcribe(clip);
        } else {
          setBusy(false);
          reportFailure('No audio was captured. Please record again and check your microphone.');
        }
      };
      recorder.onerror = () => {
        recorder.onstop = null;
        if (recorder.state !== 'inactive') recorder.stop();
        releaseStream();
        setRecording(false);
        setBusy(false);
        reportFailure('The recording was interrupted. Please record another take.');
      };

      recorderRef.current = recorder;
      streamRef.current = stream;
      // Collect audio throughout the take, not only when the phone stops.
      recorder.start(1000);
      clipRef.current = null;
      setRecording(true);
      setSeconds(0);

      const startedAt = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startedAt) / 1000);
        setSeconds(elapsed);
        if (elapsed >= MAX_SECONDS && recorderRef.current && recorderRef.current.state === 'recording') {
          recorderRef.current.stop();
        }
      }, 500);
    } catch (error) {
      releaseStream();
      toast({
        title: 'Microphone blocked',
        description: 'Allow microphone access for this site, then tap the microphone again.',
        variant: 'destructive'
      });
    } finally {
      startingRef.current = false;
    }
  };

  const stop = () => {
    if (recorderRef.current && recorderRef.current.state === 'recording') {
      setBusy(true);
      recorderRef.current.stop();
    }
  };

  const retry = () => {
    if (!busy && !recording && clipRef.current) transcribe(clipRef.current);
  };

  return { recording, busy, seconds, error, canRetry: !!clipRef.current, start, stop, retry };
}