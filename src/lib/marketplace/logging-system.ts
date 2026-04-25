// Logging System
// Log filter usage, errors, failed API calls

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  category: 'filter' | 'error' | 'api' | 'system' | 'user' | 'performance';
  message: string;
  metadata?: Record<string, any>;
}

// Log storage (in production, use logging service)
const logStore = new Map<string, LogEntry[]>();

// Generate unique log ID
function generateLogId(): string {
  return `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Log entry
export function log(
  level: LogEntry['level'],
  category: LogEntry['category'],
  message: string,
  metadata?: Record<string, any>
): void {
  const entry: LogEntry = {
    id: generateLogId(),
    timestamp: new Date().toISOString(),
    level,
    category,
    message,
    metadata,
  };

  const categoryLogs = logStore.get(category) || [];
  categoryLogs.push(entry);
  logStore.set(category, categoryLogs);

  // In production, send to logging service
  console.log(`[${level.toUpperCase()}] [${category}] ${message}`, metadata || '');
}

// Log filter usage
export function logFilterUsage(filter: string, value: string, resultCount: number): void {
  log('info', 'filter', `Filter used: ${filter}`, {
    filter,
    value,
    resultCount,
  });
}

// Log error
export function logError(error: Error | string, context?: Record<string, any>): void {
  const message = error instanceof Error ? error.message : error;
  const metadata = error instanceof Error ? { ...context, stack: error.stack } : context;
  
  log('error', 'error', message, metadata);
}

// Log failed API call
export function logFailedAPI(endpoint: string, error: Error | string, metadata?: Record<string, any>): void {
  const message = error instanceof Error ? error.message : error;
  
  log('error', 'api', `API call failed: ${endpoint}`, {
    endpoint,
    error: message,
    ...metadata,
  });
}

// Log system event
export function logSystemEvent(message: string, metadata?: Record<string, any>): void {
  log('info', 'system', message, metadata);
}

// Log user action
export function logUserAction(action: string, userId?: string, metadata?: Record<string, any>): void {
  log('info', 'user', `User action: ${action}`, {
    userId,
    action,
    ...metadata,
  });
}

// Log performance metric
export function logPerformance(operation: string, duration: number, metadata?: Record<string, any>): void {
  log('debug', 'performance', `Performance: ${operation} took ${duration}ms`, {
    operation,
    duration,
    ...metadata,
  });
}

// Get logs by category
export function getLogsByCategory(category: LogEntry['category'], limit: number = 100): LogEntry[] {
  const logs = logStore.get(category) || [];
  return logs.slice(-limit);
}

// Get logs by level
export function getLogsByLevel(level: LogEntry['level'], limit: number = 100): LogEntry[] {
  const allLogs: LogEntry[] = [];
  logStore.forEach((logs) => {
    allLogs.push(...logs.filter((log) => log.level === level));
  });
  return allLogs.slice(-limit);
}

// Get all logs
export function getAllLogs(limit: number = 1000): LogEntry[] {
  const allLogs: LogEntry[] = [];
  logStore.forEach((logs) => {
    allLogs.push(...logs);
  });
  
  // Sort by timestamp descending
  allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  return allLogs.slice(0, limit);
}

// Get logs by time range
export function getLogsByTimeRange(startDate: Date, endDate: Date): LogEntry[] {
  const allLogs = getAllLogs();
  const start = startDate.getTime();
  const end = endDate.getTime();
  
  return allLogs.filter((log) => {
    const logTime = new Date(log.timestamp).getTime();
    return logTime >= start && logTime <= end;
  });
}

// Get log statistics
export function getLogStatistics(): {
  totalLogs: number;
  byLevel: Record<string, number>;
  byCategory: Record<string, number>;
  recentErrors: number;
} {
  const allLogs = getAllLogs();
  const byLevel: Record<string, number> = {};
  const byCategory: Record<string, number> = {};
  
  allLogs.forEach((log) => {
    byLevel[log.level] = (byLevel[log.level] || 0) + 1;
    byCategory[log.category] = (byCategory[log.category] || 0) + 1;
  });
  
  const recentErrors = getLogsByLevel('error', 10).length;
  
  return {
    totalLogs: allLogs.length,
    byLevel,
    byCategory,
    recentErrors,
  };
}

// Clear logs by category
export function clearLogsByCategory(category: LogEntry['category']): void {
  logStore.delete(category);
}

// Clear all logs
export function clearAllLogs(): void {
  logStore.clear();
}

// Export logs
export function exportLogs(category?: LogEntry['category']): string {
  const logs = category ? getLogsByCategory(category) : getAllLogs();
  return JSON.stringify(logs, null, 2);
}

// Import logs
export function importLogs(json: string): void {
  const logs = JSON.parse(json) as LogEntry[];
  logs.forEach((log) => {
    const categoryLogs = logStore.get(log.category) || [];
    categoryLogs.push(log);
    logStore.set(log.category, categoryLogs);
  });
}

// Get filter usage statistics
export function getFilterUsageStatistics(): Record<string, { count: number; lastUsed: string }> {
  const filterLogs = getLogsByCategory('filter');
  const stats: Record<string, { count: number; lastUsed: string }> = {};
  
  filterLogs.forEach((log) => {
    const filter = log.metadata?.filter;
    if (filter) {
      if (!stats[filter]) {
        stats[filter] = { count: 0, lastUsed: log.timestamp };
      }
      stats[filter].count++;
      stats[filter].lastUsed = log.timestamp;
    }
  });
  
  return stats;
}

// Get error statistics
export function getErrorStatistics(): {
  totalErrors: number;
  byType: Record<string, number>;
  recentErrors: LogEntry[];
} {
  const errorLogs = getLogsByLevel('error');
  const byType: Record<string, number> = {};
  
  errorLogs.forEach((log) => {
    const errorType = log.metadata?.error || 'unknown';
    byType[errorType] = (byType[errorType] || 0) + 1;
  });
  
  return {
    totalErrors: errorLogs.length,
    byType,
    recentErrors: errorLogs.slice(0, 10),
  };
}

// Schedule log cleanup
export function scheduleLogCleanup(intervalHours: number = 24, maxAgeHours: number = 168): number {
  return setInterval(() => {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - maxAgeHours);
    
    logStore.forEach((logs, category) => {
      const filtered = logs.filter((log) => new Date(log.timestamp) > cutoffDate);
      logStore.set(category, filtered);
    });
  }, intervalHours * 60 * 60 * 1000) as unknown as number;
}

// Create log alert (trigger on specific conditions)
export function createLogAlert(
  condition: (log: LogEntry) => boolean,
  callback: (log: LogEntry) => void
): void {
  // In production, set up real-time monitoring
  // For now, this is a placeholder
  console.log('Log alert created');
}
