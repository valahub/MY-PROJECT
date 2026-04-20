// useAction — React hook wrapping the central ActionManager
//
// Exposes: current phase, loading/success/error booleans, the parsed error,
// a trigger function, a retry function, a retry countdown (seconds), and a
// manual reset helper.

import { useState, useCallback, useRef, useEffect } from "react";
import { actionManager, type ActionConfig, type ActionPhase } from "@/lib/action-manager";
import { parseError, type ParsedError } from "@/lib/error-parser";

export interface UseActionOptions<TPayload = unknown, TResult = unknown> extends ActionConfig<
  TPayload,
  TResult
> {
  /** Called once when the action succeeds */
  onSuccess?: (result: TResult, payload: TPayload) => void;
  /** Called once when the action fails (all retries exhausted) */
  onError?: (error: unknown, payload: TPayload) => void;
  /** Called as soon as the action is triggered */
  onStart?: (payload: TPayload) => void;
}

export interface UseActionReturn<TPayload = unknown, TResult = unknown> {
  phase: ActionPhase;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  isIdle: boolean;
  error: unknown;
  parsedError: ParsedError | null;
  /** Remaining seconds until the next automatic retry attempt */
  retryCountdown: number;
  /** Trigger the action with a fresh payload */
  trigger: (payload: TPayload) => Promise<TResult | undefined>;
  /** Re-trigger with the last used payload (no-op if never triggered) */
  retry: () => Promise<TResult | undefined>;
  /** Force-reset to idle */
  reset: () => void;
}

export function useAction<TPayload = unknown, TResult = unknown>(
  handler: (payload: TPayload, signal: AbortSignal) => Promise<TResult>,
  options: UseActionOptions<TPayload, TResult>,
): UseActionReturn<TPayload, TResult> {
  const [phase, setPhase] = useState<ActionPhase>("idle");
  const [error, setError] = useState<unknown>(null);
  const [retryCountdown, setRetryCountdown] = useState(0);

  const lastPayloadRef = useRef<TPayload | undefined>(undefined);
  // Keep callbacks in refs so they never cause stale-closure issues
  const onSuccessRef = useRef(options.onSuccess);
  const onErrorRef = useRef(options.onError);
  const onStartRef = useRef(options.onStart);
  onSuccessRef.current = options.onSuccess;
  onErrorRef.current = options.onError;
  onStartRef.current = options.onStart;

  // Subscribe to actionManager events for this action id
  useEffect(() => {
    const unsub = actionManager.subscribe((entry) => {
      if (entry.actionId !== options.id) return;
      setPhase(entry.phase);
      if (entry.phase === "error") {
        setError(entry.error ?? "Unknown error");
      } else if (entry.phase === "success") {
        setError(null);
      }
    });
    return unsub;
  }, [options.id]);

  // Start a visual countdown (seconds) so the UI can show "Retrying in Xs…"
  const startRetryCountdown = useCallback((backoffMs: number): void => {
    const seconds = Math.ceil(backoffMs / 1_000);
    setRetryCountdown(seconds);
    const iv = setInterval(() => {
      setRetryCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(iv);
          return 0;
        }
        return prev - 1;
      });
    }, 1_000);
  }, []);

  const trigger = useCallback(
    async (payload: TPayload): Promise<TResult | undefined> => {
      lastPayloadRef.current = payload;
      setError(null);
      onStartRef.current?.(payload);

      // Wrap the handler to intercept per-attempt backoff for UI countdown
      let attempt = 0;
      const wrappedHandler = async (p: TPayload, signal: AbortSignal): Promise<TResult> => {
        attempt++;
        if (attempt > 1) {
          const raw = options.retry?.backoffMs ?? 1_000;
          const backoff = typeof raw === "function" ? raw(attempt - 1) : raw * (attempt - 1);
          if (backoff > 0) startRetryCountdown(backoff);
        }
        return handler(p, signal);
      };

      try {
        const result = await actionManager.execute<TPayload, TResult>(
          options,
          wrappedHandler,
          payload,
        );
        if (result !== undefined) onSuccessRef.current?.(result, payload);
        return result;
      } catch (err) {
        setError(err);
        onErrorRef.current?.(err, payload);
        return undefined;
      }
    },
    // handler and options are stable references expected from the caller
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [handler, options.id, startRetryCountdown],
  );

  const retry = useCallback((): Promise<TResult | undefined> => {
    if (lastPayloadRef.current !== undefined) {
      return trigger(lastPayloadRef.current);
    }
    return Promise.resolve(undefined);
  }, [trigger]);

  const reset = useCallback((): void => {
    actionManager.reset(options.id);
    setPhase("idle");
    setError(null);
    setRetryCountdown(0);
  }, [options.id]);

  return {
    phase,
    isLoading: phase === "loading",
    isSuccess: phase === "success",
    isError: phase === "error",
    isIdle: phase === "idle",
    error,
    parsedError: error ? parseError(error) : null,
    retryCountdown,
    trigger,
    retry,
    reset,
  };
}
