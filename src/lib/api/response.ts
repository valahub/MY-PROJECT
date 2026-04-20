// Standard HTTP response builders — all return a Web-standard Response
import type { ApiResponse, PaginationMeta } from "./types";

const JSON_HEADERS = { "Content-Type": "application/json" };

export function ok<T>(data: T, meta?: PaginationMeta): Response {
  const body: ApiResponse<T> = { success: true, data, ...(meta ? { meta } : {}) };
  return Response.json(body, { status: 200, headers: JSON_HEADERS });
}

export function created<T>(data: T): Response {
  const body: ApiResponse<T> = { success: true, data };
  return Response.json(body, { status: 201, headers: JSON_HEADERS });
}

export function noContent(): Response {
  return new Response(null, { status: 204 });
}

export function badRequest(message: string, details?: unknown): Response {
  const body: ApiResponse = {
    success: false,
    error: { code: "BAD_REQUEST", message, details },
  };
  return Response.json(body, { status: 400, headers: JSON_HEADERS });
}

export function unauthorized(message = "Unauthorized"): Response {
  const body: ApiResponse = {
    success: false,
    error: { code: "UNAUTHORIZED", message },
  };
  return Response.json(body, { status: 401, headers: JSON_HEADERS });
}

export function forbidden(message = "Forbidden"): Response {
  const body: ApiResponse = {
    success: false,
    error: { code: "FORBIDDEN", message },
  };
  return Response.json(body, { status: 403, headers: JSON_HEADERS });
}

export function notFound(resource = "Resource"): Response {
  const body: ApiResponse = {
    success: false,
    error: { code: "NOT_FOUND", message: `${resource} not found` },
  };
  return Response.json(body, { status: 404, headers: JSON_HEADERS });
}

export function conflict(message: string): Response {
  const body: ApiResponse = {
    success: false,
    error: { code: "CONFLICT", message },
  };
  return Response.json(body, { status: 409, headers: JSON_HEADERS });
}

export function tooManyRequests(retryAfter?: number): Response {
  const headers: Record<string, string> = { ...JSON_HEADERS };
  if (retryAfter) headers["Retry-After"] = String(retryAfter);
  const body: ApiResponse = {
    success: false,
    error: { code: "RATE_LIMITED", message: "Too many requests" },
  };
  return new Response(JSON.stringify(body), { status: 429, headers });
}

export function internalError(message = "Internal server error"): Response {
  const body: ApiResponse = {
    success: false,
    error: { code: "INTERNAL_ERROR", message },
  };
  return Response.json(body, { status: 500, headers: JSON_HEADERS });
}

export function methodNotAllowed(): Response {
  const body: ApiResponse = {
    success: false,
    error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed" },
  };
  return Response.json(body, { status: 405, headers: JSON_HEADERS });
}
