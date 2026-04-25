// Invoice and Dunning System Types
// Auto Revenue Recovery with Dunning Engine

// ============================================
// INVOICE STATUS
// ============================================

export type InvoiceStatus = 'paid' | 'pending' | 'failed' | 'overdue' | 'cancelled';

// ============================================
// DUNNING ACTION
// ============================================

export type DunningAction = 'email' | 'retry' | 'suspend' | 'downgrade' | 'cancel';

// ============================================
// DUNNING STATUS
// ============================================

export type DunningStatus = 'success' | 'failed' | 'pending' | 'skipped';

// ============================================
// INVOICE
// ============================================

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  subscriptionId: string | null;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  dueDate: string;
  issuedAt: string;
  paidAt: string | null;
  retryCount: number;
  lastRetryAt: string | null;
  tenantId: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// DUNNING LOG
// ============================================

export interface DunningLog {
  id: string;
  invoiceId: string;
  customerId: string;
  attemptNumber: number;
  action: DunningAction;
  status: DunningStatus;
  timestamp: string;
  errorMessage?: string | null;
  metadata?: Record<string, unknown>;
}

// ============================================
// DUNNING CONFIG
// ============================================

export interface DunningConfig {
  maxRetries: number;
  retrySchedule: number[]; // days between retries
  actions: {
    [key: number]: DunningAction; // attempt number -> action
  };
  suspendAfterAttempts: number;
}

// ============================================
// DUNNING RETRY RESULT
// ============================================

export interface DunningRetryResult {
  success: boolean;
  invoiceId: string;
  attemptNumber: number;
  action: DunningAction;
  status: DunningStatus;
  timestamp: string;
  errorMessage?: string | null;
}

// ============================================
// INVOICE ANALYTICS
// ============================================

export interface InvoiceAnalytics {
  totalInvoices: number;
  paidInvoices: number;
  failedInvoices: number;
  overdueInvoices: number;
  pendingInvoices: number;
  totalRevenue: number;
  recoveredRevenue: number;
  lostRevenue: number;
  recoveryRate: number;
  averagePaymentTime: number; // in days
}

// ============================================
// PAYMENT RISK SCORE
// ============================================

export interface PaymentRiskScore {
  customerId: string;
  riskScore: number; // 0-100, higher = more risk
  recoveryProbability: number; // 0-100, higher = more likely to recover
  churnRisk: number; // 0-100, higher = more likely to churn
  factors: {
    paymentHistory: number;
    invoiceAge: number;
    amount: number;
    customerTenure: number;
  };
  timestamp: string;
}

// ============================================
// INVOICE CREATION REQUEST
// ============================================

export interface CreateInvoiceRequest {
  customerId: string;
  subscriptionId: string | null;
  amount: number;
  currency: string;
  dueDate: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

// ============================================
// INVOICE UPDATE REQUEST
// ============================================

export interface UpdateInvoiceRequest {
  status?: InvoiceStatus;
  paidAt?: string | null;
  metadata?: Record<string, unknown>;
}

// ============================================
// EMAIL TEMPLATE
// ============================================

export interface EmailTemplate {
  type: 'payment_failed' | 'retry_reminder' | 'final_warning' | 'payment_success';
  subject: string;
  body: string;
  variables: string[];
}

// ============================================
// EMAIL SEND RESULT
// ============================================

export interface EmailSendResult {
  success: boolean;
  emailId: string | null;
  errorMessage?: string | null;
  timestamp: string;
}

// ============================================
// DUNNING TIMELINE
// ============================================

export interface DunningTimeline {
  invoiceId: string;
  customerId: string;
  logs: DunningLog[];
  currentAttempt: number;
  nextAction?: DunningAction;
  nextActionAt?: string;
  estimatedRecoveryDate?: string;
}
