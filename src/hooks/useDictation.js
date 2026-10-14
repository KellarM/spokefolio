import { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';

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

const extensionFor = (mime) => {
  if (mime.includes('mp4')) return 'm4a';
  if (mime.includes('ogg')) return 'ogg';
  return 'webm';
};

// Records one clip, has it transcribed by the app, and hands the words back.
export default function useDictation(onTranscript) {
  const { toast } = useToast();
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [seconds, setSeconds] = useState(0);
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

  const transcribe = async (blob, mime) => {
    setBusy(true);
    try {
      const file = new File([blob], `dictation.${extensionFor(mime)}`, { type: mime || 'audio/webm' });
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      const response = await base44.functions.invoke('transcribeDictation', { file_uri });
      const transcript = (response.data?.transcript || '').trim();
      if (!transcript) {
        toast({ title: 'Nothing was picked up', description: 'Try again, speaking a little closer to the phone.', variant: 'destructive' });
      } else {
        handlerRef.current?.(transcript);
        toast({ title: 'Words added', description: 'Check them over in the field.' });
      }
    } catch (error) {
      toast({
        title: 'Voice capture failed',
        description: error?.response?.data?.error || error.message,
        variant: 'destructive'
      });
    }
    setBusy(false);
  };

  const start = async () => {
    if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      toast({
        title: 'This browser cannot record audio',
        description: 'Use the microphone key on your phone keyboard to dictate instead.',
        variant: 'destructive'
      });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
        if (blob.size) transcribe(blob, type);
      };

      recorderRef.current = recorder;
      streamRef.current = stream;
      recorder.start();
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
    }
  };

  const stop = () => {
    if (recorderRef.current && recorderRef.current.state === 'recording') recorderRef.current.stop();
  };

  return { recording, busy, seconds, start, stop };
}