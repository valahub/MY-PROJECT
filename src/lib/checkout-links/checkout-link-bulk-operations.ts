// Checkout Link Bulk Operations
// Activate, deactivate, delete

import type { CheckoutLink, BulkOperationResult, BulkOperationType } from './checkout-link-types';
import { checkoutLinkStatusEngine } from './checkout-link-status';

// ============================================
// CHECKOUT LINK BULK OPERATIONS ENGINE
// ============================================

export class CheckoutLinkBulkOperationsEngine {
  private checkoutLinks: Map<string, CheckoutLink> = new Map();

  // ============================================
  // BULK ACTIVATE
  // ============================================

  async bulkActivate(checkoutLinkIds: string[]): Promise<BulkOperationResult> {
    let processedCount = 0;
    const errors: Array<{ checkoutLinkId: string; error: string }> = [];

    for (const checkoutLinkId of checkoutLinkIds) {
      const checkoutLink = this.checkoutLinks.get(checkoutLinkId);

      if (!checkoutLink) {
        errors.push({
          checkoutLinkId,
          error: 'Checkout link not found',
        });
        continue;
      }

      try {
        checkoutLink.status = checkoutLinkStatusEngine.transition(checkoutLink.status, 'active');
        checkoutLink.updatedAt = new Date().toISOString();
        processedCount++;
      } catch (error) {
        errors.push({
          checkoutLinkId,
          error: error instanceof Error ? error.message : 'Failed to activate',
        });
      }
    }

    console.log(`[BulkOperations] Activated ${processedCount} checkout links, ${errors.length} failed`);

    return {
      success: errors.length === 0,
      processed: processedCount,
      failed: errors.length,
      errors,
      timestamp: new Date().toISOString(),
    };
  }

  // ============================================
  // BULK DEACTIVATE
  // ============================================

  async bulkDeactivate(checkoutLinkIds: string[]): Promise<BulkOperationResult> {
    let processedCount = 0;
    const errors: Array<{ checkoutLinkId: string; error: string }> = [];

    for (const checkoutLinkId of checkoutLinkIds) {
      const checkoutLink = this.checkoutLinks.get(checkoutLinkId);

      if (!checkoutLink) {
        errors.push({
          checkoutLinkId,
          error: 'Checkout link not found',
        });
        continue;
      }

      try {
        checkoutLink.status = checkoutLinkStatusEngine.transition(checkoutLink.status, 'inactive');
        checkoutLink.updatedAt = new Date().toISOString();
        processedCount++;
      } catch (error) {
        errors.push({
          checkoutLinkId,
          error: error instanceof Error ? error.message : 'Failed to deactivate',
        });
      }
    }

    console.log(`[BulkOperations] Deactivated ${processedCount} checkout links, ${errors.length} failed`);

    return {
      success: errors.length === 0,
      processed: processedCount,
      failed: errors.length,
      errors,
      timestamp: new Date().toISOString(),
    };
  }

  // ============================================
  // BULK DELETE
  // ============================================

  async bulkDelete(checkoutLinkIds: string[]): Promise<BulkOperationResult> {
    let processedCount = 0;
    const errors: Array<{ checkoutLinkId: string; error: string }> = [];

    for (const checkoutLinkId of checkoutLinkIds) {
      const checkoutLink = this.checkoutLinks.get(checkoutLinkId);

      if (!checkoutLink) {
        errors.push({
          checkoutLinkId,
          error: 'Checkout link not found',
        });
        continue;
      }

      try {
        this.checkoutLinks.delete(checkoutLinkId);
        processedCount++;
      } catch (error) {
        errors.push({
          checkoutLinkId,
          error: error instanceof Error ? error.message : 'Failed to delete',
        });
      }
    }

    console.log(`[BulkOperations] Deleted ${processedCount} checkout links, ${errors.length} failed`);

    return {
      success: errors.length === 0,
      processed: processedCount,
      failed: errors.length,
      errors,
      timestamp: new Date().toISOString(),
    };
  }

  // ============================================
  // BULK OPERATION
  // ============================================

  async bulkOperation(operation: BulkOperationType, checkoutLinkIds: string[]): Promise<BulkOperationResult> {
    switch (operation) {
      case 'activate':
        return await this.bulkActivate(checkoutLinkIds);
      case 'deactivate':
        return await this.bulkDeactivate(checkoutLinkIds);
      case 'delete':
        return await this.bulkDelete(checkoutLinkIds);
      default:
        return {
          success: false,
          processed: 0,
          failed: checkoutLinkIds.length,
          errors: checkoutLinkIds.map((id) => ({
            checkoutLinkId: id,
            error: 'Invalid operation type',
          })),
          timestamp: new Date().toISOString(),
        };
    }
  }

  // ============================================
  // BULK UPDATE STATUS
  // ============================================

  async bulkUpdateStatus(checkoutLinkIds: string[], newStatus: 'active' | 'inactive'): Promise<BulkOperationResult> {
    if (newStatus === 'active') {
      return await this.bulkActivate(checkoutLinkIds);
    } else {
      return await this.bulkDeactivate(checkoutLinkIds);
    }
  }

  // ============================================
  // BULK UPDATE EXPIRY DATE
  // ============================================

  async bulkUpdateExpiryDate(checkoutLinkIds: string[], newExpiryDate: string): Promise<BulkOperationResult> {
    let processedCount = 0;
    const errors: Array<{ checkoutLinkId: string; error: string }> = [];

    for (const checkoutLinkId of checkoutLinkIds) {
      const checkoutLink = this.checkoutLinks.get(checkoutLinkId);

      if (!checkoutLink) {
        errors.push({
          checkoutLinkId,
          error: 'Checkout link not found',
        });
        continue;
      }

      try {
        checkoutLink.expiresAt = newExpiryDate;
        checkoutLink.updatedAt = new Date().toISOString();
        processedCount++;
      } catch (error) {
        errors.push({
          checkoutLinkId,
          error: error instanceof Error ? error.message : 'Failed to update expiry date',
        });
      }
    }

    console.log(`[BulkOperations] Updated expiry date for ${processedCount} checkout links, ${errors.length} failed`);

    return {
      success: errors.length === 0,
      processed: processedCount,
      failed: errors.length,
      errors,
      timestamp: new Date().toISOString(),
    };
  }

  // ============================================
  // BULK EXTEND EXPIRY
  // ============================================

  async bulkExtendExpiry(checkoutLinkIds: string[], additionalDays: number): Promise<BulkOperationResult> {
    let processedCount = 0;
    const errors: Array<{ checkoutLinkId: string; error: string }> = [];

    for (const checkoutLinkId of checkoutLinkIds) {
      const checkoutLink = this.checkoutLinks.get(checkoutLinkId);

      if (!checkoutLink) {
        errors.push({
          checkoutLinkId,
          error: 'Checkout link not found',
        });
        continue;
      }

      try {
        if (checkoutLink.expiresAt) {
          const currentExpiry = new Date(checkoutLink.expiresAt);
          const newExpiry = new Date(currentExpiry.getTime() + additionalDays * 24 * 60 * 60 * 1000);
          checkoutLink.expiresAt = newExpiry.toISOString();
          checkoutLink.updatedAt = new Date().toISOString();
          processedCount++;
        } else {
          errors.push({
            checkoutLinkId,
            error: 'Checkout link has no expiry date',
          });
        }
      } catch (error) {
        errors.push({
          checkoutLinkId,
          error: error instanceof Error ? error.message : 'Failed to extend expiry',
        });
      }
    }

    console.log(`[BulkOperations] Extended expiry for ${processedCount} checkout links, ${errors.length} failed`);

    return {
      success: errors.length === 0,
      processed: processedCount,
      failed: errors.length,
      errors,
      timestamp: new Date().toISOString(),
    };
  }

  // ============================================
  // REGISTER CHECKOUT LINK
  // ============================================

  registerCheckoutLink(checkoutLink: CheckoutLink): void {
    this.checkoutLinks.set(checkoutLink.id, checkoutLink);
  }

  // ============================================
  // UNREGISTER CHECKOUT LINK
  // ============================================

  unregisterCheckoutLink(checkoutLinkId: string): void {
    this.checkoutLinks.delete(checkoutLinkId);
  }

  // ============================================
  // GET CHECKOUT LINK
  // ============================================

  getCheckoutLink(checkoutLinkId: string): CheckoutLink | null {
    return this.checkoutLinks.get(checkoutLinkId) || null;
  }

  // ============================================
  // GET ALL CHECKOUT LINKS
  // ============================================

  getAllCheckoutLinks(): CheckoutLink[] {
    return Array.from(this.checkoutLinks.values());
  }
}

// Export singleton instance
export const checkoutLinkBulkOperationsEngine = new CheckoutLinkBulkOperationsEngine();

// ============================================
// REACT HOOK FOR BULK OPERATIONS
// ============================================

import { useState, useCallback } from 'react';

export function useCheckoutLinkBulkOperations() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bulkActivate = useCallback(async (checkoutLinkIds: string[]) => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await checkoutLinkBulkOperationsEngine.bulkActivate(checkoutLinkIds);
      if (!result.success) {
        setError(`Failed to activate ${result.failed} checkout links`);
      }
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to activate checkout links';
      setError(errorMessage);
      return {
        success: false,
        processed: 0,
        failed: checkoutLinkIds.length,
        errors: checkoutLinkIds.map((id) => ({ checkoutLinkId: id, error: errorMessage })),
        timestamp: new Date().toISOString(),
      };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const bulkDeactivate = useCallback(async (checkoutLinkIds: string[]) => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await checkoutLinkBulkOperationsEngine.bulkDeactivate(checkoutLinkIds);
      if (!result.success) {
        setError(`Failed to deactivate ${result.failed} checkout links`);
      }
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to deactivate checkout links';
      setError(errorMessage);
      return {
        success: false,
        processed: 0,
        failed: checkoutLinkIds.length,
        errors: checkoutLinkIds.map((id) => ({ checkoutLinkId: id, error: errorMessage })),
        timestamp: new Date().toISOString(),
      };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const bulkDelete = useCallback(async (checkoutLinkIds: string[]) => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await checkoutLinkBulkOperationsEngine.bulkDelete(checkoutLinkIds);
      if (!result.success) {
        setError(`Failed to delete ${result.failed} checkout links`);
      }
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete checkout links';
      setError(errorMessage);
      return {
        success: false,
        processed: 0,
        failed: checkoutLinkIds.length,
        errors: checkoutLinkIds.map((id) => ({ checkoutLinkId: id, error: errorMessage })),
        timestamp: new Date().toISOString(),
      };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const bulkOperation = useCallback(async (operation: BulkOperationType, checkoutLinkIds: string[]) => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await checkoutLinkBulkOperationsEngine.bulkOperation(operation, checkoutLinkIds);
      if (!result.success) {
        setError(`Failed to complete bulk operation`);
      }
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to complete bulk operation';
      setError(errorMessage);
      return {
        success: false,
        processed: 0,
        failed: checkoutLinkIds.length,
        errors: checkoutLinkIds.map((id) => ({ checkoutLinkId: id, error: errorMessage })),
        timestamp: new Date().toISOString(),
      };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isProcessing,
    error,
    bulkActivate,
    bulkDeactivate,
    bulkDelete,
    bulkOperation,
    clearError,
  };
}
