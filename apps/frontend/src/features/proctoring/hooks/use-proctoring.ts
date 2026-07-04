import { useEffect, useRef, useState, type RefObject } from "react";
import type { CheatSignal } from "@ai-interviewer/api-types";
import {
  GAZE_SAMPLE_INTERVAL_MS,
  GAZE_SOFT_WARNING_MS,
  GAZE_STRIKE_MS,
} from "../constants";
import { GazeMonitor, type GazeViolation } from "../services/gaze-monitor";

export type ProctoringStatus = "inactive" | "initializing" | "active" | "warning" | "unavailable";

export type ProctoringState = {
  status: ProctoringStatus;
  message: string | null;
};

const WARNING_MESSAGES: Record<GazeViolation, string> = {
  face_not_visible: "Keep your face visible in the camera frame.",
  looking_away: "Please look at the camera and stay focused on the interview.",
};

type UseProctoringOptions = {
  videoRef: RefObject<HTMLVideoElement | null>;
  enabled: boolean;
  cameraEnabled: boolean;
  onViolation: (signal: CheatSignal) => void;
  onSoftWarning?: (message: string) => void;
};

export function useProctoring({
  videoRef,
  enabled,
  cameraEnabled,
  onViolation,
  onSoftWarning,
}: UseProctoringOptions): ProctoringState {
  const [state, setState] = useState<ProctoringState>({
    status: "inactive",
    message: null,
  });

  const onViolationRef = useRef(onViolation);
  const onSoftWarningRef = useRef(onSoftWarning);
  const cameraStrikeSentRef = useRef(false);

  useEffect(() => {
    onViolationRef.current = onViolation;
  }, [onViolation]);

  useEffect(() => {
    onSoftWarningRef.current = onSoftWarning;
  }, [onSoftWarning]);

  useEffect(() => {
    if (!enabled) {
      cameraStrikeSentRef.current = false;
      return;
    }

    if (cameraEnabled) {
      cameraStrikeSentRef.current = false;
      return;
    }

    setState({
      status: "warning",
      message: "Camera must stay on during the interview.",
    });

    onSoftWarningRef.current?.("Camera is off. Turn it back on to avoid a proctoring violation.");

    const timerId = window.setTimeout(() => {
      if (cameraStrikeSentRef.current) return;
      cameraStrikeSentRef.current = true;
      onViolationRef.current("camera_disabled");
    }, GAZE_SOFT_WARNING_MS);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [enabled, cameraEnabled]);

  useEffect(() => {
    if (!enabled || !cameraEnabled) {
      if (!enabled) {
        setState({ status: "inactive", message: null });
      }
      return;
    }

    let cancelled = false;
    let monitor: GazeMonitor | null = null;
    let intervalId = 0;
    let violationStartedAt: number | null = null;
    let activeViolation: GazeViolation | null = null;
    let softWarningSentForEpisode = false;
    let strikeSentForEpisode = false;

    setState({ status: "initializing", message: "Starting proctoring..." });

    void (async () => {
      try {
        monitor = await GazeMonitor.create();
        if (cancelled) {
          monitor.close();
          return;
        }

        setState({ status: "active", message: null });

        const tick = () => {
          if (cancelled) return;

          const video = videoRef.current;
          if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
            return;
          }

          const analysis = monitor!.analyze(video);
          const now = Date.now();

          if ("violation" in analysis) {
            const violation = analysis.violation;

            if (activeViolation !== violation) {
              activeViolation = violation;
              violationStartedAt = now;
              softWarningSentForEpisode = false;
              strikeSentForEpisode = false;
            }

            const heldMs = violationStartedAt ? now - violationStartedAt : 0;
            const message = WARNING_MESSAGES[violation];

            if (heldMs >= GAZE_STRIKE_MS && !strikeSentForEpisode) {
              strikeSentForEpisode = true;
              onViolationRef.current(violation);
              setState({ status: "warning", message });
            } else if (heldMs >= GAZE_SOFT_WARNING_MS && !softWarningSentForEpisode) {
              softWarningSentForEpisode = true;
              onSoftWarningRef.current?.(message);
              setState({ status: "warning", message });
            } else if (heldMs >= GAZE_SOFT_WARNING_MS) {
              setState({ status: "warning", message });
            }
          } else {
            violationStartedAt = null;
            activeViolation = null;
            softWarningSentForEpisode = false;
            strikeSentForEpisode = false;
            setState({ status: "active", message: null });
          }
        };

        intervalId = window.setInterval(tick, GAZE_SAMPLE_INTERVAL_MS);
        tick();
      } catch {
        if (cancelled) return;
        setState({
          status: "unavailable",
          message: "Face monitoring could not start. Tab and window checks are still active.",
        });
      }
    })();

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      monitor?.close();
    };
  }, [enabled, cameraEnabled, videoRef]);

  return state;
}
