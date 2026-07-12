import { useEffect, useRef } from "react";

export function useInterviewRecording(mediaStream: MediaStream | null, enabled: boolean) {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (!enabled || !mediaStream) return;

    chunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
      ? "video/webm;codecs=vp9,opus"
      : MediaRecorder.isTypeSupported("video/webm")
        ? "video/webm"
        : "";

    const recorder = mimeType
      ? new MediaRecorder(mediaStream, { mimeType })
      : new MediaRecorder(mediaStream);

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };

    recorder.start(1_000);
    recorderRef.current = recorder;

    return () => {
      if (recorder.state !== "inactive") {
        recorder.stop();
      }
      recorderRef.current = null;
    };
  }, [enabled, mediaStream]);

  async function stopAndGetBlob(): Promise<Blob | null> {
    const recorder = recorderRef.current;
    if (!recorder) return null;

    if (recorder.state === "inactive") {
      return chunksRef.current.length > 0 ? new Blob(chunksRef.current, { type: recorder.mimeType }) : null;
    }

    return new Promise((resolve) => {
      recorder.addEventListener(
        "stop",
        () => {
          resolve(
            chunksRef.current.length > 0 ? new Blob(chunksRef.current, { type: recorder.mimeType }) : null,
          );
        },
        { once: true },
      );
      recorder.stop();
    });
  }

  return { stopAndGetBlob };
}
