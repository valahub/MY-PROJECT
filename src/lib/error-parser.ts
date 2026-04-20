// Smart Error Parser
// Maps HTTP status codes and backend error codes to user-friendly messages.
// Handles structured API error responses, validation error arrays, and plain
// Error/string values.

export interface ParsedError {
  /** Short headline for toast / dialog title */
  title: string;
  /** Full description shown below the title */
  description: string;
  /** Whether the user should be offered a retry option */
  retryable: boolean;
  /** Optional CTA label (e.g. "Sign In", "Upgrade Plan") */
  actionLabel?: string;
}

// ── HTTP status code map ────────────────────────────────────────────────────

const HTTP_MESSAGES: Record<number, ParsedError> = {
  400: {
    title: "Invalid Request",
    description: "The data you submitted is not valid. Please review and try again.",
    retryable: false,
  },
  401: {
    title: "Session Expired",
    description: "Your session has expired. Please sign in again.",
    retryable: false,
    actionLabel: "Sign In",
  },
  403: {
    title: "Access Denied",
    description: "You do not have permission to perform this action.",
    retryable: false,
  },
  404: {
    title: "Not Found",
    description: "The requested resource could not be found.",
    retryable: false,
  },
  409: {
    title: "Conflict",
    description: "This action conflicts with the current state. Please refresh and try again.",
    retryable: true,
    actionLabel: "Refresh",
  },
  422: {
    title: "Validation Error",
    description: "Some fields are invalid. Please check and correct them.",
    retryable: false,
  },
  429: {
    title: "Too Many Requests",
    description: "You are making requests too quickly. Please wait a moment.",
    retryable: true,
  },
  500: {
    title: "Server Error",
    description: "Something went wrong on our end. We are looking into it.",
    retryable: true,
  },
  502: {
    title: "Service Unavailable",
    description: "The service is temporarily unavailable. Please try again shortly.",
    retryable: true,
  },
  503: {
    title: "Service Unavailable",
    description: "The service is under maintenance. Please try again shortly.",
    retryable: true,
  },
  504: {
    title: "Request Timeout",
    description: "The server took too long to respond. Please try again.",
    retryable: true,
  },
};

// ── Backend error code map ──────────────────────────────────────────────────

const BACKEND_CODE_MESSAGES: Record<string, ParsedError> = {
  INSUFFICIENT_FUNDS: {
    title: "Insufficient Funds",
    description: "Your payment method has insufficient funds.",
    retryable: false,
    actionLabel: "Update Payment",
  },
  CARD_DECLINED: {
    title: "Card Declined",
    description: "Your card was declined. Please use a different payment method.",
    retryable: false,
    actionLabel: "Update Payment",
  },
  SUBSCRIPTION_LIMIT: {
    title: "Plan Limit Reached",
    description: "You have reached your plan limit. Upgrade to continue.",
    retryable: false,
    actionLabel: "Upgrade Plan",
  },
  LICENSE_EXPIRED: {
    title: "License Expired",
    description: "Your license has expired. Please renew to continue.",
    retryable: false,
    actionLabel: "Renew License",
  },
  DUPLICATE_ENTRY: {
    title: "Already Exists",
    description: "A record with this information already exists.",
    retryable: false,
  },
  INVALID_COUPON: {
    title: "Invalid Coupon",
    description: "This coupon code is not valid or has expired.",
    retryable: false,
  },
  NETWORK_ERROR: {
    title: "Connection Problem",
    description: "Could not reach the server. Check your internet connection.",
    retryable: true,
  },
  TIMEOUT: {
    title: "Request Timed Out",
    description: "The action took too long to complete. Please try again.",
    retryable: true,
  },
};

const DEFAULT_ERROR: ParsedError = {
  title: "Something Went Wrong",
  description: "An unexpected error occurred. Please try again.",
  retryable: true,
};

// ── Public parser ────────────────────────────────────────────────────────────

/**
 * Convert any thrown value (Error, structured API response, string, etc.)
 * into a user-friendly ParsedError.
 */
export function parseError(error: unknown): ParsedError {
  if (!error) return DEFAULT_ERROR;

  if (typeof error === "object" && error !== null) {
    const e = error as Record<string, unknown>;

    // Backend structured error with explicit code
    if (typeof e.code === "string" && BACKEND_CODE_MESSAGES[e.code]) {
      const base = BACKEND_CODE_MESSAGES[e.code];
      const description = typeof e.message === "string" ? e.message : base.description;
      return { ...base, description };
    }

    // HTTP status-based error
    if (typeof e.status === "number" && HTTP_MESSAGES[e.status]) {
      const base = HTTP_MESSAGES[e.status];
      const description = typeof e.message === "string" ? e.message : base.description;
      return { ...base, description };
    }

    // Validation errors array (e.g. Zod / express-validator style)
    if (Array.isArray(e.errors)) {
      type VE = { message?: string; field?: string };
      const msgs = (e.errors as VE[])
        .map((ve) => (ve.field ? `${ve.field}: ${ve.message}` : ve.message))
        .filter(Boolean)
        .join(", ");
      return {
        title: "Validation Error",
        description: msgs || "Some fields are invalid.",
        retryable: false,
      };
    }

    // Plain Error or object with message
    if (typeof e.message === "string") {
      const msg = e.message.toLowerCase();
      if (msg.includes("network") || msg.includes("fetch"))
        return BACKEND_CODE_MESSAGES.NETWORK_ERROR;
      if (msg.includes("timeout") || msg.includes("aborted")) return BACKEND_CODE_MESSAGES.TIMEOUT;
      return { ...DEFAULT_ERROR, description: e.message };
    }
  }

  if (typeof error === "string") {
    const lower = error.toLowerCase();
    if (lower.includes("network") || lower.includes("fetch"))
      return BACKEND_CODE_MESSAGES.NETWORK_ERROR;
    if (lower.includes("timeout") || lower.includes("abort")) return BACKEND_CODE_MESSAGES.TIMEOUT;
    return { ...DEFAULT_ERROR, description: error };
  }

  return DEFAULT_ERROR;
}
