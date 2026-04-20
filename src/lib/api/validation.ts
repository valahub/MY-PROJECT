// Request body/query validation helpers using Zod
import * as z from "zod";
import type { ZodTypeAny } from "zod";
import { badRequest } from "./response";
import type { PaginationMeta } from "./types";

export async function parseBody<S extends ZodTypeAny>(
  request: Request,
  schema: S,
): Promise<{ data: z.output<S>; error?: undefined } | { data?: undefined; error: Response }> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { error: badRequest("Request body must be valid JSON") };
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    return { error: badRequest("Validation failed", result.error.flatten()) };
  }
  return { data: result.data as z.output<S> };
}

export function parseSearchParams<S extends ZodTypeAny>(
  url: URL,
  schema: S,
): { data: z.output<S>; error?: undefined } | { data?: undefined; error: Response } {
  const params = Object.fromEntries(url.searchParams);
  const result = schema.safeParse(params);
  if (!result.success) {
    return { error: badRequest("Invalid query parameters", result.error.flatten()) };
  }
  return { data: result.data as z.output<S> };
}

export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export function paginate<T>(
  items: T[],
  page: number,
  limit: number,
): { data: T[]; meta: PaginationMeta } {
  const total = items.length;
  const data = items.slice((page - 1) * limit, page * limit);
  return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}
