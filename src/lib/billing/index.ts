// Billing System - Central Exports
// Invoice + Dunning System (Auto Revenue Recovery)

// ============================================
// CORE TYPES
// ============================================

export type {
  InvoiceStatus,
  DunningAction,
  DunningStatus,
  Invoice,
  DunningLog,
  DunningConfig,
  DunningRetryResult,
  InvoiceAnalytics,
  PaymentRiskScore,
  CreateInvoiceRequest,
  UpdateInvoiceRequest,
  EmailTemplate,
  EmailSendResult,
  DunningTimeline,
} from './invoice-types';

// ============================================
// INVOICE SERVICE
// ============================================

export { invoiceService } from './invoice-service';

// ============================================
// DUNNING ENGINE
// ============================================

export { dunningEngine } from './dunning-engine';

// ============================================
// EMAIL TEMPLATES
// ============================================

export { emailTemplateManager } from './email-templates';

// ============================================
// INVOICE API CLIENT
// ============================================

export { invoiceAPI, generateMockInvoices } from './invoice-api';

// ============================================
// INVOICE STORE
// ============================================

export { InvoiceProvider, useInvoiceStore, useFilteredInvoices, useInvoiceById } from './invoice-store';

// ============================================
// INVOICE ANALYTICS
// ============================================

export { invoiceAnalyticsEngine } from './invoice-analytics';

// ============================================
// BILLING EVENTS
// ============================================

export {
  billingEventBus,
  billingEventEmitter,
  useBillingEvents,
} from './billing-events';

export type { BillingEventType, BillingEvent, BillingEventListener } from './billing-events';

// ============================================
// BILLING SECURITY
// ============================================

export { billingSecurityManager, useBillingSecurity } from './billing-security';

export type { AuditLog } from './billing-security';

// ============================================
// INVOICE ACTIONS
// ============================================

export { invoiceActionsManager, useInvoiceActions } from './invoice-actions';

export type { InvoiceActionResult } from './invoice-actions';

// ============================================
// DUNNING CRON
// ============================================

export { dunningCronManager, useDunningCron } from './dunning-cron';

export type { DunningCronConfig, CronJobResult } from './dunning-cron';

// ============================================
// DUNNING AI
// ============================================

export { dunningAIEngine, useDunningAI } from './dunning-ai';

// ============================================
// DUNNING UI HOOKS
// ============================================

export {
  useDunningTimeline,
  useDunningActions,
  usePaymentRiskScore,
  useDunningDashboard,
  useInvoiceStatusBadge,
  useDunningProgress,
  useRecoveryPrediction,
} from '../../components/billing/dunning-hooks';
