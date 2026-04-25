// Merchant Pricing Multi-Currency Support
// Per merchant INR/USD/EUR with auto formatting
// STRICT: No global currency conflict

import type { MerchantCurrency } from './merchant-pricing-types';

// ============================================
// CURRENCY SYMBOLS
// ============================================

export const CURRENCY_SYMBOLS: Record<MerchantCurrency, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
};

// ============================================
// CURRENCY NAMES
// ============================================

export const CURRENCY_NAMES: Record<MerchantCurrency, string> = {
  INR: 'Indian Rupee',
  USD: 'US Dollar',
  EUR: 'Euro',
};

// ============================================
// EXCHANGE RATES (BASE: USD)
// ============================================

export const EXCHANGE_RATES: Record<MerchantCurrency, number> = {
  USD: 1.0,
  INR: 83.5,
  EUR: 0.92,
};

// ============================================
// CURRENCY LOCALES
// ============================================

export const CURRENCY_LOCALES: Record<MerchantCurrency, string> = {
  INR: 'en-IN',
  USD: 'en-US',
  EUR: 'en-EU',
};

// ============================================
// FORMATTED AMOUNT
// ============================================

export interface FormattedAmount {
  amount: string;
  symbol: string;
  code: string;
  locale: string;
}

// ============================================
// MERCHANT PRICING CURRENCY ENGINE
// ============================================

export class MerchantPricingCurrencyEngine {
  private merchantCurrencies: Map<string, MerchantCurrency> = new Map();

  // ============================================
  // SET MERCHANT CURRENCY
  // ============================================

  setMerchantCurrency(merchantId: string, currency: MerchantCurrency): void {
    this.merchantCurrencies.set(merchantId, currency);
  }

  // ============================================
  // GET MERCHANT CURRENCY
  // ============================================

  getMerchantCurrency(merchantId: string): MerchantCurrency {
    return this.merchantCurrencies.get(merchantId) || 'USD';
  }

  // ============================================
  // FORMAT AMOUNT
  // ============================================

  formatAmount(amount: number, currency: MerchantCurrency): FormattedAmount {
    const symbol = CURRENCY_SYMBOLS[currency];
    const code = currency;
    const locale = CURRENCY_LOCALES[currency];

    // Format using Intl.NumberFormat
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    const formatted = formatter.format(amount);

    return {
      amount: formatted,
      symbol,
      code,
      locale,
    };
  }

  // ============================================
  // FORMAT AMOUNT FOR MERCHANT
  // ============================================

  formatAmountForMerchant(merchantId: string, amount: number): FormattedAmount {
    const currency = this.getMerchantCurrency(merchantId);
    return this.formatAmount(amount, currency);
  }

  // ============================================
  // CONVERT CURRENCY
  // ============================================

  convertCurrency(amount: number, fromCurrency: MerchantCurrency, toCurrency: MerchantCurrency): number {
    const fromRate = EXCHANGE_RATES[fromCurrency];
    const toRate = EXCHANGE_RATES[toCurrency];

    // Convert to USD first, then to target currency
    const amountInUSD = amount / fromRate;
    const convertedAmount = amountInUSD * toRate;

    return convertedAmount;
  }

  // ============================================
  // CONVERT AMOUNT FOR MERCHANT
  // ============================================

  convertAmountForMerchant(merchantId: string, amount: number, fromCurrency: MerchantCurrency): number {
    const toCurrency = this.getMerchantCurrency(merchantId);
    return this.convertCurrency(amount, fromCurrency, toCurrency);
  }

  // ============================================
  // GET CURRENCY SYMBOL
  // ============================================

  getCurrencySymbol(currency: MerchantCurrency): string {
    return CURRENCY_SYMBOLS[currency];
  }

  // ============================================
  // GET CURRENCY NAME
  // ============================================

  getCurrencyName(currency: MerchantCurrency): string {
    return CURRENCY_NAMES[currency];
  }

  // ============================================
  // GET ALL CURRENCIES
  // ============================================

  getAllCurrencies(): Array<{
    value: MerchantCurrency;
    symbol: string;
    name: string;
  }> {
    return [
      {
        value: 'INR',
        symbol: CURRENCY_SYMBOLS.INR,
        name: CURRENCY_NAMES.INR,
      },
      {
        value: 'USD',
        symbol: CURRENCY_SYMBOLS.USD,
        name: CURRENCY_NAMES.USD,
      },
      {
        value: 'EUR',
        symbol: CURRENCY_SYMBOLS.EUR,
        name: CURRENCY_NAMES.EUR,
      },
    ];
  }

  // ============================================
  // IS CURRENCY SUPPORTED
  // ============================================

  isCurrencySupported(currency: string): currency is MerchantCurrency {
    return currency === 'INR' || currency === 'USD' || currency === 'EUR';
  }

  // ============================================
  // GET EXCHANGE RATE
  // ============================================

  getExchangeRate(currency: MerchantCurrency): number {
    return EXCHANGE_RATES[currency];
  }

  // ============================================
  // GET ALL EXCHANGE RATES
  // ============================================

  getAllExchangeRates(): Record<MerchantCurrency, number> {
    return { ...EXCHANGE_RATES };
  }

  // ============================================
  // UPDATE EXCHANGE RATE
  // ============================================

  updateExchangeRate(currency: MerchantCurrency, rate: number): void {
    EXCHANGE_RATES[currency] = rate;
  }

  // ============================================
  // FORMAT RANGE
  // ============================================

  formatRange(minAmount: number, maxAmount: number, currency: MerchantCurrency): string {
    const minFormatted = this.formatAmount(minAmount, currency);
    const maxFormatted = this.formatAmount(maxAmount, currency);

    return `${minFormatted.amount} - ${maxFormatted.amount}`;
  }

  // ============================================
  // FORMAT RANGE FOR MERCHANT
  // ============================================

  formatRangeForMerchant(merchantId: string, minAmount: number, maxAmount: number): string {
    const currency = this.getMerchantCurrency(merchantId);
    return this.formatRange(minAmount, maxAmount, currency);
  }

  // ============================================
  // PARSE AMOUNT
  // ============================================

  parseAmount(formattedAmount: string, currency: MerchantCurrency): number {
    // Remove currency symbol and parse
    const symbol = CURRENCY_SYMBOLS[currency];
    const cleanAmount = formattedAmount.replace(symbol, '').replace(/,/g, '').trim();
    return parseFloat(cleanAmount);
  }

  // ============================================
  // ROUND TO CURRENCY PRECISION
  // ============================================

  roundToCurrencyPrecision(amount: number, currency: MerchantCurrency): number {
    // Most currencies use 2 decimal places
    return Math.round(amount * 100) / 100;
  }

  // ============================================
  // GET CURRENCY PRECISION
  // ============================================

  getCurrencyPrecision(currency: MerchantCurrency): number {
    // Most currencies use 2 decimal places
    return 2;
  }

  // ============================================
  // COMPARE AMOUNTS
  // ============================================

  compareAmounts(
    amount1: number,
    amount2: number,
    currency1: MerchantCurrency,
    currency2: MerchantCurrency
  ): number {
    // Convert both to USD for comparison
    const amount1InUSD = this.convertCurrency(amount1, currency1, 'USD');
    const amount2InUSD = this.convertCurrency(amount2, currency2, 'USD');

    if (amount1InUSD < amount2InUSD) return -1;
    if (amount1InUSD > amount2InUSD) return 1;
    return 0;
  }

  // ============================================
  // ADD AMOUNTS
  // ============================================

  addAmounts(
    amount1: number,
    amount2: number,
    currency1: MerchantCurrency,
    currency2: MerchantCurrency,
    targetCurrency: MerchantCurrency
  ): number {
    const amount1Converted = this.convertCurrency(amount1, currency1, targetCurrency);
    const amount2Converted = this.convertCurrency(amount2, currency2, targetCurrency);

    return this.roundToCurrencyPrecision(amount1Converted + amount2Converted, targetCurrency);
  }

  // ============================================
  // SUBTRACT AMOUNTS
  // ============================================

  subtractAmounts(
    amount1: number,
    amount2: number,
    currency1: MerchantCurrency,
    currency2: MerchantCurrency,
    targetCurrency: MerchantCurrency
  ): number {
    const amount1Converted = this.convertCurrency(amount1, currency1, targetCurrency);
    const amount2Converted = this.convertCurrency(amount2, currency2, targetCurrency);

    return this.roundToCurrencyPrecision(amount1Converted - amount2Converted, targetCurrency);
  }
}

// Export singleton instance
export const merchantPricingCurrencyEngine = new MerchantPricingCurrencyEngine();

// ============================================
// REACT HOOK FOR CURRENCY
// ============================================

import { useCallback } from 'react';

export function useMerchantPricingCurrency() {
  const formatAmount = useCallback((amount: number, currency: MerchantCurrency) => {
    return merchantPricingCurrencyEngine.formatAmount(amount, currency);
  }, []);

  const formatAmountForMerchant = useCallback((merchantId: string, amount: number) => {
    return merchantPricingCurrencyEngine.formatAmountForMerchant(merchantId, amount);
  }, []);

  const convertCurrency = useCallback((amount: number, fromCurrency: MerchantCurrency, toCurrency: MerchantCurrency) => {
    return merchantPricingCurrencyEngine.convertCurrency(amount, fromCurrency, toCurrency);
  }, []);

  const getCurrencySymbol = useCallback((currency: MerchantCurrency) => {
    return merchantPricingCurrencyEngine.getCurrencySymbol(currency);
  }, []);

  const getCurrencyName = useCallback((currency: MerchantCurrency) => {
    return merchantPricingCurrencyEngine.getCurrencyName(currency);
  }, []);

  const getAllCurrencies = useCallback(() => {
    return merchantPricingCurrencyEngine.getAllCurrencies();
  }, []);

  const formatRange = useCallback((minAmount: number, maxAmount: number, currency: MerchantCurrency) => {
    return merchantPricingCurrencyEngine.formatRange(minAmount, maxAmount, currency);
  }, []);

  const formatRangeForMerchant = useCallback((merchantId: string, minAmount: number, maxAmount: number) => {
    return merchantPricingCurrencyEngine.formatRangeForMerchant(merchantId, minAmount, maxAmount);
  }, []);

  return {
    formatAmount,
    formatAmountForMerchant,
    convertCurrency,
    getCurrencySymbol,
    getCurrencyName,
    getAllCurrencies,
    formatRange,
    formatRangeForMerchant,
  };
}
