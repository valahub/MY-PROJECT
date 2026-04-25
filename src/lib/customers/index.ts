// Customer Management System - Central Exports
// SaaS Core Brain - Customer Data Models

// ============================================
// CORE TYPES
// ============================================

export type {
  CustomerStatus,
  ActivityType,
  CustomerSegment,
  Customer,
  ActivityLog,
  CustomerRelations,
  CustomerAnalytics,
  CustomerSegmentData,
  ChurnPrediction,
  UpsellPrediction,
  FraudRiskAssessment,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  CustomerSearchFilters,
  CustomerSearchResult,
} from './customer-types';

// ============================================
// RELATION ENGINE
// ============================================

export { customerRelationsEngine } from './customer-relations';

// ============================================
// SELF-HEALING ENGINE
// ============================================

export { customerSelfHealEngine } from './customer-self-heal';

export type { SelfHealResult } from './customer-self-heal';

// ============================================
// CUSTOMER API CLIENT
// ============================================

export { customerAPI, generateMockCustomers } from './customer-api';

// ============================================
// CUSTOMER STORE
// ============================================

export { CustomerProvider, useCustomerStore } from './customer-store';

// ============================================
// AI LAYER
// ============================================

export { customerAIEngine, useCustomerAI } from './customer-ai';

// ============================================
// ACTIVITY TRACKING
// ============================================

export { activityTrackingEngine, useActivityTracking } from './customer-activity';

// ============================================
// SEARCH ENGINE
// ============================================

export { customerSearchEngine, useCustomerSearch } from './customer-search';

// ============================================
// SEGMENTATION ENGINE
// ============================================

export { customerSegmentationEngine, useCustomerSegmentation } from './customer-segmentation';

// ============================================
// EVENTS SYSTEM
// ============================================

export {
  customerEventBus,
  customerEventEmitter,
  useCustomerEvents,
} from './customer-events';

export type { CustomerEventType, CustomerEvent, CustomerEventListener } from './customer-events';

// ============================================
// FRAUD DETECTION
// ============================================

export { fraudDetectionEngine, useFraudDetection } from './customer-fraud-detection';

export type { FraudDetectionResult } from './customer-fraud-detection';

// ============================================
// CHURN DETECTION
// ============================================

export { churnDetectionEngine, useChurnDetection } from './customer-churn-detection';

export type { ChurnDetectionResult } from './customer-churn-detection';

// ============================================
// CUSTOMER ANALYTICS
// ============================================

export { customerAnalyticsEngine, useCustomerAnalytics } from './customer-analytics';

// ============================================
// DATA CONSISTENCY JOB
// ============================================

export { dataConsistencyJobManager, useDataConsistencyJob } from './customer-data-consistency';

export type { DataConsistencyJobResult } from './customer-data-consistency';

// ============================================
// SECURITY LAYER
// ============================================

export { customerSecurityManager, useCustomerSecurity } from './customer-security';

export type { SecurityResult } from './customer-security';

// ============================================
// CUSTOMER ACTIONS
// ============================================

export { customerActionsManager, useCustomerActions } from './customer-actions';

export type { CustomerActionResult } from './customer-actions';

// ============================================
// CUSTOMER UI HOOKS
// ============================================

export {
  useCustomerStatusBadge,
  useCustomerSegmentBadge,
  useCustomerSearch as useCustomerSearchUI,
  useCustomerSegmentation as useCustomerSegmentationUI,
  useCustomerAnalytics as useCustomerAnalyticsUI,
  useCustomerSort,
  useCustomerPagination,
  useCustomerSelection,
  useCustomerDetails,
  useCustomerActivity as useCustomerActivityUI,
  useCustomerRiskScores,
  useCustomerFilters,
} from '../../components/customers/customer-hooks';
