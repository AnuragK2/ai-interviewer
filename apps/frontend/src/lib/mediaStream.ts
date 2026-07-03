export function stopMediaStream(stream: MediaStream | null | undefined) {
  if (!stream) return;

  stream.getTracks().forEach((track) => {
    track.stop();
  });
}
