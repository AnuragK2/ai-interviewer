const TARGET_SAMPLE_RATE = 24000;

function floatTo16BitPCM(float32: Float32Array) {
  const buffer = new ArrayBuffer(float32.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < float32.length; i++) {
    const sample = Math.max(-1, Math.min(1, float32[i] ?? 0));
    view.setInt16(i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }
  return buffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i] ?? 0);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function downsampleBuffer(buffer: Float32Array, inputSampleRate: number, outputSampleRate: number) {
  if (inputSampleRate === outputSampleRate) return buffer;
  const ratio = inputSampleRate / outputSampleRate;
  const newLength = Math.round(buffer.length / ratio);
  const result = new Float32Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;

  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
    let accum = 0;
    let count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i] ?? 0;
      count += 1;
    }
    result[offsetResult] = accum / (count || 1);
    offsetResult += 1;
    offsetBuffer = nextOffsetBuffer;
  }

  return result;
}

export function createMicStreamer(mediaStream: MediaStream, onAudio: (base64Pcm16: string) => void) {
  const audioContext = new AudioContext();
  const source = audioContext.createMediaStreamSource(mediaStream);
  const processor = audioContext.createScriptProcessor(4096, 1, 1);

  processor.onaudioprocess = (event) => {
    const input = event.inputBuffer.getChannelData(0);
    const downsampled = downsampleBuffer(input, audioContext.sampleRate, TARGET_SAMPLE_RATE);
    const pcm = floatTo16BitPCM(downsampled);
    onAudio(arrayBufferToBase64(pcm));
  };

  // Keep the processor in the graph without playing mic audio locally.
  const silentGain = audioContext.createGain();
  silentGain.gain.value = 0;
  source.connect(processor);
  processor.connect(silentGain);
  silentGain.connect(audioContext.destination);

  return {
    async resume() {
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }
    },
    stop() {
      processor.disconnect();
      source.disconnect();
      void audioContext.close();
    },
  };
}

export function createAudioPlayer() {
  const audioContext = new AudioContext({ sampleRate: TARGET_SAMPLE_RATE });
  let nextPlayTime = 0;

  return {
    async resume() {
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }
    },
    playPcm16Base64(base64: string) {
      const pcm = new Int16Array(base64ToArrayBuffer(base64));
      const float32 = new Float32Array(pcm.length);
      for (let i = 0; i < pcm.length; i++) {
        float32[i] = (pcm[i] ?? 0) / 0x8000;
      }

      const buffer = audioContext.createBuffer(1, float32.length, TARGET_SAMPLE_RATE);
      buffer.copyToChannel(float32, 0);

      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);

      const startAt = Math.max(audioContext.currentTime, nextPlayTime);
      source.start(startAt);
      nextPlayTime = startAt + buffer.duration;
    },
    stop() {
      nextPlayTime = 0;
      void audioContext.close();
    },
  };
}
