// ActionButton — a Button wrapper that reflects the four action phases
// (idle / loading / success / error) and optionally shows a retry countdown
// or a disabled-reason tooltip.
//
// Drop-in replacement for <Button> in any form or action trigger.

import * as React from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActionPhase } from "@/lib/action-manager";

export interface ActionButtonProps extends ButtonProps {
  /** Current action phase (default: "idle") */
  phase?: ActionPhase;
  /** Remaining retry countdown in seconds — shown inside the button while loading */
  retryCountdown?: number;
  /**
   * When set the button is disabled and this message is shown in a tooltip.
   * Use this for dependency-check or permission-guard results.
   */
  disabledReason?: string;
  /** Content to render in the loading state (overrides default spinner text) */
  loadingLabel?: React.ReactNode;
  /** Content to render in the success state */
  successLabel?: React.ReactNode;
  /** Content to render in the error state */
  errorLabel?: React.ReactNode;
}

export const ActionButton = React.forwardRef<HTMLButtonElement, ActionButtonProps>(
  (
    {
      phase = "idle",
      retryCountdown = 0,
      disabledReason,
      loadingLabel,
      successLabel,
      errorLabel,
      children,
      disabled,
      className,
      variant,
      ...rest
    },
    ref,
  ) => {
    const isLoading = phase === "loading";
    const isSuccess = phase === "success";
    const isError = phase === "error";
    const isDisabled = disabled || isLoading || !!disabledReason;

    // ── Inner content per phase ──────────────────────────────────────────────
    const content: React.ReactNode = (() => {
      if (isLoading) {
        if (loadingLabel) return loadingLabel;
        return retryCountdown > 0 ? (
          <>
            <RefreshCw className="h-4 w-4 animate-spin" />
            Retrying in {retryCountdown}s…
          </>
        ) : (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </>
        );
      }
      if (isSuccess) {
        return (
          successLabel ?? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Done
            </>
          )
        );
      }
      if (isError) {
        return (
          errorLabel ?? (
            <>
              <AlertCircle className="h-4 w-4" />
              Failed
            </>
          )
        );
      }
      return children;
    })();

    // ── Variant override per phase ───────────────────────────────────────────
    const resolvedVariant = isSuccess ? (variant ?? "default") : isError ? "destructive" : variant;

    const button = (
      <Button
        ref={ref}
        {...rest}
        variant={resolvedVariant}
        disabled={isDisabled}
        aria-busy={isLoading}
        aria-label={
          isLoading
            ? retryCountdown > 0
              ? `Retrying in ${retryCountdown} seconds`
              : "Loading"
            : isSuccess
              ? "Completed successfully"
              : isError
                ? "Action failed"
                : undefined
        }
        className={cn(
          isSuccess && "bg-emerald-600 hover:bg-emerald-700 text-white border-0",
          className,
        )}
      >
        {content}
      </Button>
    );

    // Wrap in a tooltip when a disabled reason is provided
    if (disabledReason) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {/* span needed so tooltip works on a disabled button */}
              <span className="inline-flex">{button}</span>
            </TooltipTrigger>
            <TooltipContent side="top">{disabledReason}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return button;
  },
);

ActionButton.displayName = "ActionButton";
