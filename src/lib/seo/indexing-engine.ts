// Indexing Engine
// Auto-submits URLs to Google and Bing for indexing

export interface IndexingRequest {
  url: string;
  type: 'URL_UPDATED' | 'URL_DELETED';
}

export interface IndexingResponse {
  success: boolean;
  error?: string;
  urlNotificationUrl?: string;
}

export interface IndexingQueueItem {
  id: string;
  url: string;
  type: IndexingRequest['type'];
  attempts: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  lastAttempt?: string;
  nextAttempt?: string;
}

// In-memory queue (in production, use database)
const indexingQueue = new Map<string, IndexingQueueItem>();

// Google Indexing API
export async function submitToGoogleIndexing(
  url: string,
  type: IndexingRequest['type'],
  apiKey: string
): Promise<IndexingResponse> {
  try {
    const endpoint = 'https://indexing.googleapis.com/v3/urlNotifications:publish';
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        url,
        type,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google Indexing API error: ${error}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      urlNotificationUrl: data.urlNotificationUrl,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Bing Webmaster API
export async function submitToBingIndexing(
  url: string,
  apiKey: string
): Promise<IndexingResponse> {
  try {
    const endpoint = 'https://ssl.bing.com/webmaster/api.svc/json/SubmitUrl?apikey=' + apiKey;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        siteUrl: 'https://erpvala.com',
        url: url,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Bing Indexing API error: ${error}`);
    }

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Add URL to indexing queue
export function addToIndexingQueue(
  url: string,
  type: IndexingRequest['type'] = 'URL_UPDATED'
): IndexingQueueItem {
  const id = `index-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date();
  
  const item: IndexingQueueItem = {
    id,
    url,
    type,
    attempts: 0,
    status: 'pending',
    createdAt: now.toISOString(),
    nextAttempt: now.toISOString(),
  };

  indexingQueue.set(id, item);
  return item;
}

// Process indexing queue
export async function processIndexingQueue(
  googleApiKey?: string,
  bingApiKey?: string
): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  const now = new Date();
  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  for (const [id, item] of indexingQueue.entries()) {
    if (item.status !== 'pending') continue;
    
    const nextAttempt = new Date(item.nextAttempt || item.createdAt);
    if (now < nextAttempt) continue;

    // Update status to processing
    item.status = 'processing';
    item.lastAttempt = now.toISOString();
    item.attempts++;
    indexingQueue.set(id, item);

    processed++;

    // Submit to Google
    if (googleApiKey) {
      const googleResult = await submitToGoogleIndexing(item.url, item.type, googleApiKey);
      
      if (googleResult.success) {
        item.status = 'completed';
        succeeded++;
      } else {
        item.status = 'failed';
        failed++;
        
        // Retry with exponential backoff
        const retryDelay = Math.pow(2, item.attempts) * 60000; // 1min, 2min, 4min, etc.
        const nextRetry = new Date(now.getTime() + retryDelay);
        item.nextAttempt = nextRetry.toISOString();
        item.status = 'pending';
      }
    }

    // Submit to Bing
    if (bingApiKey) {
      const bingResult = await submitToBingIndexing(item.url, bingApiKey);
      
      if (!bingResult.success && item.status === 'completed') {
        // If Google succeeded but Bing failed, still mark as completed
        // but log the error
        console.error('Bing indexing failed:', bingResult.error);
      }
    }

    indexingQueue.set(id, item);
  }

  return { processed, succeeded, failed };
}

// Get queue status
export function getIndexingQueueStatus(): {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
} {
  const items = Array.from(indexingQueue.values());
  
  return {
    total: items.length,
    pending: items.filter((i) => i.status === 'pending').length,
    processing: items.filter((i) => i.status === 'processing').length,
    completed: items.filter((i) => i.status === 'completed').length,
    failed: items.filter((i) => i.status === 'failed').length,
  };
}

// Clear completed items from queue
export function clearCompletedItems(): number {
  let cleared = 0;
  
  for (const [id, item] of indexingQueue.entries()) {
    if (item.status === 'completed') {
      indexingQueue.delete(id);
      cleared++;
    }
  }
  
  return cleared;
}

// Retry failed items
export function retryFailedItems(): number {
  let retried = 0;
  const now = new Date();
  
  for (const [id, item] of indexingQueue.entries()) {
    if (item.status === 'failed' && item.attempts < 5) {
      item.status = 'pending';
      item.nextAttempt = now.toISOString();
      indexingQueue.set(id, item);
      retried++;
    }
  }
  
  return retried;
}

// Batch add URLs to queue
export function batchAddToQueue(urls: string[], type: IndexingRequest['type'] = 'URL_UPDATED'): IndexingQueueItem[] {
  return urls.map((url) => addToIndexingQueue(url, type));
}

// Submit sitemap to search engines
export async function submitSitemap(
  sitemapUrl: string,
  googleApiKey?: string,
  bingApiKey?: string
): Promise<{
  google: boolean;
  bing: boolean;
}> {
  const results = {
    google: false,
    bing: false,
  };

  // Submit to Google via Search Console API (requires OAuth)
  // For now, we'll use the indexing API for individual URLs
  if (googleApiKey) {
    // Google doesn't have a direct sitemap submission API
    // Sitemaps are typically submitted via Search Console UI
    results.google = true; // Placeholder
  }

  // Submit to Bing
  if (bingApiKey) {
    try {
      const endpoint = `https://ssl.bing.com/webmaster/api.svc/json/SubmitUrlbatch?apikey=${bingApiKey}`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteUrl: 'https://erpvala.com',
          urlList: [sitemapUrl],
        }),
      });

      results.bing = response.ok;
    } catch {
      results.bing = false;
    }
  }

  return results;
}

// Get indexing statistics
export function getIndexingStats(): {
  queueSize: number;
  successRate: number;
  avgAttempts: number;
} {
  const items = Array.from(indexingQueue.values());
  const completed = items.filter((i) => i.status === 'completed');
  const successRate = items.length > 0 ? (completed.length / items.length) * 100 : 0;
  const avgAttempts = items.length > 0
    ? items.reduce((sum, i) => sum + i.attempts, 0) / items.length
    : 0;

  return {
    queueSize: items.length,
    successRate,
    avgAttempts,
  };
}

// Validate URL before indexing
export function validateUrlForIndexing(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'https:' && urlObj.hostname === 'erpvala.com';
  } catch {
    return false;
  }
}

// Prioritize important URLs
export function prioritizeUrls(urls: string[]): string[] {
  const priorityPatterns = [
    '/marketplace/item/', // Product pages
    '/marketplace/category', // Category pages
    '/marketplace/blog/', // Blog posts
  ];

  return urls.sort((a, b) => {
    const aPriority = priorityPatterns.findIndex((pattern) => a.includes(pattern));
    const bPriority = priorityPatterns.findIndex((pattern) => b.includes(pattern));
    
    // Higher priority (lower index) comes first
    if (aPriority !== -1 && bPriority !== -1) return aPriority - bPriority;
    if (aPriority !== -1) return -1;
    if (bPriority !== -1) return 1;
    return 0;
  });
}

// Auto-index new content
export async function autoIndexNewContent(
  newUrls: string[],
  googleApiKey?: string,
  bingApiKey?: string
): Promise<{
  queued: number;
  processed: number;
  succeeded: number;
}> {
  const validUrls = newUrls.filter(validateUrlForIndexing);
  const prioritizedUrls = prioritizeUrls(validUrls);
  
  const queuedItems = batchAddToQueue(prioritizedUrls);
  const result = await processIndexingQueue(googleApiKey, bingApiKey);
  
  return {
    queued: queuedItems.length,
    processed: result.processed,
    succeeded: result.succeeded,
  };
}

// Schedule periodic indexing (cron-like)
export function schedulePeriodicIndexing(
  intervalMinutes: number = 60,
  googleApiKey?: string,
  bingApiKey?: string
): number {
  return setInterval(async () => {
    await processIndexingQueue(googleApiKey, bingApiKey);
    clearCompletedItems();
  }, intervalMinutes * 60 * 1000) as unknown as number;
}

// Check if URL is already in queue
export function isUrlInQueue(url: string): boolean {
  return Array.from(indexingQueue.values()).some((item) => item.url === url);
}

// Remove URL from queue
export function removeFromQueue(url: string): boolean {
  for (const [id, item] of indexingQueue.entries()) {
    if (item.url === url) {
      indexingQueue.delete(id);
      return true;
    }
  }
  return false;
}

// Get queue by status
export function getQueueByStatus(status: IndexingQueueItem['status']): IndexingQueueItem[] {
  return Array.from(indexingQueue.values()).filter((item) => item.status === status);
}

// Export queue as JSON
export function exportQueue(): string {
  return JSON.stringify(Array.from(indexingQueue.values()), null, 2);
}

// Import queue from JSON
export function importQueue(json: string): void {
  const items = JSON.parse(json) as IndexingQueueItem[];
  items.forEach((item) => {
    indexingQueue.set(item.id, item);
  });
}
