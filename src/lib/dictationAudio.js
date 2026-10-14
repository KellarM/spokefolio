// Encode microphone samples directly: no WebM decoder or unfinished container.
export function createDictationFile(chunks, sourceRate) {
  const inputLength = chunks.reduce((length, chunk) => length + chunk.length, 0);
  if (!inputLength || !Number.isFinite(sourceRate) || sourceRate <= 0) {
    throw new Error('The microphone did not capture audio. Check your microphone and record again.');
  }
  const input = new Float32Array(inputLength);
  let offset = 0;
  let peak = 0;
  for (const chunk of chunks) {
    input.set(chunk, offset);
    offset += chunk.length;
    for (const sample of chunk) peak = Math.max(peak, Math.abs(sample));
  }
  if (peak < 0.0001) throw new Error('Your microphone recorded silence. Check that the correct microphone is selected and not muted.');
  const sampleRate = 16000;
  const length = Math.floor(Math.min(inputLength / sourceRate, 300) * sampleRate);
  if (!length) throw new Error('That recording was too short. Please speak before stopping.');
  const buffer = new ArrayBuffer(44 + length * 2);
  const view = new DataView(buffer);
  const text = (start, value) => [...value].forEach((char, index) => view.setUint8(start + index, char.charCodeAt(0)));
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
  view.setUint32(40, length * 2, true);
  const ratio = sourceRate / sampleRate;
  for (let index = 0; index < length; index++) {
    const start = Math.floor(index * ratio);
    const end = Math.min(inputLength, Math.max(start + 1, Math.floor((index + 1) * ratio)));
    let sum = 0;
    for (let frame = start; frame < end; frame++) sum += input[frame];
    const sample = Math.max(-1, Math.min(1, sum / (end - start)));
    view.setInt16(44 + index * 2, Math.round(sample * (sample < 0 ? 32768 : 32767)), true);
  }
  return new File([buffer], 'dictation.wav', { type: 'audio/wav' });
}