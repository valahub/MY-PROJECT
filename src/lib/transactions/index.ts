// Transaction Management System - Central Exports
// Financial Core - Transaction Data Models

// ============================================
// CORE TYPES
// ============================================

export type {
  TransactionType,
  TransactionStatus,
  PaymentProvider,
  PaymentMethod,
  Currency,
  Transaction,
  CreateTransactionRequest,
  UpdateTransactionRequest,
  RefundRequest,
  RefundResult,
  TransactionSearchFilters,
  TransactionSearchResult,
  TransactionEventType,
  TransactionEvent,
  FraudCheckResult,
  TransactionAnalytics,
} from './transaction-types';

// ============================================
// STATUS ENGINE
// ============================================

export { transactionStatusEngine, useTransactionStatus } from './transaction-status';

// ============================================
// WEBHOOK SYNC
// ============================================

export { transactionWebhookSyncEngine, useTransactionWebhookSync } from './transaction-webhook-sync';

export type { WebhookSyncResult } from './transaction-webhook-sync';

// ============================================
// SELF-HEALING
// ============================================

export { transactionSelfHealingEngine, useTransactionSelfHealing } from './transaction-self-heal';

export type { SelfHealResult } from './transaction-self-heal';

// ============================================
// REFUND ENGINE
// ============================================

export { refundEngine, useRefund } from './transaction-refund';

// ============================================
// SEARCH
// ============================================

export { transactionSearchEngine, useTransactionSearch } from './transaction-search';

// ============================================
// EXPORT
// ============================================

export { transactionExportEngine, useTransactionExport } from './transaction-export';

export type { ExportFormat, ExportResult } from './transaction-export';

// ============================================
// PAGINATION
// ============================================

export { transactionPaginationEngine, useTransactionPagination } from './transaction-pagination';

export type { PaginationResult } from './transaction-pagination';

// ============================================
// FRAUD DETECTION
// ============================================

export { fraudDetectionEngine, useFraudDetection } from './transaction-fraud-detection';

// ============================================
// CURRENCY
// ============================================

export { currencyEngine, useCurrency, CURRENCY_SYMBOLS, CURRENCY_NAMES, EXCHANGE_RATES } from './transaction-currency';

// ============================================
// AUDIT LOG
// ============================================

export { auditLogManager, useAuditLog } from './transaction-audit';

export type { AuditLogEntry } from './transaction-audit';

// ============================================
// TENANT ISOLATION
// ============================================

export { tenantIsolationManager, useTenantIsolation } from './transaction-tenant-isolation';

export type { TenantIsolationResult } from './transaction-tenant-isolation';

// ============================================
// EVENTS
// ============================================

export {
  transactionEventBus,
  transactionEventEmitter,
  useTransactionEvents,
} from './transaction-events';

export type { TransactionEventListener } from './transaction-events';

// ============================================
// SECURITY
// ============================================

export { transactionSecurityManager, useTransactionSecurity } from './transaction-security';

export type { SecurityResult } from './transaction-security';

// ============================================
// UI HOOKS
// ============================================

export {
  useTransactionStatusBadge,
  useTransactionSelection,
  useTransactionSort,
  useTransactionDetails,
  useTransactionFilter,
  useTransactionActionAvailability,
  useTransactionFraudBadge,
} from '../../components/transactions/transaction-hooks';
