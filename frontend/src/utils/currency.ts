/**
 * Currency conversion and formatting utilities for MentorOS Freelancer module.
 * Defaults to Indian Rupee (INR - ₹) with full multi-currency conversion support.
 */

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  flag: string;
  locale: string;
  rateToInr: number; // 1 unit of foreign currency = X INR
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyConfig> = {
  INR: {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    flag: '🇮🇳',
    locale: 'en-IN',
    rateToInr: 1.0,
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    flag: '🇺🇸',
    locale: 'en-US',
    rateToInr: 86.5,
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    flag: '🇪🇺',
    locale: 'de-DE',
    rateToInr: 91.2,
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    flag: '🇬🇧',
    locale: 'en-GB',
    rateToInr: 109.8,
  },
  AED: {
    code: 'AED',
    symbol: 'د.إ',
    name: 'UAE Dirham',
    flag: '🇦🇪',
    locale: 'ar-AE',
    rateToInr: 23.55,
  },
  CAD: {
    code: 'CAD',
    symbol: 'CA$',
    name: 'Canadian Dollar',
    flag: '🇨🇦',
    locale: 'en-CA',
    rateToInr: 60.8,
  },
  AUD: {
    code: 'AUD',
    symbol: 'AU$',
    name: 'Australian Dollar',
    flag: '🇦🇺',
    locale: 'en-AU',
    rateToInr: 54.3,
  },
  SGD: {
    code: 'SGD',
    symbol: 'SG$',
    name: 'Singapore Dollar',
    flag: '🇸🇬',
    locale: 'en-SG',
    rateToInr: 64.1,
  },
};

export const CURRENCY_OPTIONS = Object.values(SUPPORTED_CURRENCIES).map((c) => ({
  value: c.code,
  label: `${c.code} (${c.symbol}) - ${c.name}`,
  symbol: c.symbol,
  flag: c.flag,
}));

/**
 * Converts an amount from one currency to another using INR as base peg.
 */
export function convertCurrency(
  amount: number,
  fromCode: string = 'INR',
  toCode: string = 'USD'
): number {
  if (isNaN(amount) || amount === 0) return 0;
  if (fromCode === toCode) return amount;

  const from = SUPPORTED_CURRENCIES[fromCode] || SUPPORTED_CURRENCIES.INR;
  const to = SUPPORTED_CURRENCIES[toCode] || SUPPORTED_CURRENCIES.INR;

  // Amount in INR
  const inInr = amount * from.rateToInr;
  // Convert INR to target currency
  const converted = inInr / to.rateToInr;

  return Math.round(converted * 100) / 100;
}

/**
 * Returns exchange rate of 1 unit of `fromCode` in terms of `toCode`.
 */
export function getExchangeRate(fromCode: string, toCode: string): number {
  if (fromCode === toCode) return 1.0;
  const from = SUPPORTED_CURRENCIES[fromCode] || SUPPORTED_CURRENCIES.INR;
  const to = SUPPORTED_CURRENCIES[toCode] || SUPPORTED_CURRENCIES.INR;
  return Math.round((from.rateToInr / to.rateToInr) * 10000) / 10000;
}

/**
 * Gets currency symbol for any code. Defaults to '₹'.
 */
export function getCurrencySymbol(code: string = 'INR'): string {
  return SUPPORTED_CURRENCIES[code]?.symbol || '₹';
}

/**
 * Format any amount into localized currency display.
 */
export function formatCurrencyAmount(
  amount: number,
  currencyCode: string = 'INR',
  options: { compact?: boolean; hideDecimalsIfWhole?: boolean } = {}
): string {
  const code = (currencyCode || 'INR').toUpperCase();
  const config = SUPPORTED_CURRENCIES[code] || SUPPORTED_CURRENCIES.INR;
  const hideDecimals = options.hideDecimalsIfWhole !== false && amount % 1 === 0;

  try {
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.code,
      maximumFractionDigits: hideDecimals ? 0 : 2,
      minimumFractionDigits: hideDecimals ? 0 : 2,
      notation: options.compact ? 'compact' : 'standard',
    }).format(amount);
  } catch {
    const formattedNum = hideDecimals ? Math.round(amount).toLocaleString(config.locale) : amount.toFixed(2);
    return `${config.symbol}${formattedNum}`;
  }
}
