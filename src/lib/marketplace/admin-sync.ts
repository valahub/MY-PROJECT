// Admin Sync System
// Backend integration with Product Manager, Pricing Engine, Author Module
// Ensures no orphan products

import { ITEMS, CATEGORY_TREE } from '../marketplace-data';

export interface SyncStatus {
  synced: boolean;
  lastSync: string;
  errors: string[];
}

export interface OrphanProduct {
  productId: string;
  reason: string;
}

// Sync status tracking
const syncStatus = new Map<string, SyncStatus>();

// Orphan product tracking
const orphanProducts = new Map<string, OrphanProduct>();

// Sync product with Product Manager
export function syncWithProductManager(productId: string): SyncStatus {
  const product = ITEMS.find((item) => item.id === productId);
  
  if (!product) {
    return {
      synced: false,
      lastSync: new Date().toISOString(),
      errors: ['Product not found'],
    };
  }

  const errors: string[] = [];

  // Validate product has required fields
  if (!product.title) errors.push('Missing title');
  if (!product.price || product.price < 0) errors.push('Invalid price');
  if (!product.category) errors.push('Missing category');
  if (!product.author) errors.push('Missing author');
  if (!product.slug) errors.push('Missing slug');

  // Validate category exists
  const categoryExists = CATEGORY_TREE.some((cat) => cat.slug === product.category);
  if (!categoryExists) errors.push('Category does not exist');

  const status: SyncStatus = {
    synced: errors.length === 0,
    lastSync: new Date().toISOString(),
    errors,
  };

  syncStatus.set(`product-manager-${productId}`, status);

  if (!status.synced) {
    orphanProducts.set(productId, {
      productId,
      reason: errors.join(', '),
    });
  } else {
    orphanProducts.delete(productId);
  }

  return status;
}

// Sync product with Pricing Engine
export function syncWithPricingEngine(productId: string): SyncStatus {
  const product = ITEMS.find((item) => item.id === productId);
  
  if (!product) {
    return {
      synced: false,
      lastSync: new Date().toISOString(),
      errors: ['Product not found'],
    };
  }

  const errors: string[] = [];

  // Validate pricing
  if (typeof product.price !== 'number') errors.push('Price must be a number');
  if (product.price < 0) errors.push('Price cannot be negative');
  if (product.price > 100000) errors.push('Price seems unusually high');

  const status: SyncStatus = {
    synced: errors.length === 0,
    lastSync: new Date().toISOString(),
    errors,
  };

  syncStatus.set(`pricing-engine-${productId}`, status);

  if (!status.synced) {
    orphanProducts.set(productId, {
      productId,
      reason: errors.join(', '),
    });
  } else {
    orphanProducts.delete(productId);
  }

  return status;
}

// Sync product with Author Module
export function syncWithAuthorModule(productId: string): SyncStatus {
  const product = ITEMS.find((item) => item.id === productId);
  
  if (!product) {
    return {
      synced: false,
      lastSync: new Date().toISOString(),
      errors: ['Product not found'],
    };
  }

  const errors: string[] = [];

  // Validate author
  if (!product.author) errors.push('Missing author');
  if (product.author.length < 2) errors.push('Author name too short');
  if (product.author.length > 100) errors.push('Author name too long');

  // Check if author has other products (validate author exists)
  const authorProducts = ITEMS.filter((item) => item.author === product.author);
  if (authorProducts.length === 0) {
    errors.push('Author has no products (orphan author)');
  }

  const status: SyncStatus = {
    synced: errors.length === 0,
    lastSync: new Date().toISOString(),
    errors,
  };

  syncStatus.set(`author-module-${productId}`, status);

  if (!status.synced) {
    orphanProducts.set(productId, {
      productId,
      reason: errors.join(', '),
    });
  } else {
    orphanProducts.delete(productId);
  }

  return status;
}

// Sync all products with all systems
export function syncAllProducts(): {
  totalProducts: number;
  synced: number;
  failed: number;
  orphans: OrphanProduct[];
} {
  let synced = 0;
  let failed = 0;

  ITEMS.forEach((product) => {
    const pmStatus = syncWithProductManager(product.id);
    const peStatus = syncWithPricingEngine(product.id);
    const amStatus = syncWithAuthorModule(product.id);

    const allSynced = pmStatus.synced && peStatus.synced && amStatus.synced;

    if (allSynced) {
      synced++;
    } else {
      failed++;
    }
  });

  return {
    totalProducts: ITEMS.length,
    synced,
    failed,
    orphans: Array.from(orphanProducts.values()),
  };
}

// Get orphan products
export function getOrphanProducts(): OrphanProduct[] {
  return Array.from(orphanProducts.values());
}

// Remove orphan product
export function removeOrphanProduct(productId: string): boolean {
  const orphan = orphanProducts.get(productId);
  if (orphan) {
    orphanProducts.delete(productId);
    // In production, also remove from ITEMS array
    return true;
  }
  return false;
}

// Fix orphan product
export function fixOrphanProduct(productId: string): {
  fixed: boolean;
  issues: string[];
} {
  const orphan = orphanProducts.get(productId);
  if (!orphan) {
    return { fixed: false, issues: ['Product is not an orphan'] };
  }

  const issues: string[] = [];
  const product = ITEMS.find((item) => item.id === productId);
  
  if (!product) {
    return { fixed: false, issues: ['Product not found'] };
  }

  // Attempt to fix common issues
  if (!product.title) {
    product.title = 'Untitled Product';
    issues.push('Added default title');
  }

  if (!product.category) {
    product.category = 'plugins';
    issues.push('Set default category');
  }

  if (!product.author) {
    product.author = 'Unknown Author';
    issues.push('Set default author');
  }

  if (!product.slug) {
    product.slug = product.title.toLowerCase().replace(/ /g, '-');
    issues.push('Generated slug from title');
  }

  // Re-sync after fixes
  const pmStatus = syncWithProductManager(productId);
  const peStatus = syncWithPricingEngine(productId);
  const amStatus = syncWithAuthorModule(productId);

  const allSynced = pmStatus.synced && peStatus.synced && amStatus.synced;

  if (allSynced) {
    orphanProducts.delete(productId);
    return { fixed: true, issues };
  }

  return { fixed: false, issues: pmStatus.errors.concat(peStatus.errors, amStatus.errors) };
}

// Get sync status for a product
export function getProductSyncStatus(productId: string): {
  productManager: SyncStatus;
  pricingEngine: SyncStatus;
  authorModule: SyncStatus;
  overallSynced: boolean;
} {
  const pmStatus = syncStatus.get(`product-manager-${productId}`) || { synced: false, lastSync: '', errors: ['Not synced'] };
  const peStatus = syncStatus.get(`pricing-engine-${productId}`) || { synced: false, lastSync: '', errors: ['Not synced'] };
  const amStatus = syncStatus.get(`author-module-${productId}`) || { synced: false, lastSync: '', errors: ['Not synced'] };

  return {
    productManager: pmStatus,
    pricingEngine: peStatus,
    authorModule: amStatus,
    overallSynced: pmStatus.synced && peStatus.synced && amStatus.synced,
  };
}

// Get overall sync statistics
export function getSyncStatistics(): {
  totalProducts: number;
  syncedProducts: number;
  orphanProducts: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
} {
  const totalProducts = ITEMS.length;
  const orphanCount = orphanProducts.size;
  const syncedProducts = totalProducts - orphanCount;

  let systemHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
  
  if (orphanCount > totalProducts * 0.2) {
    systemHealth = 'critical';
  } else if (orphanCount > 0) {
    systemHealth = 'warning';
  }

  return {
    totalProducts,
    syncedProducts,
    orphanProducts: orphanCount,
    systemHealth,
  };
}

// Schedule periodic sync
export function schedulePeriodicSync(intervalHours: number = 24): number {
  return setInterval(() => {
    syncAllProducts();
  }, intervalHours * 60 * 60 * 1000) as unknown as number;
}

// Export sync data
export function exportSyncData(): string {
  return JSON.stringify({
    syncStatus: Array.from(syncStatus.entries()),
    orphanProducts: Array.from(orphanProducts.entries()),
  }, null, 2);
}

// Import sync data
export function importSyncData(json: string): void {
  const data = JSON.parse(json);
  
  if (data.syncStatus) {
    data.syncStatus.forEach(([key, status]: [string, SyncStatus]) => {
      syncStatus.set(key, status);
    });
  }

  if (data.orphanProducts) {
    data.orphanProducts.forEach(([key, orphan]: [string, OrphanProduct]) => {
      orphanProducts.set(key, orphan);
    });
  }
}

// Clear all sync data
export function clearSyncData(): void {
  syncStatus.clear();
  orphanProducts.clear();
}
