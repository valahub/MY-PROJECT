import { getApiPermissionsForRole, type ApiRolePermission, type ApiUserRole } from "./permissions";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

const ACCESS_TOKEN_KEY = "erp-vala.api.access-token.v1";
const REFRESH_TOKEN_KEY = "erp-vala.api.refresh-token.v1";
const USER_KEY = "erp-vala.api.user.v1";

export interface ApiUser {
  id: string;
  email: string;
  name?: string;
  role: ApiUserRole;
}

export interface ApiAuthState {
  accessToken: string;
  refreshToken: string;
  user: ApiUser;
  permissions: ApiRolePermission[];
}

interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ApiFailure {
  success: false;
  error: {
    code: string;
    message: string;
    details?: {
      fieldErrors?: Record<string, string[]>;
      formErrors?: string[];
    };
  };
}

type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure;

export class ApiClientError extends Error {
  status: number;
  code?: string;
  fieldErrors: Record<string, string[]>;

  constructor(
    message: string,
    status: number,
    options: { code?: string; fieldErrors?: Record<string, string[]> } = {},
  ) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = options.code;
    this.fieldErrors = options.fieldErrors ?? {};
  }
}

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function readPersistedAuth(): ApiAuthState | null {
  if (!canUseStorage()) return null;
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  const user = safeJsonParse<ApiUser>(localStorage.getItem(USER_KEY));
  if (!accessToken || !refreshToken || !user) return null;
  return {
    accessToken,
    refreshToken,
    user,
    permissions: getApiPermissionsForRole(user.role),
  };
}

let authState: ApiAuthState | null = readPersistedAuth();
const authListeners = new Set<() => void>();

function notifyAuthListeners(): void {
  authListeners.forEach((listener) => listener());
}

function writeAuthState(next: ApiAuthState | null): void {
  authState = next;
  if (canUseStorage()) {
    if (!next) {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } else {
      localStorage.setItem(ACCESS_TOKEN_KEY, next.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, next.refreshToken);
      localStorage.setItem(USER_KEY, JSON.stringify(next.user));
    }
  }
  notifyAuthListeners();
}

function endpoint(path: string): string {
  return `${API_BASE_URL}${path}`;
}

async function parseEnvelope<T>(response: Response): Promise<ApiEnvelope<T> | null> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as ApiEnvelope<T>;
  } catch {
    return null;
  }
}

async function refreshToken(): Promise<boolean> {
  const current = authState;
  if (!current?.refreshToken) return false;

  const response = await fetch(endpoint("/api/v1/auth/refresh"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ refreshToken: current.refreshToken }),
  });
  const envelope = await parseEnvelope<{ accessToken: string; refreshToken: string }>(response);
  if (!response.ok || !envelope || !envelope.success) {
    writeAuthState(null);
    return false;
  }

  writeAuthState({
    ...current,
    accessToken: envelope.data.accessToken,
    refreshToken: envelope.data.refreshToken,
  });
  return true;
}

interface RequestOptions extends RequestInit {
  auth?: boolean;
  retryOnUnauthorized?: boolean;
  idempotencyKey?: string;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const {
    auth = true,
    retryOnUnauthorized = true,
    headers,
    body,
    idempotencyKey,
    ...init
  } = options;
  const token = authState?.accessToken;
  const hasBody = body !== undefined && body !== null;
  const preparedHeaders = new Headers(headers);
  if (hasBody && !preparedHeaders.has("Content-Type")) {
    preparedHeaders.set("Content-Type", "application/json");
  }
  if (idempotencyKey) preparedHeaders.set("Idempotency-Key", idempotencyKey);
  if (auth && token) preparedHeaders.set("Authorization", `Bearer ${token}`);

  const response = await fetch(endpoint(path), {
    ...init,
    credentials: "include",
    headers: preparedHeaders,
    body,
  });

  if (response.status === 401 && auth && retryOnUnauthorized) {
    const refreshed = await refreshToken();
    if (refreshed) {
      return request<T>(path, { ...options, retryOnUnauthorized: false });
    }
  }

  const envelope = await parseEnvelope<T>(response);
  if (!response.ok) {
    const failure = envelope && !envelope.success ? (envelope as ApiFailure) : null;
    const message = failure ? failure.error.message : response.statusText;
    const fieldErrors = failure ? (failure.error.details?.fieldErrors ?? {}) : {};
    throw new ApiClientError(message || "Request failed", response.status, {
      code: failure ? failure.error.code : undefined,
      fieldErrors,
    });
  }

  if (!envelope) {
    throw new ApiClientError("Invalid server response", response.status);
  }
  if (!envelope.success) {
    const failure = envelope as ApiFailure;
    throw new ApiClientError(failure.error.message, response.status, {
      code: failure.error.code,
      fieldErrors: failure.error.details?.fieldErrors ?? {},
    });
  }
  return envelope.data;
}

export const apiClient = {
  auth: {
    getState(): ApiAuthState | null {
      return authState;
    },
    subscribe(listener: () => void): () => void {
      authListeners.add(listener);
      return () => authListeners.delete(listener);
    },
    setStateFromLogin(payload: { accessToken: string; refreshToken: string; user: ApiUser }): void {
      writeAuthState({
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken,
        user: payload.user,
        permissions: getApiPermissionsForRole(payload.user.role),
      });
    },
    async login(email: string, password: string): Promise<ApiAuthState> {
      const data = await request<{
        user: ApiUser;
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
      }>("/api/v1/auth/login", {
        method: "POST",
        auth: false,
        body: JSON.stringify({ email, password }),
      });
      const next = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
        permissions: getApiPermissionsForRole(data.user.role),
      };
      writeAuthState(next);
      return next;
    },
    async logout(): Promise<void> {
      try {
        await request("/api/v1/auth/logout", { method: "POST" });
      } finally {
        writeAuthState(null);
      }
    },
    clear(): void {
      writeAuthState(null);
    },
    async me(): Promise<ApiUser> {
      return request<ApiUser>("/api/v1/users/me");
    },
  },
  products: {
    list(
      params: { page?: number; limit?: number; status?: "draft" | "published" | "archived" } = {},
    ) {
      const search = new URLSearchParams();
      if (params.page) search.set("page", String(params.page));
      if (params.limit) search.set("limit", String(params.limit));
      if (params.status) search.set("status", params.status);
      const query = search.toString();
      return request<Array<Record<string, unknown>>>(`/api/v1/products${query ? `?${query}` : ""}`);
    },
    get(id: string) {
      return request<Record<string, unknown>>(`/api/v1/products/${id}`);
    },
    create(payload: Record<string, unknown>) {
      return request<Record<string, unknown>>("/api/v1/products", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    update(id: string, payload: Record<string, unknown>) {
      return request<Record<string, unknown>>(`/api/v1/products/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    },
    remove(id: string) {
      return request<{ deleted: boolean; id: string }>(`/api/v1/products/${id}`, {
        method: "DELETE",
      });
    },
  },
  plans: {
    list() {
      return request<Array<Record<string, unknown>>>("/api/v1/plans");
    },
    create(payload: Record<string, unknown>) {
      return request<Record<string, unknown>>("/api/v1/plans", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    update(id: string, payload: Record<string, unknown>) {
      return request<Record<string, unknown>>(`/api/v1/plans/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    },
    remove(id: string) {
      return request<{ deleted: boolean; id: string }>(`/api/v1/plans/${id}`, { method: "DELETE" });
    },
  },
  discounts: {
    list(params: { active?: boolean } = {}) {
      const search = new URLSearchParams();
      if (params.active !== undefined) search.set("active", String(params.active));
      const query = search.toString();
      return request<Array<Record<string, unknown>>>(
        `/api/v1/discounts${query ? `?${query}` : ""}`,
      );
    },
    create(payload: Record<string, unknown>) {
      return request<Record<string, unknown>>("/api/v1/discounts", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    update(id: string, payload: Record<string, unknown>) {
      return request<Record<string, unknown>>(`/api/v1/discounts/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    },
    remove(id: string) {
      return request<{ deleted: boolean; id: string }>(`/api/v1/discounts/${id}`, {
        method: "DELETE",
      });
    },
    validate(code: string, subtotal: number) {
      return request<{
        valid: boolean;
        code: string;
        type: "percent" | "fixed";
        value: number;
        discountAmount: number;
        newSubtotal: number;
      }>("/api/v1/discounts/validate", {
        method: "POST",
        body: JSON.stringify({ code, subtotal }),
      });
    },
  },
  webhooks: {
    list() {
      return request<Array<Record<string, unknown>>>("/api/v1/webhooks");
    },
    create(payload: Record<string, unknown>) {
      return request<Record<string, unknown>>("/api/v1/webhooks", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    update(id: string, payload: Record<string, unknown>) {
      return request<Record<string, unknown>>(`/api/v1/webhooks/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    },
    remove(id: string) {
      return request<{ deleted: boolean; id: string }>(`/api/v1/webhooks/${id}`, {
        method: "DELETE",
      });
    },
    logs() {
      return request<Array<Record<string, unknown>>>("/api/v1/webhooks/logs");
    },
  },
  subscriptions: {
    list() {
      return request<Array<Record<string, unknown>>>("/api/v1/subscriptions");
    },
    updateAction(
      id: string,
      action: "upgrade" | "downgrade" | "pause" | "resume" | "cancel",
      payload: Record<string, unknown> = {},
    ) {
      return request<Record<string, unknown>>(`/api/v1/subscriptions/${id}/${action}`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
  },
  licenses: {
    list() {
      return request<Array<Record<string, unknown>>>("/api/v1/licenses");
    },
    updateAction(
      id: string,
      action: "activate" | "deactivate",
      payload: Record<string, unknown> = {},
    ) {
      return request<Record<string, unknown>>(`/api/v1/licenses/${id}/${action}`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
  },
  checkout: {
    createSession(payload: Record<string, unknown>, idempotencyKey?: string) {
      return request<Record<string, unknown>>("/api/v1/checkout/session", {
        method: "POST",
        idempotencyKey,
        body: JSON.stringify(payload),
      });
    },
    createOrder(payload: Record<string, unknown>) {
      return request<Record<string, unknown>>("/api/v1/orders", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    createPaymentIntent(payload: Record<string, unknown>, idempotencyKey?: string) {
      return request<Record<string, unknown>>("/api/v1/payments/intent", {
        method: "POST",
        idempotencyKey,
        body: JSON.stringify(payload),
      });
    },
    confirmPayment(payload: Record<string, unknown>, idempotencyKey?: string) {
      return request<Record<string, unknown>>("/api/v1/payments/confirm", {
        method: "POST",
        idempotencyKey,
        body: JSON.stringify(payload),
      });
    },
  },
};
