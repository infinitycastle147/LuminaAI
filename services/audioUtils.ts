
/**
 * Global constants for audio processing
 */
export const GEMINI_TTS_SAMPLE_RATE = 24000;

let sharedAudioCtx: AudioContext | null = null;
const getAudioCtx = async () => {
  if (!sharedAudioCtx) {
    sharedAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  
  // Browsers often suspend AudioContext if it wasn't started via a direct user gesture.
  // We resume it here to ensure decodeAudioData doesn't hang.
  if (sharedAudioCtx.state === 'suspended') {
    await sharedAudioCtx.resume();
  }
  
  return sharedAudioCtx;
};

/**
 * Converts a base64 string to a Uint8Array
 */
const base64ToUint8Array = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

/**
 * Wraps raw PCM data in a WAV container.
 */
export const pcmToWavBlob = (base64Pcm: string, sampleRate = GEMINI_TTS_SAMPLE_RATE): Blob => {
  const pcmData = base64ToUint8Array(base64Pcm);
  const numChannels = 1;
  const bitsPerSample = 16;
  const headerSize = 44;
  
  const buffer = new ArrayBuffer(headerSize + pcmData.length);
  const view = new DataView(buffer);

  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + pcmData.length, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, 'data');
  view.setUint32(40, pcmData.length, true);

  const uint8View = new Uint8Array(buffer, headerSize);
  uint8View.set(pcmData);

  return new Blob([buffer], { type: 'audio/wav' });
};

/**
 * Gets the duration of an audio blob using AudioContext decoding for efficiency.
 */
export const getAudioDuration = async (blob: Blob): Promise<number> => {
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const audioCtx = await getAudioCtx();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    return audioBuffer.duration;
  } catch (err) {
    console.error("Failed to decode audio data", err);
    return 5; // Safe fallback duration
  }
};
