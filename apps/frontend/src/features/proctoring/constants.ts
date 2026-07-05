/** Show on-screen / toast hint after this long (no strike yet). */
export const GAZE_SOFT_WARNING_MS = 3_000;

/** Record a proctoring strike after this long. */
export const GAZE_STRIKE_MS = 30_000;

/** How often to run face detection (ms). */
export const GAZE_SAMPLE_INTERVAL_MS = 250;

/** Brief face-detection misses to ignore before counting a violation (~1s). */
export const FACE_MISS_DEBOUNCE_SAMPLES = 4;
