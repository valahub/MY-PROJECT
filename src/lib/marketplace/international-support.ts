// International Support
// Currency conversion, i18n, and geo-based product sorting

export interface Currency {
  code: string;
  symbol: string;
  rate: number; // Rate relative to USD
  locale: string;
}

export interface Locale {
  code: string;
  name: string;
  currency: string;
}

// Currency rates (in production, fetch from API)
const CURRENCIES: Record<string, Currency> = {
  USD: { code: 'USD', symbol: '$', rate: 1, locale: 'en-US' },
  EUR: { code: 'EUR', symbol: '€', rate: 0.92, locale: 'de-DE' },
  GBP: { code: 'GBP', symbol: '£', rate: 0.79, locale: 'en-GB' },
  JPY: { code: 'JPY', symbol: '¥', rate: 149.50, locale: 'ja-JP' },
  CAD: { code: 'CAD', symbol: 'C$', rate: 1.36, locale: 'en-CA' },
  AUD: { code: 'AUD', symbol: 'A$', rate: 1.53, locale: 'en-AU' },
  INR: { code: 'INR', symbol: '₹', rate: 83.12, locale: 'en-IN' },
  CNY: { code: 'CNY', symbol: '¥', rate: 7.24, locale: 'zh-CN' },
};

// Supported locales
const LOCALES: Locale[] = [
  { code: 'en-US', name: 'English (US)', currency: 'USD' },
  { code: 'en-GB', name: 'English (UK)', currency: 'GBP' },
  { code: 'de-DE', name: 'German', currency: 'EUR' },
  { code: 'fr-FR', name: 'French', currency: 'EUR' },
  { code: 'es-ES', name: 'Spanish', currency: 'EUR' },
  { code: 'ja-JP', name: 'Japanese', currency: 'JPY' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', currency: 'CNY' },
  { code: 'en-IN', name: 'English (India)', currency: 'INR' },
];

// User's preferred currency (in production, from user profile)
let userCurrency = 'USD';
let userLocale = 'en-US';

// Convert price from USD to target currency
export function convertPrice(priceUSD: number, targetCurrency: string): number {
  const currency = CURRENCIES[targetCurrency];
  if (!currency) return priceUSD;

  return priceUSD * currency.rate;
}

// Format price with currency symbol
export function formatPrice(price: number, currency: string = userCurrency): string {
  const currencyInfo = CURRENCIES[currency];
  if (!currencyInfo) return `$${price.toFixed(2)}`;

  return new Intl.NumberFormat(currencyInfo.locale, {
    style: 'currency',
    currency: currencyInfo.code,
  }).format(price);
}

// Convert and format price
export function convertAndFormatPrice(priceUSD: number, targetCurrency: string): string {
  const converted = convertPrice(priceUSD, targetCurrency);
  return formatPrice(converted, targetCurrency);
}

// Set user currency
export function setUserCurrency(currency: string): void {
  if (CURRENCIES[currency]) {
    userCurrency = currency;
    if (typeof window !== 'undefined') {
      localStorage.setItem('user-currency', currency);
    }
  }
}

// Get user currency
export function getUserCurrency(): string {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('user-currency');
    if (stored && CURRENCIES[stored]) {
      userCurrency = stored;
    }
  }
  return userCurrency;
}

// Detect currency from country
export function detectCurrencyFromCountry(countryCode: string): string {
  const countryToCurrency: Record<string, string> = {
    US: 'USD',
    GB: 'GBP',
    DE: 'EUR',
    FR: 'EUR',
    ES: 'EUR',
    IT: 'EUR',
    JP: 'JPY',
    CN: 'CNY',
    IN: 'INR',
    CA: 'CAD',
    AU: 'AUD',
  };

  return countryToCurrency[countryCode] || 'USD';
}

// Set user locale
export function setUserLocale(locale: string): void {
  const localeExists = LOCALES.some((l) => l.code === locale);
  if (localeExists) {
    userLocale = locale;
    if (typeof window !== 'undefined') {
      localStorage.setItem('user-locale', locale);
    }
  }
}

// Get user locale
export function getUserLocale(): string {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('user-locale');
    if (stored) {
      userLocale = stored;
    }
  }
  return userLocale;
}

// Get supported currencies
export function getSupportedCurrencies(): Currency[] {
  return Object.values(CURRENCIES);
}

// Get supported locales
export function getSupportedLocales(): Locale[] {
  return LOCALES;
}

// Translate text (simplified - in production use i18n library)
export function translate(key: string, locale: string = userLocale): string {
  const translations: Record<string, Record<string, string>> = {
    'en-US': {
      'price': 'Price',
      'add_to_cart': 'Add to Cart',
      'wishlist': 'Wishlist',
      'search': 'Search',
      'filter': 'Filter',
      'sort': 'Sort',
    },
    'de-DE': {
      'price': 'Preis',
      'add_to_cart': 'In den Warenkorb',
      'wishlist': 'Wunschliste',
      'search': 'Suche',
      'filter': 'Filter',
      'sort': 'Sortieren',
    },
    'fr-FR': {
      'price': 'Prix',
      'add_to_cart': 'Ajouter au panier',
      'wishlist': 'Liste de souhaits',
      'search': 'Rechercher',
      'filter': 'Filtrer',
      'sort': 'Trier',
    },
    'es-ES': {
      'price': 'Precio',
      'add_to_cart': 'Añadir al carrito',
      'wishlist': 'Lista de deseos',
      'search': 'Buscar',
      'filter': 'Filtrar',
      'sort': 'Ordenar',
    },
    'ja-JP': {
      'price': '価格',
      'add_to_cart': 'カートに追加',
      'wishlist': 'ウィッシュリスト',
      'search': '検索',
      'filter': 'フィルター',
      'sort': '並べ替え',
    },
    'zh-CN': {
      'price': '价格',
      'add_to_cart': '加入购物车',
      'wishlist': '愿望清单',
      'search': '搜索',
      'filter': '筛选',
      'sort': '排序',
    },
  };

  return translations[locale]?.[key] || translations['en-US']?.[key] || key;
}

// Format number according to locale
export function formatNumber(number: number, locale: string = userLocale): string {
  return new Intl.NumberFormat(locale).format(number);
}

// Format date according to locale
export function formatDate(date: Date, locale: string = userLocale): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

// Sort products by geo-location (simplified - in production use actual geo data)
export function sortProductsByGeo(products: any[], userCountry: string): any[] {
  // In production, this would sort based on proximity, local sellers, etc.
  // For now, return products as-is
  return products;
}

// Get country from IP (simplified - in production use geo IP service)
export async function getCountryFromIP(ip: string): Promise<string> {
  // In production, call geo IP service
  // For now, return default
  return 'US';
}

// Auto-detect user settings
export async function autoDetectUserSettings(): Promise<{
  currency: string;
  locale: string;
}> {
  let currency = 'USD';
  let locale = 'en-US';

  if (typeof window !== 'undefined') {
    // Try to detect from browser
    const browserLocale = navigator.language;
    const matchedLocale = LOCALES.find((l) => l.code === browserLocale);
    
    if (matchedLocale) {
      locale = matchedLocale.code;
      currency = matchedLocale.currency;
    }

    // In production, also detect from IP
    // const country = await getCountryFromIP();
    // currency = detectCurrencyFromCountry(country);
  }

  setUserCurrency(currency);
  setUserLocale(locale);

  return { currency, locale };
}

// Get exchange rate
export function getExchangeRate(fromCurrency: string, toCurrency: string): number {
  const from = CURRENCIES[fromCurrency];
  const to = CURRENCIES[toCurrency];
  
  if (!from || !to) return 1;
  
  return to.rate / from.rate;
}

// Update currency rates (in production, fetch from API)
export function updateCurrencyRates(newRates: Record<string, number>): void {
  Object.entries(newRates).forEach(([code, rate]) => {
    if (CURRENCIES[code]) {
      CURRENCIES[code].rate = rate;
    }
  });
}

// Get currency statistics
export function getCurrencyStatistics(): {
  supportedCurrencies: number;
  supportedLocales: number;
  currentCurrency: string;
  currentLocale: string;
} {
  return {
    supportedCurrencies: Object.keys(CURRENCIES).length,
    supportedLocales: LOCALES.length,
    currentCurrency: getUserCurrency(),
    currentLocale: getUserLocale(),
  };
}

// Export settings
export function exportInternationalSettings(): string {
  return JSON.stringify({
    currency: getUserCurrency(),
    locale: getUserLocale(),
  }, null, 2);
}

// Import settings
export function importInternationalSettings(json: string): void {
  const settings = JSON.parse(json);
  if (settings.currency) setUserCurrency(settings.currency);
  if (settings.locale) setUserLocale(settings.locale);
}
