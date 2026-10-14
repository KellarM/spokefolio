// Give transcription one consistent format, regardless of the phone's recorder.
export async function createDictationFile(blob) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const OfflineAudioContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const context = new AudioContext();
  let decoded;
  try {
    decoded = await context.decodeAudioData(await blob.arrayBuffer());
  } finally {
    await context.close();
  }
  const sampleRate = 16000;
  const length = Math.ceil(Math.min(decoded.duration, 300) * sampleRate);
  if (!length) throw new Error('No audio was captured. Please record again.');
  const offline = new OfflineAudioContext(1, length, sampleRate);
  const source = offline.createBufferSource();
  source.buffer = decoded;
  source.connect(offline.destination);
  source.start();
  const samples = (await offline.startRendering()).getChannelData(0);
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const text = (offset, value) => [...value].forEach((char, index) => view.setUint8(offset + index, char.charCodeAt(0)));
  text(0, 'RIFF');
  view.setUint32(4, buffer.byteLength - 8, true);
  text(8, 'WAVE');
  text(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  text(36, 'data');
  view.setUint32(40, samples.length * 2, true);
  samples.forEach((sample, index) => {
    const value = Math.max(-1, Math.min(1, sample));
    view.setInt16(44 + index * 2, value * (value < 0 ? 32768 : 32767), true);
  });
  return new File([buffer], 'dictation.wav', { type: 'audio/wav' });
}