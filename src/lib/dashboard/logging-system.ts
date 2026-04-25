// Logging System for Dashboard
// Frontend and API logs with /api/logs endpoint

// ============================================
// LOG TYPES
// ============================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';

export type LogType =
  | 'frontend_error'
  | 'hook_error'
  | 'security_event'
  | 'anomaly_detected'
  | 'api_request'
  | 'api_response'
  | 'user_action'
  | 'performance'
  | 'custom';

export interface LogEntry {
  id: string;
  type: LogType;
  level: LogLevel;
  message: string;
  data?: unknown;
  timestamp: string;
  userId?: string;
  merchantId?: string;
  url?: string;
  userAgent?: string;
  sessionId?: string;
}

// ============================================
// LOG STORAGE
// ============================================

class LogStorage {
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;

  add(log: LogEntry): void {
    this.logs.push(log);

    // Limit log size
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  get(filter?: {
    type?: LogType;
    level?: LogLevel;
    limit?: number;
  }): LogEntry[] {
    let filtered = [...this.logs];

    if (filter?.type) {
      filtered = filtered.filter((log) => log.type === filter.type);
    }

    if (filter?.level) {
      filtered = filtered.filter((log) => log.level === filter.level);
    }

    if (filter?.limit) {
      filtered = filtered.slice(-filter.limit);
    }

    return filtered;
  }

  clear(): void {
    this.logs = [];
  }

  size(): number {
    return this.logs.length;
  }
}

// ============================================
// LOGGER CLASS
// ============================================

export class Logger {
  private storage: LogStorage;
  private sessionId: string;
  private userId: string | null = null;
  private merchantId: string | null = null;
  private apiEndpoint: string = '/api/logs';
  private batchLogs: LogEntry[] = [];
  private batchSize: number = 10;
  private batchTimeout: number = 5000;
  private batchTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.storage = new LogStorage();
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Set user context
  setUserContext(userId: string, merchantId: string): void {
    this.userId = userId;
    this.merchantId = merchantId;
  }

  // Clear user context
  clearUserContext(): void {
    this.userId = null;
    this.merchantId = null;
  }

  // ============================================
  // LOG METHODS
  // ============================================

  debug(type: LogType, message: string, data?: unknown): void {
    this.log('debug', type, message, data);
  }

  info(type: LogType, message: string, data?: unknown): void {
    this.log('info', type, message, data);
  }

  warn(type: LogType, message: string, data?: unknown): void {
    this.log('warn', type, message, data);
  }

  error(type: LogType, message: string, data?: unknown): void {
    this.log('error', type, message, data);
  }

  critical(type: LogType, message: string, data?: unknown): void {
    this.log('critical', type, message, data);
  }

  private log(level: LogLevel, type: LogType, message: string, data?: unknown): void {
    const logEntry: LogEntry = {
      id: this.generateLogId(),
      type,
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      userId: this.userId || undefined,
      merchantId: this.merchantId || undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      sessionId: this.sessionId,
    };

    // Add to local storage
    this.storage.add(logEntry);

    // Console output
    this.consoleLog(logEntry);

    // Add to batch for API submission
    this.addToBatch(logEntry);
  }

  private consoleLog(log: LogEntry): void {
    const consoleMethod = log.level === 'critical' ? 'error' : log.level;
    const consoleArgs = [`[${log.type.toUpperCase()}] ${log.message}`, log.data || ''];

    // eslint-disable-next-line no-console
    console[consoleMethod](...consoleArgs);
  }

  // ============================================
  // BATCH LOGGING
  // ============================================

  private addToBatch(log: LogEntry): void {
    this.batchLogs.push(log);

    // Send batch if size reached
    if (this.batchLogs.length >= this.batchSize) {
      this.sendBatch();
      return;
    }

    // Reset timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    // Set timer to send batch
    this.batchTimer = setTimeout(() => {
      this.sendBatch();
    }, this.batchTimeout);
  }

  private async sendBatch(): Promise<void> {
    if (this.batchLogs.length === 0) return;

    const logsToSend = [...this.batchLogs];
    this.batchLogs = [];

    try {
      await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logs: logsToSend,
        }),
      });
    } catch (error) {
      console.error('[Logger] Failed to send logs:', error);
      // Re-add failed logs to batch
      this.batchLogs.unshift(...logsToSend);
    }
  }

  // Force send all pending logs
  async flush(): Promise<void> {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    await this.sendBatch();
  }

  // ============================================
  // RETRIEVAL
  // ============================================

  getLogs(filter?: {
    type?: LogType;
    level?: LogLevel;
    limit?: number;
  }): LogEntry[] {
    return this.storage.get(filter);
  }

  getRecentLogs(count: number = 50): LogEntry[] {
    return this.storage.get({ limit: count });
  }

  getErrors(): LogEntry[] {
    return this.storage.get({ level: 'error' });
  }

  getCriticals(): LogEntry[] {
    return this.storage.get({ level: 'critical' });
  }

  // ============================================
  // EXPORT
  // ============================================

  exportLogs(): string {
    const logs = this.storage.get();
    return JSON.stringify(logs, null, 2);
  }

  downloadLogs(): void {
    const logs = this.exportLogs();
    const blob = new Blob([logs], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs_${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ============================================
  // CLEAR
  // ============================================

  clearLogs(): void {
    this.storage.clear();
  }
}

// Export singleton instance
export const logger = new Logger();

// ============================================
// REACT HOOK FOR LOGGING
// ============================================

import { useCallback, useEffect } from 'react';

export function useLogger() {
  // Log user action
  const logAction = useCallback((action: string, data?: unknown) => {
    logger.info('user_action', action, data);
  }, []);

  // Log error
  const logError = useCallback((error: Error, context?: string) => {
    logger.error('frontend_error', context || error.message, {
      message: error.message,
      stack: error.stack,
      context,
    });
  }, []);

  // Log performance
  const logPerformance = useCallback((metric: string, value: number, unit: string = 'ms') => {
    logger.info('performance', `${metric}: ${value}${unit}`, { metric, value, unit });
  }, []);

  // Log API request
  const logAPIRequest = useCallback((endpoint: string, method: string, data?: unknown) => {
    logger.debug('api_request', `${method} ${endpoint}`, { endpoint, method, data });
  }, []);

  // Log API response
  const logAPIResponse = useCallback((endpoint: string, status: number, duration: number) => {
    logger.debug('api_response', `${endpoint} - ${status} (${duration}ms)`, {
      endpoint,
      status,
      duration,
    });
  }, []);

  // Flush logs on unmount
  useEffect(() => {
    return () => {
      logger.flush();
    };
  }, []);

  return {
    logAction,
    logError,
    logPerformance,
    logAPIRequest,
    logAPIResponse,
    getLogs: logger.getLogs.bind(logger),
    getRecentLogs: logger.getRecentLogs.bind(logger),
    getErrors: logger.getErrors.bind(logger),
    getCriticals: logger.getCriticals.bind(logger),
    exportLogs: logger.exportLogs.bind(logger),
    downloadLogs: logger.downloadLogs.bind(logger),
    clearLogs: logger.clearLogs.bind(logger),
  };
}

// ============================================
// PERFORMANCE MONITORING
// ============================================

export class PerformanceMonitor {
  private marks: Map<string, number> = new Map();

  // Start timing
  start(name: string): void {
    this.marks.set(name, performance.now());
  }

  // End timing and log
  end(name: string): number {
    const start = this.marks.get(name);
    if (!start) {
      console.warn(`[PerformanceMonitor] No start mark found for ${name}`);
      return 0;
    }

    const duration = performance.now() - start;
    this.marks.delete(name);

    logger.info('performance', `${name}: ${duration.toFixed(2)}ms`, {
      metric: name,
      duration,
    });

    return duration;
  }

  // Measure function execution time
  async measure<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.start(name);
    try {
      const result = await fn();
      this.end(name);
      return result;
    } catch (error) {
      this.end(name);
      throw error;
    }
  }

  // Measure synchronous function execution time
  measureSync<T>(name: string, fn: () => T): T {
    this.start(name);
    try {
      const result = fn();
      this.end(name);
      return result;
    } catch (error) {
      this.end(name);
      throw error;
    }
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// ============================================
// REACT HOOK FOR PERFORMANCE MONITORING
// ============================================

export function usePerformanceMonitor() {
  const start = useCallback((name: string) => {
    performanceMonitor.start(name);
  }, []);

  const end = useCallback((name: string): number => {
    return performanceMonitor.end(name);
  }, []);

  const measure = useCallback(async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
    return performanceMonitor.measure(name, fn);
  }, []);

  const measureSync = useCallback(<T>(name: string, fn: () => T): T => {
    return performanceMonitor.measureSync(name, fn);
  }, []);

  return {
    start,
    end,
    measure,
    measureSync,
  };
}

// ============================================
// API LOGGING INTERCEPTOR
// ============================================

export function setupAPILogging() {
  // Store original fetch
  const originalFetch = window.fetch;

  // Override fetch
  window.fetch = async (...args) => {
    const [url, options = {}] = args;
    const startTime = performance.now();

    // Log request
    logger.debug('api_request', `${options.method || 'GET'} ${url}`, {
      url: url.toString(),
      method: options.method,
      body: options.body,
    });

    try {
      const response = await originalFetch(...args);
      const duration = performance.now() - startTime;

      // Log response
      logger.debug('api_response', `${url.toString()} - ${response.status} (${duration.toFixed(2)}ms)`, {
        url: url.toString(),
        status: response.status,
        duration,
      });

      return response;
    } catch (error) {
      const duration = performance.now() - startTime;

      // Log error
      logger.error('api_response', `Failed to fetch ${url.toString()}`, {
        url: url.toString(),
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  };
}

// ============================================
// ERROR TRACKING
// ============================================

export function setupErrorTracking() {
  // Track unhandled errors
  window.addEventListener('error', (event) => {
    logger.error('frontend_error', event.message, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack,
    });
  });

  // Track unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logger.error('frontend_error', 'Unhandled promise rejection', {
      reason: event.reason,
      promise: event.promise,
    });
  });
}

// ============================================
// INITIALIZATION
// ============================================

// Auto-initialize logging
if (typeof window !== 'undefined') {
  setupAPILogging();
  setupErrorTracking();

  // Flush logs on page unload
  window.addEventListener('beforeunload', () => {
    logger.flush();
  });
}
