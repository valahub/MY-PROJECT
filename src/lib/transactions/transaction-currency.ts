// Transaction Multi-Currency Support
// ₹/$ dynamic currency handling

import type { Currency } from './transaction-types';

// ============================================
// CURRENCY SYMBOLS
// ============================================

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: '$',
  INR: '₹',
  EUR: '€',
  GBP: '£',
  AUD: 'A$',
  CAD: 'C$',
};

// ============================================
// CURRENCY NAMES
// ============================================

export const CURRENCY_NAMES: Record<Currency, string> = {
  USD: 'US Dollar',
  INR: 'Indian Rupee',
  EUR: 'Euro',
  GBP: 'British Pound',
  AUD: 'Australian Dollar',
  CAD: 'Canadian Dollar',
};

// ============================================
// EXCHANGE RATES (BASE: USD)
// ============================================

export const EXCHANGE_RATES: Record<Currency, number> = {
  USD: 1.0,
  INR: 83.5,
  EUR: 0.92,
  GBP: 0.79,
  AUD: 1.53,
  CAD: 1.36,
};

// ============================================
// CURRENCY ENGINE
// ============================================

export class CurrencyEngine {
  // ============================================
  // FORMAT AMOUNT
  // ============================================

  formatAmount(amount: number, currency: Currency, locale: string = 'en-US'): string {
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return formatter.format(amount);
  }

  // ============================================
  // FORMAT AMOUNT WITH SYMBOL
  // ============================================

  formatAmountWithSymbol(amount: number, currency: Currency): string {
    const symbol = CURRENCY_SYMBOLS[currency];
    return `${symbol}${amount.toFixed(2)}`;
  }

  // ============================================
  // GET CURRENCY SYMBOL
  // ============================================

  getCurrencySymbol(currency: Currency): string {
    return CURRENCY_SYMBOLS[currency];
  }

  // ============================================
  // GET CURRENCY NAME
  // ============================================

  getCurrencyName(currency: Currency): string {
    return CURRENCY_NAMES[currency];
  }

  // ============================================
  // CONVERT CURRENCY
  // ============================================

  convertCurrency(amount: number, from: Currency, to: Currency): number {
    const fromRate = EXCHANGE_RATES[from];
    const toRate = EXCHANGE_RATES[to];

    // Convert to USD first, then to target currency
    const amountInUSD = amount / fromRate;
    const amountInTarget = amountInUSD * toRate;

    return amountInTarget;
  }

  // ============================================
  // CONVERT TO BASE CURRENCY (USD)
  // ============================================

  convertToBaseCurrency(amount: number, currency: Currency): number {
    return this.convertCurrency(amount, currency, 'USD');
  }

  // ============================================
  // GET EXCHANGE RATE
  // ============================================

  getExchangeRate(from: Currency, to: Currency): number {
    const fromRate = EXCHANGE_RATES[from];
    const toRate = EXCHANGE_RATES[to];
    return toRate / fromRate;
  }

  // ============================================
  // GET ALL SUPPORTED CURRENCIES
  // ============================================

  getSupportedCurrencies(): Currency[] {
    return Object.keys(CURRENCY_SYMBOLS) as Currency[];
  }

  // ============================================
  // VALIDATE CURRENCY
  // ============================================

  isValidCurrency(currency: string): currency is Currency {
    return Object.keys(CURRENCY_SYMBOLS).includes(currency);
  }

  // ============================================
  // PARSE AMOUNT FROM STRING
  // ============================================

  parseAmount(amountString: string): number {
    // Remove currency symbols and commas
    const cleaned = amountString.replace(/[^0-9.-]/g, '');
    return parseFloat(cleaned) || 0;
  }

  // ============================================
  // ROUND TO PRECISION
  // ============================================

  roundToPrecision(amount: number, precision: number = 2): number {
    return Math.round(amount * Math.pow(10, precision)) / Math.pow(10, precision);
  }

  // ============================================
  // GET CURRENCY BREAKDOWN
  // ============================================

  getCurrencyBreakdown(transactions: Array<{ amount: number; currency: Currency }>): Record<Currency, number> {
    const breakdown: Record<Currency, number> = {
      USD: 0,
      INR: 0,
      EUR: 0,
      GBP: 0,
      AUD: 0,
      CAD: 0,
    };

    for (const transaction of transactions) {
      breakdown[transaction.currency] += transaction.amount;
    }

    return breakdown;
  }

  // ============================================
  // CONVERT BREAKDOWN TO BASE CURRENCY
  // ============================================

  convertBreakdownToBase(breakdown: Record<Currency, number>): number {
    let total = 0;

    for (const [currency, amount] of Object.entries(breakdown)) {
      total += this.convertToBaseCurrency(amount, currency as Currency);
    }

    return total;
  }

  // ============================================
  // UPDATE EXCHANGE RATES
  // ============================================

  updateExchangeRates(rates: Partial<Record<Currency, number>>): void {
    Object.assign(EXCHANGE_RATES, rates);
  }

  // ============================================
  // GET EXCHANGE RATES
  // ============================================

  getExchangeRates(): Record<Currency, number> {
    return { ...EXCHANGE_RATES };
  }
}

// Export singleton instance
export const currencyEngine = new CurrencyEngine();

// ============================================
// REACT HOOK FOR CURRENCY
// ============================================

import { useCallback } from 'react';

export function useCurrency() {
  const formatAmount = useCallback((amount: number, currency: Currency, locale?: string) => {
    return currencyEngine.formatAmount(amount, currency, locale);
  }, []);

  const formatAmountWithSymbol = useCallback((amount: number, currency: Currency) => {
    return currencyEngine.formatAmountWithSymbol(amount, currency);
  }, []);

  const getCurrencySymbol = useCallback((currency: Currency) => {
    return currencyEngine.getCurrencySymbol(currency);
  }, []);

  const getCurrencyName = useCallback((currency: Currency) => {
    return currencyEngine.getCurrencyName(currency);
  }, []);

  const convertCurrency = useCallback((amount: number, from: Currency, to: Currency) => {
    return currencyEngine.convertCurrency(amount, from, to);
  }, []);

  const convertToBaseCurrency = useCallback((amount: number, currency: Currency) => {
    return currencyEngine.convertToBaseCurrency(amount, currency);
  }, []);

  const getExchangeRate = useCallback((from: Currency, to: Currency) => {
    return currencyEngine.getExchangeRate(from, to);
  }, []);

  const getSupportedCurrencies = useCallback(() => {
    return currencyEngine.getSupportedCurrencies();
  }, []);

  const isValidCurrency = useCallback((currency: string) => {
    return currencyEngine.isValidCurrency(currency);
  }, []);

  const parseAmount = useCallback((amountString: string) => {
    return currencyEngine.parseAmount(amountString);
  }, []);

  const getCurrencyBreakdown = useCallback((transactions: Array<{ amount: number; currency: Currency }>) => {
    return currencyEngine.getCurrencyBreakdown(transactions);
  }, []);

  const convertBreakdownToBase = useCallback((breakdown: Record<Currency, number>) => {
    return currencyEngine.convertBreakdownToBase(breakdown);
  }, []);

  return {
    formatAmount,
    formatAmountWithSymbol,
    getCurrencySymbol,
    getCurrencyName,
    convertCurrency,
    convertToBaseCurrency,
    getExchangeRate,
    getSupportedCurrencies,
    isValidCurrency,
    parseAmount,
    getCurrencyBreakdown,
    convertBreakdownToBase,
  };
}
