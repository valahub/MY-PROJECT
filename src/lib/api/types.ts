// Core API types shared across all modules

export type Role = "admin" | "merchant" | "customer" | "support";

export type UserStatus = "active" | "suspended" | "pending";
export type ProductStatus = "draft" | "published" | "archived";
export type OrderStatus = "pending" | "processing" | "completed" | "refunded" | "failed";
export type PaymentStatus = "pending" | "succeeded" | "failed" | "refunded";
export type InvoiceStatus = "draft" | "issued" | "paid" | "void";

export interface ApiUser {
  id: string;
  email: string;
  role: Role;
  merchantId?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: PaginationMeta;
}

export interface AuthContext {
  user: ApiUser;
  tokenId: string;
}

export interface RequestContext {
  auth?: AuthContext;
  requestId: string;
  ip: string;
  userAgent: string;
  startTime: number;
}
