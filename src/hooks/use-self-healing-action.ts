import { useCallback } from "react";
import { useAction, type UseActionOptions, type UseActionReturn } from "@/hooks/use-action";
import { useSelfHeal } from "@/hooks/use-self-heal";

export interface UseSelfHealingActionOptions<
  TPayload = unknown,
  TResult = unknown,
> extends UseActionOptions<TPayload, TResult> {
  stuckThresholdMs?: number;
  onStuck?: (reset: () => void) => void;
}

export function useSelfHealingAction<TPayload = unknown, TResult = unknown>(
  handler: (payload: TPayload, signal: AbortSignal) => Promise<TResult>,
  options: UseSelfHealingActionOptions<TPayload, TResult>,
): UseActionReturn<TPayload, TResult> {
  const { stuckThresholdMs = 15_000, onStuck, ...actionOptions } = options;
  const action = useAction(handler, actionOptions);

  const handleStuck = useCallback(() => {
    action.reset();
    onStuck?.(action.reset);
  }, [action.reset, onStuck]);

  useSelfHeal({
    phase: action.phase,
    stuckThresholdMs,
    onStuck: handleStuck,
  });

  return action;
}
