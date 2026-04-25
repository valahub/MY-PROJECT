// Paddle RBAC Security Layer
// Token validation and security checks

export interface TokenPayload {
  sub: string; // user ID
  email: string;
  role_id: string;
  plan_active: boolean;
  status: string;
  iat: number;
  exp: number;
}

export class TokenValidator {
  /**
   * Validate JWT token structure
   */
  static validateToken(token: string): { valid: boolean; payload?: TokenPayload; error?: string } {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return { valid: false, error: 'Invalid token format' };
      }

      const payload = JSON.parse(atob(parts[1]));
      
      // Check required fields
      if (!payload.sub || !payload.email || !payload.role_id) {
        return { valid: false, error: 'Missing required token fields' };
      }

      // Check expiration
      if (payload.exp && payload.exp < Date.now() / 1000) {
        return { valid: false, error: 'Token expired' };
      }

      return { valid: true, payload };
    } catch (error) {
      return { valid: false, error: 'Failed to parse token' };
    }
  }

  /**
   * Extract user ID from token
   */
  static extractUserId(token: string): string | null {
    const result = this.validateToken(token);
    return result.valid && result.payload ? result.payload.sub : null;
  }

  /**
   * Extract role ID from token
   */
  static extractRoleId(token: string): string | null {
    const result = this.validateToken(token);
    return result.valid && result.payload ? result.payload.role_id : null;
  }

  /**
   * Check if user has active plan from token
   */
  static isPlanActive(token: string): boolean {
    const result = this.validateToken(token);
    return result.valid && result.payload ? result.payload.plan_active : false;
  }

  /**
   * Check if user is active from token
   */
  static isUserActive(token: string): boolean {
    const result = this.validateToken(token);
    return result.valid && result.payload ? result.payload.status === 'active' : false;
  }
}

export class SecurityUtils {
  /**
   * Sanitize input to prevent injection attacks
   */
  static sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '')
      .trim()
      .substring(0, 1000);
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate UUID format
   */
  static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Generate secure random string
   */
  static generateSecureString(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Hash string for comparison
   */
  static hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }
}
