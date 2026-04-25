// AI Infrastructure - Main Index
// Enterprise-grade AI system with health monitoring, rate limiting, cost control, caching, and fallback

// Core Infrastructure
export { aiInfrastructure, AIInfrastructure } from './ai-infrastructure';
export type { AIProvider, AIRequest, AIResponse, AIHealthStatus, CostLimit } from './ai-infrastructure';

// Health Monitoring
export { AIHealthMonitor } from './ai-infrastructure';

// Rate Limiting
export { AIRateLimitHandler } from './ai-infrastructure';

// Cost Control
export { AICostControlEngine } from './ai-infrastructure';

// Caching
export { AIResponseCache } from './ai-infrastructure';

// Validation
export { AIResponseValidator } from './ai-infrastructure';

// Retry System
export { AIAutoRetrySystem } from './ai-infrastructure';

// Fallback Chain
export { AIFallbackChain } from './ai-infrastructure';

// Privacy Control
export { AIDataPrivacyControl } from './ai-infrastructure';

// Logging
export { AILoggingSystem, type AILogEntry } from './ai-infrastructure';

// Fail Safe
export { AIFailSafeSystem } from './ai-infrastructure';

// Prompt Management
export { promptManager, PromptManager } from './prompt-management';
export type { PromptTemplate, PromptExecution } from './prompt-management';

// Queue System
export { aiQueueSystem, AIQueueSystem } from './queue-system';
export type { QueueTask } from './queue-system';

// Webhook System
export { aiWebhookSystem, AIWebhookSystem } from './webhook-system';
export type { WebhookEvent, WebhookSubscription } from './webhook-system';

// Plugin Manager
export { aiPluginManager, AIPluginManager } from './plugin-manager';
export type { AIPlugin } from './plugin-manager';

// Security Layer
export { aiSecurityLayer, AISecurityLayer } from './security-layer';
export type { APIKeyConfig } from './security-layer';

// Multi-Tenant Support
export { aiMultiTenantSupport, AIMultiTenantSupport } from './multi-tenant-support';
export type { TenantConfig } from './multi-tenant-support';

// Response Normalization
export { aiResponseNormalizer, AIResponseNormalizer } from './response-normalization';
export type { NormalizedResponse } from './response-normalization';

// Local AI Support
export { localAISupport, LocalAISupport } from './local-ai-support';
export type { LocalAIConfig } from './local-ai-support';

// Offline Mode
export { offlineModeSupport, OfflineModeSupport } from './offline-mode-support';

// Smart Routing
export { aiSmartRoutingEngine, AISmartRoutingEngine } from './smart-routing-engine';
export type { RoutingCriteria, ProviderMetrics } from './smart-routing-engine';

// Analytics
export { aiAnalyticsDashboard, AIAnalyticsDashboard } from './analytics-dashboard';
export type { AIAnalytics } from './analytics-dashboard';

// Auto Scaling
export { aiAutoScalingLogic, AIAutoScalingLogic } from './auto-scaling-logic';
export type { ScalingConfig } from './auto-scaling-logic';

// Version Control
export { aiVersionControl, AIVersionControl } from './version-control';
export type { ContentVersion } from './version-control';

// Sandbox Mode
export { aiSandboxMode, AISandboxMode } from './sandbox-mode';
export type { SandboxConfig } from './sandbox-mode';

// API Configurations
export {
  allAIAPIs,
  textContentAIAPIs,
  seoAIAPIs,
  translationAIAPIs,
  imageAIAPIs,
  voiceAIAPIs,
  analyticsAIAPIs,
  trendDataAIAPIs,
  chatBotAIAPIs,
  codingDevAIAPIs,
  multiPurposeAIAPIs,
  getAPIsByType,
  getAPIById,
  getActiveAPIs,
  getAPIsByPriority,
} from './api-configurations';
export type { AIAPIConfig } from './api-configurations';

// API Integration
export { aiAPIIntegration, AIAPIIntegration } from './api-integration';
export type { AIRequestOptions, AIIntegrationResult } from './api-integration';

// API Config Manager
export { aiAPIConfigManager, AIAPIConfigManager } from './api-config-manager';
export type { StoredAPIConfig } from './api-config-manager';
