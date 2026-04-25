// License Offline Validation System
// Encrypted JWT token for offline validation

import type { License } from './license-types';

// ============================================
// OFFLINE TOKEN PAYLOAD
// ============================================

interface OfflineTokenPayload {
  licenseId: string;
  licenseKey: string;
  productId: string;
  customerId: string;
  deviceId: string;
  expiresAt: string;
  issuedAt: string;
}

// ============================================
// OFFLINE VALIDATION ENGINE
// ============================================

export class OfflineValidationEngine {
  private secretKey: string = 'EVLA_SECRET_KEY_CHANGE_IN_PRODUCTION';

  // ============================================
  // GENERATE OFFLINE TOKEN
  // ============================================

  generateOfflineToken(license: License, deviceId: string): string {
    const payload: OfflineTokenPayload = {
      licenseId: license.id,
      licenseKey: license.licenseKey,
      productId: license.productId,
      customerId: license.customerId,
      deviceId,
      expiresAt: license.expiresAt,
      issuedAt: new Date().toISOString(),
    };

    const token = this.createJWT(payload);
    const encrypted = this.encrypt(token);

    return encrypted;
  }

  // ============================================
  // VALIDATE OFFLINE TOKEN
  // ============================================

  validateOfflineToken(encryptedToken: string, deviceId: string): {
    valid: boolean;
    expired: boolean;
    payload: OfflineTokenPayload | null;
  } {
    try {
      const decrypted = this.decrypt(encryptedToken);
      const payload = this.verifyJWT(decrypted);

      if (!payload) {
        return { valid: false, expired: false, payload: null };
      }

      // Check device ID
      if (payload.deviceId !== deviceId) {
        return { valid: false, expired: false, payload: null };
      }

      // Check expiry
      const now = new Date();
      const expiresAt = new Date(payload.expiresAt);

      if (now > expiresAt) {
        return { valid: false, expired: true, payload };
      }

      return { valid: true, expired: false, payload };
    } catch (error) {
      return { valid: false, expired: false, payload: null };
    }
  }

  // ============================================
  // CREATE JWT (SIMPLIFIED)
  // ============================================

  private createJWT(payload: OfflineTokenPayload): string {
    const header = {
      alg: 'HS256',
      typ: 'JWT',
    };

    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
    const signature = this.sign(encodedHeader + '.' + encodedPayload);

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  // ============================================
  // VERIFY JWT (SIMPLIFIED)
  // ============================================

  private verifyJWT(token: string): OfflineTokenPayload | null {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;

    // Verify signature
    const expectedSignature = this.sign(encodedHeader + '.' + encodedPayload);
    if (signature !== expectedSignature) return null;

    // Decode payload
    try {
      const payload = JSON.parse(this.base64UrlDecode(encodedPayload));
      return payload as OfflineTokenPayload;
    } catch {
      return null;
    }
  }

  // ============================================
  // SIGN
  // ============================================

  private sign(data: string): string {
    // Simplified HMAC-SHA256
    // In production, use crypto.subtle.sign or crypto-js
    const hash = this.simpleHash(data + this.secretKey);
    return this.base64UrlEncode(hash);
  }

  // ============================================
  // SIMPLE HASH (FOR DEMO ONLY)
  // ============================================

  private simpleHash(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  // ============================================
  // BASE64 URL ENCODE
  // ============================================

  private base64UrlEncode(data: string): string {
    const base64 = btoa(data);
    return base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  // ============================================
  // BASE64 URL DECODE
  // ============================================

  private base64UrlDecode(data: string): string {
    const base64 = data
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    return atob(base64);
  }

  // ============================================
  // ENCRYPT (SIMPLIFIED)
  // ============================================

  private encrypt(data: string): string {
    // In production, use AES encryption
    // For now, use XOR cipher as placeholder
    const key = this.secretKey;
    let encrypted = '';
    for (let i = 0; i < data.length; i++) {
      encrypted += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return this.base64UrlEncode(encrypted);
  }

  // ============================================
  // DECRYPT (SIMPLIFIED)
  // ============================================

  private decrypt(data: string): string {
    const key = this.secretKey;
    const decoded = this.base64UrlDecode(data);
    let decrypted = '';
    for (let i = 0; i < decoded.length; i++) {
      decrypted += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return decrypted;
  }

  // ============================================
  // SET SECRET KEY
  // ============================================

  setSecretKey(key: string): void {
    this.secretKey = key;
  }

  // ============================================
  // GET SECRET KEY
  // ============================================

  getSecretKey(): string {
    return this.secretKey;
  }
}

// Export singleton instance
export const offlineValidationEngine = new OfflineValidationEngine();

// ============================================
// REACT HOOK FOR OFFLINE VALIDATION
// ============================================

import { useState, useCallback } from 'react';

export function useOfflineValidation() {
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateToken = useCallback((license: License, deviceId: string) => {
    setIsValidating(true);
    setError(null);

    try {
      const token = offlineValidationEngine.generateOfflineToken(license, deviceId);
      return token;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate offline token';
      setError(errorMessage);
      return null;
    } finally {
      setIsValidating(false);
    }
  }, []);

  const validateToken = useCallback((encryptedToken: string, deviceId: string) => {
    setIsValidating(true);
    setError(null);

    try {
      const result = offlineValidationEngine.validateOfflineToken(encryptedToken, deviceId);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to validate offline token';
      setError(errorMessage);
      return {
        valid: false,
        expired: false,
        payload: null,
      };
    } finally {
      setIsValidating(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isValidating,
    error,
    generateToken,
    validateToken,
    clearError,
  };
}
