// Access Control System
// Security validation, injection prevention, and rate limiting

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export interface ValidationResult {
  valid: boolean;
  sanitized: any;
  issues: string[];
}

// Rate limit storage (in production, use Redis)
const rateLimitStore = new Map<string, Array<{ timestamp: number }>>();

// Default rate limit config
const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  windowMs: 60000, // 1 minute
  maxRequests: 100,
};

// Validate and sanitize query parameters
export function validateQueryParams(params: Record<string, any>): ValidationResult {
  const issues: string[] = [];
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') {
      // Check for SQL injection
      const sqlPatterns = ["'", '"', ';', '--', '/*', '*/', 'xp_', 'exec', 'union', 'select', 'drop'];
      if (sqlPatterns.some((pattern) => value.toLowerCase().includes(pattern))) {
        issues.push(`Potentially malicious pattern in parameter: ${key}`);
        sanitized[key] = value.replace(/['";\-\-\/*\*\/xp_execunionselectdrop]/gi, '');
      } else {
        sanitized[key] = value;
      }
    } else if (typeof value === 'number') {
      sanitized[key] = value;
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((v) => {
        if (typeof v === 'string') {
          return v.replace(/['";\-\-\/*\*\/xp_execunionselectdrop]/gi, '');
        }
        return v;
      });
    } else {
      sanitized[key] = value;
    }
  }

  return {
    valid: issues.length === 0,
    sanitized,
    issues,
  };
}

// Check rate limit
export function checkRateLimit(identifier: string, config: RateLimitConfig = DEFAULT_RATE_LIMIT): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
} {
  const now = Date.now();
  const windowStart = now - config.windowMs;
  
  let requests = rateLimitStore.get(identifier) || [];
  
  // Remove old requests outside the window
  requests = requests.filter((req) => req.timestamp > windowStart);
  
  if (requests.length >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: requests[0].timestamp + config.windowMs,
    };
  }
  
  // Add current request
  requests.push({ timestamp: now });
  rateLimitStore.set(identifier, requests);
  
  return {
    allowed: true,
    remaining: config.maxRequests - requests.length,
    resetTime: now + config.windowMs,
  };
}

// Clear rate limit for identifier
export function clearRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}

// Get rate limit statistics
export function getRateLimitStats(): {
  totalIdentifiers: number;
  totalRequests: number;
} {
  let totalRequests = 0;
  
  rateLimitStore.forEach((requests) => {
    totalRequests += requests.length;
  });
  
  return {
    totalIdentifiers: rateLimitStore.size,
    totalRequests,
  };
}

// Validate product ID
export function validateProductId(productId: string): ValidationResult {
  const issues: string[] = [];
  let sanitized = productId.trim();

  // Check for injection patterns
  const injectionPatterns = ["'", '"', ';', '--', '/*', '*/', '<', '>'];
  if (injectionPatterns.some((pattern) => sanitized.includes(pattern))) {
    issues.push('Potentially malicious characters in product ID');
    sanitized = sanitized.replace(/['";\-\-\/*\*\/<>]/g, '');
  }

  // Check length
  if (sanitized.length > 100) {
    issues.push('Product ID too long');
    sanitized = sanitized.substring(0, 100);
  }

  if (sanitized.length === 0) {
    issues.push('Product ID is empty');
  }

  return {
    valid: issues.length === 0,
    sanitized,
    issues,
  };
}

// Validate category slug
export function validateCategorySlug(slug: string): ValidationResult {
  const issues: string[] = [];
  let sanitized = slug.trim().toLowerCase();

  // Only allow alphanumeric and hyphens
  const validPattern = /^[a-z0-9-]+$/;
  if (!validPattern.test(sanitized)) {
    issues.push('Invalid characters in category slug');
    sanitized = sanitized.replace(/[^a-z0-9-]/g, '');
  }

  if (sanitized.length === 0) {
    issues.push('Category slug is empty');
  }

  return {
    valid: issues.length === 0,
    sanitized,
    issues,
  };
}

// Validate search query
export function validateSearchQuery(query: string): ValidationResult {
  const issues: string[] = [];
  let sanitized = query.trim();

  // Check for XSS patterns
  const xssPatterns = ['<script', 'javascript:', 'onerror=', 'onload=', 'onclick='];
  if (xssPatterns.some((pattern) => sanitized.toLowerCase().includes(pattern))) {
    issues.push('XSS patterns detected');
    sanitized = sanitized.replace(/<script|javascript:|onerror=|onload=|onclick=/gi, '');
  }

  // Check length
  if (sanitized.length > 200) {
    issues.push('Search query too long');
    sanitized = sanitized.substring(0, 200);
  }

  if (sanitized.length === 0) {
    issues.push('Search query is empty');
  }

  return {
    valid: issues.length === 0,
    sanitized,
    issues,
  };
}

// Validate user input (generic)
export function validateUserInput(input: string, maxLength: number = 1000): ValidationResult {
  const issues: string[] = [];
  let sanitized = input.trim();

  // Remove HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  // Check for XSS
  const xssPatterns = ['javascript:', 'onerror=', 'onload=', 'onclick=', 'onmouseover='];
  if (xssPatterns.some((pattern) => sanitized.toLowerCase().includes(pattern))) {
    issues.push('XSS patterns detected');
    sanitized = sanitized.replace(/javascript:|onerror=|onload=|onclick=|onmouseover=/gi, '');
  }

  // Check length
  if (sanitized.length > maxLength) {
    issues.push(`Input exceeds maximum length of ${maxLength}`);
    sanitized = sanitized.substring(0, maxLength);
  }

  return {
    valid: issues.length === 0,
    sanitized,
    issues,
  };
}

// Sanitize object recursively
export function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return obj.replace(/<[^>]*>/g, '').replace(/javascript:/gi, '');
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  return obj;
}

// Check for common attack patterns
export function checkAttackPatterns(input: string): {
  detected: boolean;
  type?: string;
} {
  const patterns = {
    sql: ["'", '"', ';', '--', '/*', '*/', 'union', 'select', 'drop', 'exec'],
    xss: ['<script', 'javascript:', 'onerror=', 'onload=', 'onclick='],
    path: ['../', '..\\', '/etc/', 'windows/'],
  };

  const lowerInput = input.toLowerCase();

  for (const [type, typePatterns] of Object.entries(patterns)) {
    if (typePatterns.some((pattern) => lowerInput.includes(pattern))) {
      return { detected: true, type };
    }
  }

  return { detected: false };
}

// Generate security headers
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  };
}

// Validate API request
export function validateAPIRequest(
  method: string,
  path: string,
  params: Record<string, any>
): ValidationResult {
  const issues: string[] = [];

  // Validate HTTP method
  const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
  if (!allowedMethods.includes(method.toUpperCase())) {
    issues.push(`Invalid HTTP method: ${method}`);
  }

  // Validate path
  if (path.includes('..') || path.includes('\\')) {
    issues.push('Path traversal attempt detected');
  }

  // Validate params
  const paramValidation = validateQueryParams(params);
  issues.push(...paramValidation.issues);

  return {
    valid: issues.length === 0,
    sanitized: {
      method: method.toUpperCase(),
      path,
      params: paramValidation.sanitized,
    },
    issues,
  };
}

// Clear all rate limits (admin function)
export function clearAllRateLimits(): void {
  rateLimitStore.clear();
}

// Export rate limit data
export function exportRateLimitData(): string {
  return JSON.stringify(Array.from(rateLimitStore.entries()), null, 2);
}

// Import rate limit data
export function importRateLimitData(json: string): void {
  const data = JSON.parse(json) as Array<[string, Array<{ timestamp: number }>]>;
  data.forEach(([identifier, requests]) => {
    rateLimitStore.set(identifier, requests);
  });
}
