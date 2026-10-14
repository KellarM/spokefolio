import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Mic, Square } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';

// A single dictation clip is capped at five minutes.
const MAX_SECONDS = 300;

const PREFERRED_TYPES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];

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

export default function VoiceDictation({ onTranscript }) {
  const { toast } = useToast();
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [busy, setBusy] = useState(false);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);

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
        onTranscript(transcript);
        toast({ title: 'Words added', description: 'Check them over, then capture the entry.' });
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

  const clock = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-border/70 bg-secondary/40 px-4 py-3">
      {recording ? (
        <Button onClick={stop} className="rounded-full">
          <Square className="mr-2 h-3.5 w-3.5" /> Stop and write it in
        </Button>
      ) : (
        <Button variant="secondary" className="rounded-full" onClick={start} disabled={busy}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mic className="mr-2 h-4 w-4" />}
          {busy ? 'Writing your words…' : seconds ? 'Record another take' : 'Dictate with your voice'}
        </Button>
      )}

      {recording && (
        <span className="flex items-center gap-2 text-[12.5px] text-foreground/80">
          <span className="h-2 w-2 animate-pulse rounded-full bg-destructive" />
          Recording {clock}
        </span>
      )}

      {!recording && !busy && (
        <span className="text-[11.5px] text-muted-foreground">
          Tap, talk through the role, then stop — your words land in the box above.
        </span>
      )}
    </div>
  );
}