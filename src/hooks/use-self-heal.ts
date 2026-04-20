// useSelfHeal — watchdog that detects a stuck loading phase and triggers recovery
//
// If the tracked `phase` remains equal to `stuckPhase` for longer than
// `stuckThresholdMs`, the `onStuck` callback is called.  This lets the UI
// reset the action state, refetch data, or show a helpful error message.

import { useEffect, useRef, useCallback } from "react";

export interface UseSelfHealOptions {
  /** The phase value to monitor (string comparison) */
  phase: string;
  /** The phase value considered "stuck" (default: "loading") */
  stuckPhase?: string;
  /** Milliseconds before the watchdog fires (default: 15 000) */
  stuckThresholdMs?: number;
  /** Called when a stuck state is detected */
  onStuck: () => void;
}

export function useSelfHeal(options: UseSelfHealOptions): void {
  const { phase, stuckPhase = "loading", stuckThresholdMs = 15_000, onStuck } = options;

  // Keep onStuck in a ref so changing the callback doesn't restart the timer
  const onStuckRef = useRef(onStuck);
  onStuckRef.current = onStuck;

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback((): void => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    clearTimer();

    if (phase === stuckPhase) {
      timerRef.current = setTimeout(() => {
        console.warn(
          `[SelfHeal] Phase "${stuckPhase}" stuck for ${stuckThresholdMs}ms — triggering recovery`,
        );
        onStuckRef.current();
      }, stuckThresholdMs);
    }

    return clearTimer;
  }, [phase, stuckPhase, stuckThresholdMs, clearTimer]);
}
