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
 * Wraps raw PCM data in a WAV container to make it playable by browser <audio> tags.
 * Assumes 24kHz, 16-bit, Mono (standard Gemini TTS output).
 */
export const pcmToWavBlob = (base64Pcm: string, sampleRate = 24000): Blob => {
  const pcmData = base64ToUint8Array(base64Pcm);
  
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmData.length;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');

  // fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true); // NumChannels
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, byteRate, true); // ByteRate
  view.setUint16(32, blockAlign, true); // BlockAlign
  view.setUint16(34, bitsPerSample, true); // BitsPerSample

  // data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Write PCM data
  const uint8View = new Uint8Array(buffer, 44);
  uint8View.set(pcmData);

  return new Blob([buffer], { type: 'audio/wav' });
};

const writeString = (view: DataView, offset: number, string: string) => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};

/**
 * Gets the duration of an audio blob
 */
export const getAudioDuration = async (blob: Blob): Promise<number> => {
  return new Promise((resolve, reject) => {
    const audio = document.createElement('audio');
    audio.src = URL.createObjectURL(blob);
    audio.onloadedmetadata = () => {
      // In some browsers, duration might be Infinity for streams, but for blobs it should be accurate.
      // However, sometimes it requires a small seek or waiting for 'durationchange'.
      if (audio.duration === Infinity || isNaN(audio.duration)) {
         audio.currentTime = 1e10; // Seek to end
         audio.ontimeupdate = () => {
            audio.ontimeupdate = null;
            resolve(audio.duration);
         };
      } else {
        resolve(audio.duration);
      }
    };
    audio.onerror = () => reject("Failed to load audio for duration");
  });
};
