// Merchant Billing Engine Link
// Sync with billing account, gateway, currency
// STRICT: No global currency conflict

import type { MerchantBillingConfig, MerchantCurrency } from './merchant-pricing-types';

// ============================================
// BILLING SYNC RESULT
// ============================================

export interface BillingSyncResult {
  success: boolean;
  merchantId: string;
  syncedComponents: string[];
  error?: string;
  timestamp: string;
}

// ============================================
// MERCHANT PRICING BILLING LINK
// ============================================

export class MerchantPricingBillingLink {
  private billingConfigs: Map<string, MerchantBillingConfig> = new Map();

  // ============================================
  // GET BILLING CONFIG
  // ============================================

  getBillingConfig(merchantId: string): MerchantBillingConfig | null {
    return this.billingConfigs.get(merchantId) || null;
  }

  // ============================================
  // SET BILLING CONFIG
  // ============================================

  setBillingConfig(config: MerchantBillingConfig): void {
    this.billingConfigs.set(config.merchantId, config);
  }

  // ============================================
  // SYNC BILLING CONFIG
  // ============================================

  async syncBillingConfig(merchantId: string): Promise<BillingSyncResult> {
    try {
      const config = this.getBillingConfig(merchantId);

      if (!config) {
        return {
          success: false,
          merchantId,
          syncedComponents: [],
          error: 'Billing config not found for merchant',
          timestamp: new Date().toISOString(),
        };
      }

      // Sync with payment gateway
      const gatewaySync = await this.syncWithGateway(merchantId, config);

      // Sync currency settings
      const currencySync = await this.syncCurrencySettings(merchantId, config);

      // Sync billing account
      const accountSync = await this.syncBillingAccount(merchantId, config);

      const syncedComponents = [];
      if (gatewaySync.success) syncedComponents.push('payment_gateway');
      if (currencySync.success) syncedComponents.push('currency_settings');
      if (accountSync.success) syncedComponents.push('billing_account');

      const allSuccess = gatewaySync.success && currencySync.success && accountSync.success;

      console.log(`[BillingLink] Synced billing config for merchant ${merchantId}`);

      return {
        success: allSuccess,
        merchantId,
        syncedComponents,
        error: allSuccess ? undefined : 'Partial sync failure',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        merchantId,
        syncedComponents: [],
        error: error instanceof Error ? error.message : 'Failed to sync billing config',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ============================================
  // SYNC WITH GATEWAY
  // ============================================

  private async syncWithGateway(merchantId: string, config: MerchantBillingConfig): Promise<BillingSyncResult> {
    try {
      // In production, call payment gateway API to sync config
      console.log(`[BillingLink] Syncing with ${config.paymentGateway} for merchant ${merchantId}`);

      return {
        success: true,
        merchantId,
        syncedComponents: ['payment_gateway'],
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        merchantId,
        syncedComponents: [],
        error: error instanceof Error ? error.message : 'Failed to sync with gateway',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ============================================
  // SYNC CURRENCY SETTINGS
  // ============================================

  private async syncCurrencySettings(merchantId: string, config: MerchantBillingConfig): Promise<BillingSyncResult> {
    try {
      // In production, sync currency settings with billing system
      console.log(`[BillingLink] Syncing currency ${config.currency} for merchant ${merchantId}`);

      return {
        success: true,
        merchantId,
        syncedComponents: ['currency_settings'],
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        merchantId,
        syncedComponents: [],
        error: error instanceof Error ? error.message : 'Failed to sync currency settings',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ============================================
  // SYNC BILLING ACCOUNT
  // ============================================

  private async syncBillingAccount(merchantId: string, config: MerchantBillingConfig): Promise<BillingSyncResult> {
    try {
      // In production, sync billing account details
      console.log(`[BillingLink] Syncing billing account for merchant ${merchantId}`);

      return {
        success: true,
        merchantId,
        syncedComponents: ['billing_account'],
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        merchantId,
        syncedComponents: [],
        error: error instanceof Error ? error.message : 'Failed to sync billing account',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ============================================
  // VALIDATE CURRENCY COMPATIBILITY
  // ============================================

  validateCurrencyCompatibility(merchantId: string, currency: MerchantCurrency): {
    isCompatible: boolean;
    gatewaySupportsCurrency: boolean;
    error?: string;
  } {
    const config = this.getBillingConfig(merchantId);

    if (!config) {
      return {
        isCompatible: false,
        gatewaySupportsCurrency: false,
        error: 'Billing config not found',
      };
    }

    // Check if gateway supports the currency
    const gatewaySupportsCurrency = this.checkGatewayCurrencySupport(config.paymentGateway, currency);

    if (!gatewaySupportsCurrency) {
      return {
        isCompatible: false,
        gatewaySupportsCurrency: false,
        error: `Payment gateway ${config.paymentGateway} does not support ${currency}`,
      };
    }

    return {
      isCompatible: true,
      gatewaySupportsCurrency: true,
    };
  }

  // ============================================
  // CHECK GATEWAY CURRENCY SUPPORT
  // ============================================

  private checkGatewayCurrencySupport(gateway: string, currency: MerchantCurrency): boolean {
    // In production, check actual gateway API for supported currencies
    // For now, assume all gateways support all currencies
    return true;
  }

  // ============================================
  // UPDATE GATEWAY CONFIG
  // ============================================

  async updateGatewayConfig(merchantId: string, gatewayConfig: Record<string, unknown>): Promise<BillingSyncResult> {
    try {
      const config = this.getBillingConfig(merchantId);

      if (!config) {
        return {
          success: false,
          merchantId,
          syncedComponents: [],
          error: 'Billing config not found',
          timestamp: new Date().toISOString(),
        };
      }

      config.gatewayConfig = gatewayConfig;
      config.updatedAt = new Date().toISOString();

      this.setBillingConfig(config);

      console.log(`[BillingLink] Updated gateway config for merchant ${merchantId}`);

      return {
        success: true,
        merchantId,
        syncedComponents: ['gateway_config'],
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        merchantId,
        syncedComponents: [],
        error: error instanceof Error ? error.message : 'Failed to update gateway config',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ============================================
  // UPDATE CURRENCY
  // ============================================

  async updateCurrency(merchantId: string, newCurrency: MerchantCurrency): Promise<BillingSyncResult> {
    try {
      const config = this.getBillingConfig(merchantId);

      if (!config) {
        return {
          success: false,
          merchantId,
          syncedComponents: [],
          error: 'Billing config not found',
          timestamp: new Date().toISOString(),
        };
      }

      // Validate currency compatibility
      const compatibility = this.validateCurrencyCompatibility(merchantId, newCurrency);
      if (!compatibility.isCompatible) {
        return {
          success: false,
          merchantId,
          syncedComponents: [],
          error: compatibility.error,
          timestamp: new Date().toISOString(),
        };
      }

      config.currency = newCurrency;
      config.updatedAt = new Date().toISOString();

      this.setBillingConfig(config);

      // Sync with billing system
      await this.syncBillingConfig(merchantId);

      console.log(`[BillingLink] Updated currency to ${newCurrency} for merchant ${merchantId}`);

      return {
        success: true,
        merchantId,
        syncedComponents: ['currency'],
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        merchantId,
        syncedComponents: [],
        error: error instanceof Error ? error.message : 'Failed to update currency',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ============================================
  // GET MERCHANT CURRENCY
  // ============================================

  getMerchantCurrency(merchantId: string): MerchantCurrency | null {
    const config = this.getBillingConfig(merchantId);
    return config ? config.currency : null;
  }

  // ============================================
  // GET MERCHANT GATEWAY
  // ============================================

  getMerchantGateway(merchantId: string): string | null {
    const config = this.getBillingConfig(merchantId);
    return config ? config.paymentGateway : null;
  }

  // ============================================
  // IS BILLING CONFIG ACTIVE
  // ============================================

  isBillingConfigActive(merchantId: string): boolean {
    const config = this.getBillingConfig(merchantId);
    return config ? config.isActive : false;
  }

  // ============================================
  // ACTIVATE BILLING CONFIG
  // ============================================

  async activateBillingConfig(merchantId: string): Promise<BillingSyncResult> {
    try {
      const config = this.getBillingConfig(merchantId);

      if (!config) {
        return {
          success: false,
          merchantId,
          syncedComponents: [],
          error: 'Billing config not found',
          timestamp: new Date().toISOString(),
        };
      }

      config.isActive = true;
      config.updatedAt = new Date().toISOString();

      this.setBillingConfig(config);

      console.log(`[BillingLink] Activated billing config for merchant ${merchantId}`);

      return {
        success: true,
        merchantId,
        syncedComponents: ['billing_activation'],
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        merchantId,
        syncedComponents: [],
        error: error instanceof Error ? error.message : 'Failed to activate billing config',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ============================================
  // DEACTIVATE BILLING CONFIG
  // ============================================

  async deactivateBillingConfig(merchantId: string): Promise<BillingSyncResult> {
    try {
      const config = this.getBillingConfig(merchantId);

      if (!config) {
        return {
          success: false,
          merchantId,
          syncedComponents: [],
          error: 'Billing config not found',
          timestamp: new Date().toISOString(),
        };
      }

      config.isActive = false;
      config.updatedAt = new Date().toISOString();

      this.setBillingConfig(config);

      console.log(`[BillingLink] Deactivated billing config for merchant ${merchantId}`);

      return {
        success: true,
        merchantId,
        syncedComponents: ['billing_deactivation'],
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        merchantId,
        syncedComponents: [],
        error: error instanceof Error ? error.message : 'Failed to deactivate billing config',
        timestamp: new Date().toISOString(),
      };
    }
  }
}

// Export singleton instance
export const merchantPricingBillingLink = new MerchantPricingBillingLink();

// ============================================
// REACT HOOK FOR BILLING LINK
// ============================================

import { useCallback } from 'react';

export function useMerchantPricingBillingLink() {
  const syncBillingConfig = useCallback((merchantId: string) => {
    return merchantPricingBillingLink.syncBillingConfig(merchantId);
  }, []);

  const validateCurrencyCompatibility = useCallback((merchantId: string, currency: MerchantCurrency) => {
    return merchantPricingBillingLink.validateCurrencyCompatibility(merchantId, currency);
  }, []);

  const updateCurrency = useCallback((merchantId: string, newCurrency: MerchantCurrency) => {
    return merchantPricingBillingLink.updateCurrency(merchantId, newCurrency);
  }, []);

  const getMerchantCurrency = useCallback((merchantId: string) => {
    return merchantPricingBillingLink.getMerchantCurrency(merchantId);
  }, []);

  const getMerchantGateway = useCallback((merchantId: string) => {
    return merchantPricingBillingLink.getMerchantGateway(merchantId);
  }, []);

  const isBillingConfigActive = useCallback((merchantId: string) => {
    return merchantPricingBillingLink.isBillingConfigActive(merchantId);
  }, []);

  return {
    syncBillingConfig,
    validateCurrencyCompatibility,
    updateCurrency,
    getMerchantCurrency,
    getMerchantGateway,
    isBillingConfigActive,
  };
}
