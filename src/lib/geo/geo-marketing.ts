// Geo Marketing Engine
// Handles country detection, local currency, and geo-targeted offers

export interface Country {
  code: string;
  name: string;
  currency: string;
  currencySymbol: string;
  region: string;
  language: string;
  timezone: string;
}

export interface GeoOffer {
  country: string;
  discount: number;
  message: string;
  startDate: string;
  endDate: string;
}

export interface GeoUser {
  country: string;
  currency: string;
  detectedAt: string;
}

// Country database
export const COUNTRIES: Country[] = [
  { code: 'US', name: 'United States', currency: 'USD', currencySymbol: '$', region: 'Americas', language: 'en', timezone: 'America/New_York' },
  { code: 'IN', name: 'India', currency: 'INR', currencySymbol: '₹', region: 'Asia', language: 'en', timezone: 'Asia/Kolkata' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', currencySymbol: '£', region: 'Europe', language: 'en', timezone: 'Europe/London' },
  { code: 'AE', name: 'United Arab Emirates', currency: 'AED', currencySymbol: 'د.إ', region: 'Middle East', language: 'ar', timezone: 'Asia/Dubai' },
  { code: 'CA', name: 'Canada', currency: 'CAD', currencySymbol: '$', region: 'Americas', language: 'en', timezone: 'America/Toronto' },
  { code: 'AU', name: 'Australia', currency: 'AUD', currencySymbol: '$', region: 'Oceania', language: 'en', timezone: 'Australia/Sydney' },
  { code: 'DE', name: 'Germany', currency: 'EUR', currencySymbol: '€', region: 'Europe', language: 'de', timezone: 'Europe/Berlin' },
  { code: 'FR', name: 'France', currency: 'EUR', currencySymbol: '€', region: 'Europe', language: 'fr', timezone: 'Europe/Paris' },
  { code: 'BR', name: 'Brazil', currency: 'BRL', currencySymbol: 'R$', region: 'Americas', language: 'pt', timezone: 'America/Sao_Paulo' },
  { code: 'JP', name: 'Japan', currency: 'JPY', currencySymbol: '¥', region: 'Asia', language: 'ja', timezone: 'Asia/Tokyo' },
  { code: 'CN', name: 'China', currency: 'CNY', currencySymbol: '¥', region: 'Asia', language: 'zh', timezone: 'Asia/Shanghai' },
  { code: 'ZA', name: 'South Africa', currency: 'ZAR', currencySymbol: 'R', region: 'Africa', language: 'en', timezone: 'Africa/Johannesburg' },
  { code: 'NG', name: 'Nigeria', currency: 'NGN', currencySymbol: '₦', region: 'Africa', language: 'en', timezone: 'Africa/Lagos' },
  { code: 'MX', name: 'Mexico', currency: 'MXN', currencySymbol: '$', region: 'Americas', language: 'es', timezone: 'America/Mexico_City' },
  { code: 'SG', name: 'Singapore', currency: 'SGD', currencySymbol: '$', region: 'Asia', language: 'en', timezone: 'Asia/Singapore' },
];

// Exchange rates (in production, fetch from API)
export const EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  INR: 83.5,
  GBP: 0.79,
  EUR: 0.92,
  CAD: 1.36,
  AUD: 1.53,
  AED: 3.67,
  BRL: 4.97,
  JPY: 149.5,
  CNY: 7.24,
  ZAR: 18.5,
  NGN: 1550,
  MXN: 17.1,
  SGD: 1.34,
};

// Geo-targeted offers
export const GEO_OFFERS: GeoOffer[] = [
  {
    country: 'IN',
    discount: 20,
    message: 'Special 20% discount for Indian customers!',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
  },
  {
    country: 'AE',
    discount: 15,
    message: 'Exclusive 15% off for UAE customers',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
  },
  {
    country: 'BR',
    discount: 25,
    message: 'Oferta especial: 25% de desconto para clientes brasileiros',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
  },
];

// In-memory storage
const userGeoStore = new Map<string, GeoUser>();

export function detectCountryFromIP(ip: string): string {
  // In production, use a real IP geolocation API
  // For now, return a default or simulate based on IP pattern
  if (ip.startsWith('1.')) return 'US';
  if (ip.startsWith('49.')) return 'DE';
  if (ip.startsWith('103.')) return 'IN';
  if (ip.startsWith('2.')) return 'FR';
  return 'US'; // Default
}

export function detectCountryFromTimezone(timezone: string): string {
  const country = COUNTRIES.find((c) => c.timezone === timezone);
  return country?.code || 'US';
}

export function getCountryByCode(code: string): Country | undefined {
  return COUNTRIES.find((c) => c.code === code);
}

export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number {
  const fromRate = EXCHANGE_RATES[fromCurrency] || 1;
  const toRate = EXCHANGE_RATES[toCurrency] || 1;
  const usdAmount = amount / fromRate;
  return usdAmount * toRate;
}

export function formatPrice(amount: number, currency: string): string {
  const country = COUNTRIES.find((c) => c.currency === currency);
  const symbol = country?.currencySymbol || '$';
  return `${symbol}${amount.toFixed(2)}`;
}

export function getUserGeo(userId: string): GeoUser | undefined {
  return userGeoStore.get(userId);
}

export function setUserGeo(userId: string, country: string): GeoUser {
  const countryData = getCountryByCode(country);
  if (!countryData) {
    throw new Error('Invalid country code');
  }

  const geoUser: GeoUser = {
    country,
    currency: countryData.currency,
    detectedAt: new Date().toISOString(),
  };

  userGeoStore.set(userId, geoUser);
  return geoUser;
}

export function getGeoOffer(country: string): GeoOffer | undefined {
  const now = new Date();
  return GEO_OFFERS.find((offer) => {
    if (offer.country !== country) return false;
    const startDate = new Date(offer.startDate);
    const endDate = new Date(offer.endDate);
    return now >= startDate && now <= endDate;
  });
}

export function applyGeoDiscount(
  originalPrice: number,
  country: string
): {
  discountedPrice: number;
  discount: number;
  offer?: GeoOffer;
} {
  const offer = getGeoOffer(country);
  if (!offer) {
    return {
      discountedPrice: originalPrice,
      discount: 0,
    };
  }

  const discountedPrice = originalPrice * (1 - offer.discount / 100);
  return {
    discountedPrice,
    discount: offer.discount,
    offer,
  };
}

export function getLocalizedPrice(
  priceUSD: number,
  targetCountry: string
): {
  localPrice: number;
  currency: string;
  formatted: string;
} {
  const country = getCountryByCode(targetCountry);
  if (!country) {
    return {
      localPrice: priceUSD,
      currency: 'USD',
      formatted: formatPrice(priceUSD, 'USD'),
    };
  }

  const localPrice = convertCurrency(priceUSD, 'USD', country.currency);
  return {
    localPrice,
    currency: country.currency,
    formatted: formatPrice(localPrice, country.currency),
  };
}

export function generateGeoPageUrl(basePath: string, country: string): string {
  const countryData = getCountryByCode(country);
  if (!countryData) return basePath;

  // Generate SEO-friendly URL
  const countrySlug = countryData.name.toLowerCase().replace(/ /g, '-');
  return `${basePath}-${countrySlug}`;
}

export function getAvailableCountries(): Country[] {
  return COUNTRIES;
}

export function getCountriesByRegion(region: string): Country[] {
  return COUNTRIES.filter((c) => c.region === region);
}

export function getSupportedCurrencies(): string[] {
  return Array.from(new Set(COUNTRIES.map((c) => c.currency)));
}

export function isCountrySupported(countryCode: string): boolean {
  return COUNTRIES.some((c) => c.code === countryCode);
}

// Auto-detect user location (client-side)
export function autoDetectUserLocation(): Promise<GeoUser> {
  return new Promise((resolve) => {
    // In production, use browser geolocation API or IP geolocation service
    // For now, simulate detection
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const detectedCountry = detectCountryFromTimezone(timezone);
    const countryData = getCountryByCode(detectedCountry);

    resolve({
      country: detectedCountry,
      currency: countryData?.currency || 'USD',
      detectedAt: new Date().toISOString(),
    });
  });
}

// Get geo-targeted content
export function getGeoTargetedContent(country: string): {
  greeting: string;
  currency: string;
  hasOffer: boolean;
  offerMessage?: string;
} {
  const countryData = getCountryByCode(country);
  const offer = getGeoOffer(country);

  const greetings: Record<string, string> = {
    US: 'Welcome to ERP Vala',
    IN: 'Welcome to ERP Vala - India',
    GB: 'Welcome to ERP Vala UK',
    AE: 'مرحبا بكم في ERP Vala',
    DE: 'Willkommen bei ERP Vala',
    FR: 'Bienvenue sur ERP Vala',
    BR: 'Bem-vindo ao ERP Vala',
    JP: 'ERP Valaへようこそ',
    CN: '欢迎来到 ERP Vala',
  };

  return {
    greeting: greetings[country] || greetings['US'],
    currency: countryData?.currency || 'USD',
    hasOffer: !!offer,
    offerMessage: offer?.message,
  };
}
