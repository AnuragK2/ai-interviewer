import { FaceLandmarker, FilesetResolver, type NormalizedLandmark } from "@mediapipe/tasks-vision";

const WASM_CDN = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

const YAW_THRESHOLD = 0.32;
const PITCH_UP_THRESHOLD = 0.35;
const PITCH_DOWN_THRESHOLD = 0.72;

/** Minimum face bounding-box size (normalized 0–1). Lower = accept smaller / farther faces. */
const MIN_FACE_SIZE = 0.07;
/** Allowed face-center range; wider = less picky about framing. */
const CENTER_X_MIN = 0.1;
const CENTER_X_MAX = 0.9;
const CENTER_Y_MIN = 0.08;
const CENTER_Y_MAX = 0.92;

export type GazeViolation = "face_not_visible" | "looking_away";

export type GazeAnalysis =
  | { ok: true }
  | { violation: GazeViolation; detail?: string };

function isFaceWellFramed(landmarks: NormalizedLandmark[]): boolean {
  let minX = 1;
  let maxX = 0;
  let minY = 1;
  let maxY = 0;

  for (const landmark of landmarks) {
    minX = Math.min(minX, landmark.x);
    maxX = Math.max(maxX, landmark.x);
    minY = Math.min(minY, landmark.y);
    maxY = Math.max(maxY, landmark.y);
  }

  const width = maxX - minX;
  const height = maxY - minY;
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  if (width < MIN_FACE_SIZE || height < MIN_FACE_SIZE) return false;
  if (
    centerX < CENTER_X_MIN ||
    centerX > CENTER_X_MAX ||
    centerY < CENTER_Y_MIN ||
    centerY > CENTER_Y_MAX
  ) {
    return false;
  }

  return true;
}

function analyzeLandmarks(landmarks: NormalizedLandmark[]): GazeAnalysis {
  if (!isFaceWellFramed(landmarks)) {
    return { violation: "face_not_visible", detail: "out_of_frame" };
  }

  const nose = landmarks[1];
  const leftEye = landmarks[33];
  const rightEye = landmarks[263];
  const chin = landmarks[152];

  if (!nose || !leftEye || !rightEye || !chin) {
    return { violation: "face_not_visible" };
  }

  const eyeMidX = (leftEye.x + rightEye.x) / 2;
  const eyeMidY = (leftEye.y + rightEye.y) / 2;
  const eyeSpan =
    Math.hypot(rightEye.x - leftEye.x, rightEye.y - leftEye.y) || 0.001;

  const yawRatio = (nose.x - eyeMidX) / eyeSpan;
  const faceHeight = chin.y - eyeMidY || 0.001;
  const pitchRatio = (nose.y - eyeMidY) / faceHeight;

  if (Math.abs(yawRatio) > YAW_THRESHOLD) {
    return {
      violation: "looking_away",
      detail: yawRatio > 0 ? "right" : "left",
    };
  }

  if (pitchRatio < PITCH_UP_THRESHOLD) {
    return { violation: "looking_away", detail: "up" };
  }

  if (pitchRatio > PITCH_DOWN_THRESHOLD) {
    return { violation: "looking_away", detail: "down" };
  }

  return { ok: true };
}

async function createLandmarker(delegate: "GPU" | "CPU") {
  const vision = await FilesetResolver.forVisionTasks(WASM_CDN);
  return FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: MODEL_URL,
      delegate,
    },
    runningMode: "VIDEO",
    numFaces: 1,
    minFaceDetectionConfidence: 0.35,
    minFacePresenceConfidence: 0.35,
    minTrackingConfidence: 0.35,
  });
}

export class GazeMonitor {
  private landmarker: FaceLandmarker | null = null;
  private lastTimestampMs = 0;

  static async create() {
    let landmarker: FaceLandmarker;
    try {
      landmarker = await createLandmarker("GPU");
    } catch {
      landmarker = await createLandmarker("CPU");
    }

    const monitor = new GazeMonitor();
    monitor.landmarker = landmarker;
    return monitor;
  }

  analyze(video: HTMLVideoElement): GazeAnalysis {
    if (!this.landmarker || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      return { violation: "face_not_visible" };
    }

    const timestampMs = Math.max(this.lastTimestampMs + 1, video.currentTime * 1000);
    this.lastTimestampMs = timestampMs;

    const results = this.landmarker.detectForVideo(video, timestampMs);
    const landmarks = results.faceLandmarks?.[0];

    if (!landmarks?.length) {
      return { violation: "face_not_visible" };
    }

    return analyzeLandmarks(landmarks);
  }

  close() {
    this.landmarker?.close();
    this.landmarker = null;
  }
}
