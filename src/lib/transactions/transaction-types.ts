// Transaction Management System Types
// Financial Core - Transaction Data Models

// ============================================
// TRANSACTION TYPE
// ============================================

export type TransactionType = 'payment' | 'refund';

// ============================================
// TRANSACTION STATUS
// ============================================

export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'refunded';

// ============================================
// PAYMENT PROVIDER
// ============================================

export type PaymentProvider = 'stripe' | 'razorpay' | 'paypal';

// ============================================
// PAYMENT METHOD
// ============================================

export type PaymentMethod = 'card' | 'upi' | 'netbanking' | 'wallet' | 'other';

// ============================================
// CURRENCY
// ============================================

export type Currency = 'USD' | 'INR' | 'EUR' | 'GBP' | 'AUD' | 'CAD';

// ============================================
// TRANSACTION
// ============================================

export interface Transaction {
  id: string;
  customerId: string;
  subscriptionId?: string;
  checkoutLinkId?: string;
  type: TransactionType;
  amount: number;
  currency: Currency;
  status: TransactionStatus;
  paymentMethod: PaymentMethod;
  provider: PaymentProvider;
  providerTxnId: string;
  metadata: Record<string, unknown>;
  fraudRisk: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
  tenantId: string;
}

// ============================================
// CREATE TRANSACTION REQUEST
// ============================================

export interface CreateTransactionRequest {
  customerId: string;
  subscriptionId?: string;
  checkoutLinkId?: string;
  type: TransactionType;
  amount: number;
  currency: Currency;
  paymentMethod: PaymentMethod;
  provider: PaymentProvider;
  providerTxnId: string;
  metadata?: Record<string, unknown>;
  tenantId: string;
}

// ============================================
// UPDATE TRANSACTION REQUEST
// ============================================

export interface UpdateTransactionRequest {
  status?: TransactionStatus;
  metadata?: Record<string, unknown>;
  fraudRisk?: 'low' | 'medium' | 'high';
}

// ============================================
// REFUND REQUEST
// ============================================

export interface RefundRequest {
  transactionId: string;
  amount?: number; // Partial refund if specified, full refund if not
  reason?: string;
  userId: string;
}

// ============================================
// REFUND RESULT
// ============================================

export interface RefundResult {
  success: boolean;
  refundTransaction: Transaction | null;
  originalTransaction: Transaction | null;
  error?: string;
  timestamp: string;
}

// ============================================
// TRANSACTION SEARCH FILTERS
// ============================================

export interface TransactionSearchFilters {
  query?: string;
  type?: TransactionType;
  status?: TransactionStatus;
  customerId?: string;
  subscriptionId?: string;
  provider?: PaymentProvider;
  currency?: Currency;
  fraudRisk?: 'low' | 'medium' | 'high';
  sortBy?: 'createdAt' | 'amount' | 'status';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// ============================================
// TRANSACTION SEARCH RESULT
// ============================================

export interface TransactionSearchResult {
  transactions: Transaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================
// TRANSACTION EVENT TYPE
// ============================================

export type TransactionEventType =
  | 'transaction.created'
  | 'transaction.pending'
  | 'transaction.completed'
  | 'transaction.failed'
  | 'transaction.refunded'
  | 'transaction.fraud_flagged'
  | 'transaction.status_changed';

// ============================================
// TRANSACTION EVENT
// ============================================

export interface TransactionEvent {
  type: TransactionEventType;
  data: {
    transactionId: string;
    customerId: string;
    subscriptionId?: string;
    providerTxnId?: string;
    [key: string]: unknown;
  };
  timestamp: string;
  userId?: string;
  tenantId?: string;
}

// ============================================
// FRAUD CHECK RESULT
// ============================================

export interface FraudCheckResult {
  risk: 'low' | 'medium' | 'high';
  reasons: string[];
  score: number; // 0-100
  timestamp: string;
}

// ============================================
// TRANSACTION ANALYTICS
// ============================================

export interface TransactionAnalytics {
  totalTransactions: number;
  totalPayments: number;
  totalRefunds: number;
  totalAmount: number;
  totalPaymentAmount: number;
  totalRefundAmount: number;
  completedTransactions: number;
  failedTransactions: number;
  pendingTransactions: number;
  refundedTransactions: number;
  currencyBreakdown: Record<Currency, number>;
  providerBreakdown: Record<PaymentProvider, number>;
  fraudFlaggedCount: number;
}
