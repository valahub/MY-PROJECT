// Edge Case Handling
// Handle duplicate products, invalid slugs, empty categories

import { ITEMS, CATEGORY_TREE } from '../marketplace-data';

export interface EdgeCase {
  type: 'duplicate_product' | 'invalid_slug' | 'empty_category' | 'missing_data' | 'orphan_reference';
  severity: 'critical' | 'warning' | 'info';
  description: string;
  affectedIds: string[];
  autoFixed: boolean;
}

// Edge case tracking
const edgeCases = new Map<string, EdgeCase>();

// Detect duplicate products
export function detectDuplicateProducts(): EdgeCase[] {
  const issues: EdgeCase[] = [];
  const slugMap = new Map<string, string[]>();
  const titleMap = new Map<string, string[]>();

  ITEMS.forEach((item) => {
    // Check for duplicate slugs
    if (item.slug) {
      const existing = slugMap.get(item.slug) || [];
      existing.push(item.id);
      slugMap.set(item.slug, existing);
    }

    // Check for duplicate titles
    if (item.title) {
      const existing = titleMap.get(item.title.toLowerCase()) || [];
      existing.push(item.id);
      titleMap.set(item.title.toLowerCase(), existing);
    }
  });

  // Find duplicates
  slugMap.forEach((ids, slug) => {
    if (ids.length > 1) {
      issues.push({
        type: 'duplicate_product',
        severity: 'critical',
        description: `Duplicate slug detected: ${slug}`,
        affectedIds: ids,
        autoFixed: false,
      });
    }
  });

  titleMap.forEach((ids, title) => {
    if (ids.length > 1) {
      issues.push({
        type: 'duplicate_product',
        severity: 'warning',
        description: `Duplicate title detected: ${title}`,
        affectedIds: ids,
        autoFixed: false,
      });
    }
  });

  return issues;
}

// Detect invalid slugs
export function detectInvalidSlugs(): EdgeCase[] {
  const issues: EdgeCase[] = [];

  ITEMS.forEach((item) => {
    if (!item.slug) {
      issues.push({
        type: 'invalid_slug',
        severity: 'critical',
        description: `Missing slug for product: ${item.id}`,
        affectedIds: [item.id],
        autoFixed: false,
      });
    } else {
      // Check slug format
      const validSlug = /^[a-z0-9-]+$/.test(item.slug);
      if (!validSlug) {
        issues.push({
          type: 'invalid_slug',
          severity: 'warning',
          description: `Invalid slug format: ${item.slug}`,
          affectedIds: [item.id],
          autoFixed: false,
        });
      }
    }
  });

  return issues;
}

// Detect empty categories
export function detectEmptyCategories(): EdgeCase[] {
  const issues: EdgeCase[] = [];

  CATEGORY_TREE.forEach((category) => {
    const productsInCategory = ITEMS.filter((item) => item.category === category.slug);
    
    if (productsInCategory.length === 0) {
      issues.push({
        type: 'empty_category',
        severity: 'warning',
        description: `Empty category: ${category.title}`,
        affectedIds: [category.slug],
        autoFixed: false,
      });
    }
  });

  return issues;
}

// Detect missing data
export function detectMissingData(): EdgeCase[] {
  const issues: EdgeCase[] = [];

  ITEMS.forEach((item) => {
    const missingFields: string[] = [];

    if (!item.title) missingFields.push('title');
    if (!item.description) missingFields.push('description');
    if (!item.price) missingFields.push('price');
    if (!item.category) missingFields.push('category');
    if (!item.author) missingFields.push('author');
    if (!item.thumbnail) missingFields.push('thumbnail');
    if (!item.tags || item.tags.length === 0) missingFields.push('tags');

    if (missingFields.length > 0) {
      issues.push({
        type: 'missing_data',
        severity: missingFields.includes('title') || missingFields.includes('price') ? 'critical' : 'warning',
        description: `Missing fields: ${missingFields.join(', ')}`,
        affectedIds: [item.id],
        autoFixed: false,
      });
    }
  });

  return issues;
}

// Detect orphan references (products referencing non-existent categories)
export function detectOrphanReferences(): EdgeCase[] {
  const issues: EdgeCase[] = [];

  ITEMS.forEach((item) => {
    if (item.category) {
      const categoryExists = CATEGORY_TREE.some((cat) => cat.slug === item.category);
      if (!categoryExists) {
        issues.push({
          type: 'orphan_reference',
          severity: 'critical',
          description: `Product references non-existent category: ${item.category}`,
          affectedIds: [item.id],
          autoFixed: false,
        });
      }
    }
  });

  return issues;
}

// Fix duplicate products (remove duplicates, keep first)
export function fixDuplicateProducts(): {
  fixed: number;
  removed: string[];
} {
  const slugMap = new Map<string, string[]>();
  const removed: string[] = [];

  ITEMS.forEach((item) => {
    if (item.slug) {
      const existing = slugMap.get(item.slug) || [];
      existing.push(item.id);
      slugMap.set(item.slug, existing);
    }
  });

  slugMap.forEach((ids) => {
    if (ids.length > 1) {
      // Keep first, remove rest
      const toRemove = ids.slice(1);
      removed.push(...toRemove);
    }
  });

  return {
    fixed: removed.length,
    removed,
  };
}

// Fix invalid slugs
export function fixInvalidSlugs(): {
  fixed: number;
  changes: Array<{ id: string; oldSlug: string; newSlug: string }>;
} {
  const changes: Array<{ id: string; oldSlug: string; newSlug: string }> = [];

  ITEMS.forEach((item) => {
    if (!item.slug) {
      const newSlug = item.title.toLowerCase().replace(/[^a-z0-9]/g, '-');
      item.slug = newSlug;
      changes.push({ id: item.id, oldSlug: '', newSlug });
    } else {
      const validSlug = /^[a-z0-9-]+$/.test(item.slug);
      if (!validSlug) {
        const newSlug = item.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
        const oldSlug = item.slug;
        item.slug = newSlug;
        changes.push({ id: item.id, oldSlug, newSlug });
      }
    }
  });

  return {
    fixed: changes.length,
    changes,
  };
}

// Fix missing data
export function fixMissingData(): {
  fixed: number;
  changes: Array<{ id: string; field: string; value: any }>;
} {
  const changes: Array<{ id: string; field: string; value: any }> = [];

  ITEMS.forEach((item) => {
    if (!item.title) {
      item.title = 'Untitled Product';
      changes.push({ id: item.id, field: 'title', value: 'Untitled Product' });
    }
    if (!item.description) {
      item.description = 'No description available.';
      changes.push({ id: item.id, field: 'description', value: 'No description available.' });
    }
    if (!item.price) {
      item.price = 0;
      changes.push({ id: item.id, field: 'price', value: 0 });
    }
    if (!item.category) {
      item.category = 'plugins';
      changes.push({ id: item.id, field: 'category', value: 'plugins' });
    }
    if (!item.author) {
      item.author = 'Unknown Author';
      changes.push({ id: item.id, field: 'author', value: 'Unknown Author' });
    }
    if (!item.thumbnail) {
      item.thumbnail = '/images/placeholder.png';
      changes.push({ id: item.id, field: 'thumbnail', value: '/images/placeholder.png' });
    }
    if (!item.tags || item.tags.length === 0) {
      item.tags = ['plugin', 'software'];
      changes.push({ id: item.id, field: 'tags', value: ['plugin', 'software'] });
    }
  });

  return {
    fixed: changes.length,
    changes,
  };
}

// Redirect invalid slug (in production, this would set up server redirects)
export function redirectInvalidSlug(oldSlug: string, newSlug: string): void {
  console.log(`Redirect: ${oldSlug} -> ${newSlug}`);
  // In production, add to redirect configuration
}

// Handle empty category (redirect to parent or show message)
export function handleEmptyCategory(categorySlug: string): {
  action: 'redirect' | 'show_message';
  target?: string;
  message?: string;
} {
  const category = CATEGORY_TREE.find((cat) => cat.slug === categorySlug);
  
  if (!category) {
    return {
      action: 'redirect',
      target: '/marketplace',
    };
  }

  const productsInCategory = ITEMS.filter((item) => item.category === categorySlug);
  
  if (productsInCategory.length === 0) {
    return {
      action: 'show_message',
      message: `No products found in ${category.title}. Browse other categories.`,
    };
  }

  return {
    action: 'show_message',
    message: '',
  };
}

// Run all edge case checks
export function runAllEdgeCaseChecks(): EdgeCase[] {
  const allIssues: EdgeCase[] = [];

  allIssues.push(...detectDuplicateProducts());
  allIssues.push(...detectInvalidSlugs());
  allIssues.push(...detectEmptyCategories());
  allIssues.push(...detectMissingData());
  allIssues.push(...detectOrphanReferences());

  return allIssues;
}

// Auto-fix all fixable issues
export function autoFixAllIssues(): {
  duplicatesFixed: number;
  slugsFixed: number;
  missingDataFixed: number;
  totalFixed: number;
} {
  const duplicateFix = fixDuplicateProducts();
  const slugFix = fixInvalidSlugs();
  const dataFix = fixMissingData();

  return {
    duplicatesFixed: duplicateFix.fixed,
    slugsFixed: slugFix.fixed,
    missingDataFixed: dataFix.fixed,
    totalFixed: duplicateFix.fixed + slugFix.fixed + dataFix.fixed,
  };
}

// Get edge case statistics
export function getEdgeCaseStatistics(): {
  totalIssues: number;
  critical: number;
  warning: number;
  info: number;
  byType: Record<string, number>;
} {
  const issues = runAllEdgeCaseChecks();
  const byType: Record<string, number> = {};

  issues.forEach((issue) => {
    byType[issue.type] = (byType[issue.type] || 0) + 1;
  });

  return {
    totalIssues: issues.length,
    critical: issues.filter((i) => i.severity === 'critical').length,
    warning: issues.filter((i) => i.severity === 'warning').length,
    info: issues.filter((i) => i.severity === 'info').length,
    byType,
  };
}

// Export edge case data
export function exportEdgeCaseData(): string {
  return JSON.stringify(Array.from(edgeCases.entries()), null, 2);
}

// Import edge case data
export function importEdgeCaseData(json: string): void {
  const data = JSON.parse(json) as Array<[string, EdgeCase]>;
  data.forEach(([key, edgeCase]) => {
    edgeCases.set(key, edgeCase);
  });
}

// Clear all edge cases
export function clearAllEdgeCases(): void {
  edgeCases.clear();
}
