// Self-Heal Extension
// Auto-detect and fix missing price, rating, tag issues

import { ITEMS, CATEGORY_TREE } from '../marketplace-data';

export interface HealIssue {
  productId: string;
  issueType: 'missing_price' | 'invalid_price' | 'missing_rating' | 'invalid_rating' | 'invalid_tag' | 'missing_thumbnail' | 'missing_description';
  severity: 'critical' | 'warning' | 'info';
  autoFixed: boolean;
  fixApplied?: string;
}

export interface HealReport {
  totalIssues: number;
  autoFixed: number;
  requiresManual: number;
  issues: HealIssue[];
}

// Issue tracking
const healIssues = new Map<string, HealIssue>();

// Detect missing price
export function detectMissingPrice(): HealIssue[] {
  const issues: HealIssue[] = [];

  ITEMS.forEach((item) => {
    if (item.price === undefined || item.price === null) {
      const issue: HealIssue = {
        productId: item.id,
        issueType: 'missing_price',
        severity: 'critical',
        autoFixed: false,
      };

      // Auto-fix: set default price
      item.price = 9.99;
      issue.autoFixed = true;
      issue.fixApplied = 'Set default price to $9.99';

      issues.push(issue);
      healIssues.set(`${item.id}-price`, issue);
    }
  });

  return issues;
}

// Detect invalid price
export function detectInvalidPrice(): HealIssue[] {
  const issues: HealIssue[] = [];

  ITEMS.forEach((item) => {
    if (typeof item.price !== 'number' || item.price < 0) {
      const issue: HealIssue = {
        productId: item.id,
        issueType: 'invalid_price',
        severity: 'critical',
        autoFixed: false,
      };

      // Auto-fix: set to valid price
      item.price = Math.max(0, typeof item.price === 'number' ? item.price : 9.99);
      issue.autoFixed = true;
      issue.fixApplied = 'Fixed to valid price';

      issues.push(issue);
      healIssues.set(`${item.id}-price`, issue);
    }
  });

  return issues;
}

// Detect missing rating
export function detectMissingRating(): HealIssue[] {
  const issues: HealIssue[] = [];

  ITEMS.forEach((item) => {
    if (item.rating === undefined || item.rating === null) {
      const issue: HealIssue = {
        productId: item.id,
        issueType: 'missing_rating',
        severity: 'warning',
        autoFixed: false,
      };

      // Auto-fix: set default rating
      item.rating = 4.0;
      issue.autoFixed = true;
      issue.fixApplied = 'Set default rating to 4.0';

      issues.push(issue);
      healIssues.set(`${item.id}-rating`, issue);
    }
  });

  return issues;
}

// Detect invalid rating
export function detectInvalidRating(): HealIssue[] {
  const issues: HealIssue[] = [];

  ITEMS.forEach((item) => {
    if (item.rating < 0 || item.rating > 5) {
      const issue: HealIssue = {
        productId: item.id,
        issueType: 'invalid_rating',
        severity: 'warning',
        autoFixed: false,
      };

      // Auto-fix: clamp to valid range
      item.rating = Math.max(0, Math.min(5, item.rating));
      issue.autoFixed = true;
      issue.fixApplied = 'Clamped to valid range (0-5)';

      issues.push(issue);
      healIssues.set(`${item.id}-rating`, issue);
    }
  });

  return issues;
}

// Detect invalid tags
export function detectInvalidTags(): HealIssue[] {
  const issues: HealIssue[] = [];

  ITEMS.forEach((item) => {
    if (!item.tags || !Array.isArray(item.tags) || item.tags.length === 0) {
      const issue: HealIssue = {
        productId: item.id,
        issueType: 'invalid_tag',
        severity: 'warning',
        autoFixed: false,
      };

      // Auto-fix: add default tags based on category
      item.tags = [item.category, 'plugin', 'software'];
      issue.autoFixed = true;
      issue.fixApplied = 'Added default tags based on category';

      issues.push(issue);
      healIssues.set(`${item.id}-tags`, issue);
    }
  });

  return issues;
}

// Detect missing thumbnail
export function detectMissingThumbnail(): HealIssue[] {
  const issues: HealIssue[] = [];

  ITEMS.forEach((item) => {
    if (!item.thumbnail || item.thumbnail.length === 0) {
      const issue: HealIssue = {
        productId: item.id,
        issueType: 'missing_thumbnail',
        severity: 'critical',
        autoFixed: false,
      };

      // Auto-fix: set placeholder
      item.thumbnail = '/images/placeholder.png';
      issue.autoFixed = true;
      issue.fixApplied = 'Set placeholder thumbnail';

      issues.push(issue);
      healIssues.set(`${item.id}-thumbnail`, issue);
    }
  });

  return issues;
}

// Detect missing description
export function detectMissingDescription(): HealIssue[] {
  const issues: HealIssue[] = [];

  ITEMS.forEach((item) => {
    if (!item.description || item.description.length < 10) {
      const issue: HealIssue = {
        productId: item.id,
        issueType: 'missing_description',
        severity: 'warning',
        autoFixed: false,
      };

      // Auto-fix: set default description
      item.description = `${item.title} - A high-quality ${item.category} product.`;
      issue.autoFixed = true;
      issue.fixApplied = 'Generated default description';

      issues.push(issue);
      healIssues.set(`${item.id}-description`, issue);
    }
  });

  return issues;
}

// Run all heal checks
export function runAllHealChecks(): HealReport {
  const allIssues: HealIssue[] = [];

  allIssues.push(...detectMissingPrice());
  allIssues.push(...detectInvalidPrice());
  allIssues.push(...detectMissingRating());
  allIssues.push(...detectInvalidRating());
  allIssues.push(...detectInvalidTags());
  allIssues.push(...detectMissingThumbnail());
  allIssues.push(...detectMissingDescription());

  const autoFixed = allIssues.filter((i) => i.autoFixed).length;
  const requiresManual = allIssues.filter((i) => !i.autoFixed).length;

  return {
    totalIssues: allIssues.length,
    autoFixed,
    requiresManual,
    issues: allIssues,
  };
}

// Hide product if critical issues remain
export function hideProductIfCritical(productId: string): boolean {
  const product = ITEMS.find((item) => item.id === productId);
  if (!product) return false;

  const criticalIssues = Array.from(healIssues.values()).filter(
    (issue) => issue.productId === productId && issue.severity === 'critical' && !issue.autoFixed
  );

  if (criticalIssues.length > 0) {
    // In production, set a hidden flag instead of removing
    // For now, we'll just mark it
    console.warn(`Product ${productId} has critical unfixable issues and should be hidden`);
    return true;
  }

  return false;
}

// Get heal statistics
export function getHealStatistics(): {
  totalIssues: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
  autoFixedRate: number;
} {
  const issues = Array.from(healIssues.values());
  const byType: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};

  issues.forEach((issue) => {
    byType[issue.issueType] = (byType[issue.issueType] || 0) + 1;
    bySeverity[issue.severity] = (bySeverity[issue.severity] || 0) + 1;
  });

  const autoFixed = issues.filter((i) => i.autoFixed).length;
  const autoFixedRate = issues.length > 0 ? (autoFixed / issues.length) * 100 : 0;

  return {
    totalIssues: issues.length,
    byType,
    bySeverity,
    autoFixedRate,
  };
}

// Clear heal issues
export function clearHealIssues(): void {
  healIssues.clear();
}

// Export heal data
export function exportHealData(): string {
  return JSON.stringify(Array.from(healIssues.values()), null, 2);
}

// Import heal data
export function importHealData(json: string): void {
  const issues = JSON.parse(json) as HealIssue[];
  issues.forEach((issue) => {
    healIssues.set(`${issue.productId}-${issue.issueType}`, issue);
  });
}

// Schedule periodic heal checks
export function scheduleHealChecks(intervalHours: number = 24): number {
  return setInterval(() => {
    runAllHealChecks();
  }, intervalHours * 60 * 60 * 1000) as unknown as number;
}
