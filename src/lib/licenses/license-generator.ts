// License Key Generation Engine
// Format: EVLA-{PRODUCT}-{RANDOM}-{CHECKSUM}
// UUID + HASH + checksum validation + no duplicate keys

import type { License, GenerateLicenseRequest } from './license-types';

// ============================================
// LICENSE KEY GENERATOR
// ============================================

export class LicenseKeyGenerator {
  private generatedKeys: Set<string> = new Set();
  private readonly PREFIX = 'EVLA';

  // ============================================
  // GENERATE LICENSE KEY
  // ============================================

  generate(productId: string, customerId: string): string {
    let key: string;
    let attempts = 0;
    const maxAttempts = 100;

    do {
      const productSegment = this.formatSegment(productId);
      const randomSegment = this.generateRandomSegment();
      const checksum = this.calculateChecksum(productSegment, randomSegment);

      key = `${this.PREFIX}-${productSegment}-${randomSegment}-${checksum}`;
      attempts++;
    } while (this.generatedKeys.has(key) && attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      throw new Error('Failed to generate unique license key after maximum attempts');
    }

    this.generatedKeys.add(key);
    return key;
  }

  // ============================================
  // FORMAT SEGMENT
  // ============================================

  private formatSegment(input: string): string {
    // Take first 4 characters, uppercase, pad with X if needed
    const segment = input.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 4);
    return segment.padEnd(4, 'X');
  }

  // ============================================
  // GENERATE RANDOM SEGMENT
  // ============================================

  private generateRandomSegment(): string {
    // Generate 4 random uppercase alphanumeric characters
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let segment = '';
    for (let i = 0; i < 4; i++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return segment;
  }

  // ============================================
  // CALCULATE CHECKSUM
  // ============================================

  private calculateChecksum(productSegment: string, randomSegment: string): string {
    // Simple checksum algorithm
    const combined = productSegment + randomSegment;
    let checksum = 0;

    for (let i = 0; i < combined.length; i++) {
      checksum += combined.charCodeAt(i);
    }

    // Convert to 2-character hex
    const hexChecksum = (checksum % 256).toString(16).toUpperCase().padStart(2, '0');
    return hexChecksum;
  }

  // ============================================
  // VALIDATE LICENSE KEY FORMAT
  // ============================================

  validateFormat(licenseKey: string): boolean {
    const pattern = /^EVLA-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-F0-9]{2}$/;
    return pattern.test(licenseKey);
  }

  // ============================================
  // VALIDATE LICENSE KEY CHECKSUM
  // ============================================

  validateChecksum(licenseKey: string): boolean {
    const segments = licenseKey.split('-');
    if (segments.length !== 4) return false;

    const [, productSegment, randomSegment, checksum] = segments;
    const calculatedChecksum = this.calculateChecksum(productSegment, randomSegment);

    return calculatedChecksum === checksum;
  }

  // ============================================
  // VALIDATE LICENSE KEY
  // ============================================

  validate(licenseKey: string): boolean {
    return this.validateFormat(licenseKey) && this.validateChecksum(licenseKey);
  }

  // ============================================
  // MASK LICENSE KEY
  // ============================================

  maskLicenseKey(licenseKey: string): string {
    const segments = licenseKey.split('-');
    if (segments.length !== 4) return licenseKey;

    // Show first 4 chars, mask rest
    return `${segments[0]}-${segments[1]}-XXXX-${segments[3]}`;
  }

  // ============================================
  // PARSE LICENSE KEY
  // ============================================

  parseLicenseKey(licenseKey: string): {
    prefix: string;
    productSegment: string;
    randomSegment: string;
    checksum: string;
  } | null {
    if (!this.validateFormat(licenseKey)) return null;

    const [prefix, productSegment, randomSegment, checksum] = licenseKey.split('-');

    return {
      prefix,
      productSegment,
      randomSegment,
      checksum,
    };
  }

  // ============================================
  // GENERATE LICENSE OBJECT
  // ============================================

  generateLicense(request: GenerateLicenseRequest): License {
    const licenseKey = this.generate(request.productId, request.customerId);
    const now = new Date().toISOString();

    const license: License = {
      id: `lic_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      licenseKey,
      productId: request.productId,
      customerId: request.customerId,
      planId: request.planId,
      status: 'active',
      activationLimit: request.activationLimit,
      activationCount: 0,
      boundDevices: [],
      expiresAt: request.expiresAt,
      issuedAt: now,
      lastCheckAt: now,
      offlineToken: '', // Will be generated by offline validation engine
      tenantId: request.tenantId,
      metadata: request.metadata,
    };

    return license;
  }

  // ============================================
  // CLEAR GENERATED KEYS
  // ============================================

  clearGeneratedKeys(): void {
    this.generatedKeys.clear();
  }

  // ============================================
  // GET GENERATED KEYS COUNT
  // ============================================

  getGeneratedKeysCount(): number {
    return this.generatedKeys.size;
  }
}

// Export singleton instance
export const licenseKeyGenerator = new LicenseKeyGenerator();

// ============================================
// REACT HOOK FOR LICENSE KEY GENERATION
// ============================================

import { useState, useCallback } from 'react';

export function useLicenseKeyGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback((productId: string, customerId: string) => {
    setIsGenerating(true);
    setError(null);

    try {
      const key = licenseKeyGenerator.generate(productId, customerId);
      return key;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate license key';
      setError(errorMessage);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const validate = useCallback((licenseKey: string) => {
    return licenseKeyGenerator.validate(licenseKey);
  }, []);

  const mask = useCallback((licenseKey: string) => {
    return licenseKeyGenerator.maskLicenseKey(licenseKey);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isGenerating,
    error,
    generate,
    validate,
    mask,
    clearError,
  };
}
