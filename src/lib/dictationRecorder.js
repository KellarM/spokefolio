import { createDictationFile } from '@/lib/dictationAudio';

// Capture mono PCM while the microphone is open, rather than decoding after Stop.
// options.onLevel, when provided, receives the peak level of every audio frame:
// Voice Mode uses it to detect when a person has finished speaking.
export function createDictationRecorder(options = {}) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext || !navigator.mediaDevices?.getUserMedia) {
    throw new Error('This browser cannot record audio. Please use a current version of Chrome, Edge, or Safari.');
  }
  const context = new AudioContext();
  let stream;
  let source;
  let processor;
  let silence;
  let disposed = false;
  let frameCount = 0;
  let chunks = [];
  const onLevel = typeof options.onLevel === 'function' ? options.onLevel : null;
  const dispose = () => {
    disposed = true;
    if (processor) processor.onaudioprocess = null;
    source?.disconnect();
    processor?.disconnect();
    silence?.disconnect();
    stream?.getTracks().forEach(track => track.stop());
    chunks = [];
    if (context.state !== 'closed') context.close().catch(() => {});
  };
  return {
    async start() {
      // Resume synchronously from the button gesture, before the permission prompt.
      const resumed = context.resume();
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true }
        });
        await resumed;
        if (disposed) {
          stream.getTracks().forEach(track => track.stop());
          return false;
        }
        if (context.state !== 'running') throw new Error('Audio capture is paused by your browser. Click Dictate again to enable it.');
        source = context.createMediaStreamSource(stream);
        processor = context.createScriptProcessor(4096, 1, 1);
        silence = context.createGain();
        silence.gain.value = 0;
        processor.onaudioprocess = event => {
          const input = event.inputBuffer.getChannelData(0);
          const available = Math.min(input.length, Math.max(0, context.sampleRate * 300 - frameCount));
          if (available) {
            chunks.push(new Float32Array(input.subarray(0, available)));
            frameCount += available;
          }
          if (onLevel && !disposed) {
            let peak = 0;
            for (let index = 0; index < input.length; index++) {
              const level = Math.abs(input[index]);
              if (level > peak) peak = level;
            }
            onLevel(peak);
          }
          event.outputBuffer.getChannelData(0).fill(0);
        };
        source.connect(processor);
        processor.connect(silence);
        silence.connect(context.destination);
        return true;
      } catch (error) {
        await resumed.catch(() => {});
        dispose();
        throw error;
      }
    },
    finish() {
      try { return createDictationFile(chunks, context.sampleRate); }
      finally { dispose(); }
    },
    dispose
  };
}