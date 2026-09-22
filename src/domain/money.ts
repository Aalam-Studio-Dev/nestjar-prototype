/**
 * Money primitives.
 *
 * Every amount in nestjar is an integer number of minor units (pence, cents).
 * Floating point is only used at the edges: parsing what a person typed and
 * multiplying by an exchange rate, both of which round straight back to an integer.
 */

export const CURRENCY_CODES = ['GBP', 'USD'] as const;
export type CurrencyCode = (typeof CURRENCY_CODES)[number];

export interface CurrencyInfo {
  readonly code: CurrencyCode;
  readonly name: string;
  readonly symbol: string;
  /** The everyday word for one unit, as in "every pound has a job". */
  readonly unit: string;
  /** Locale used to format this currency so symbols and grouping read naturally. */
  readonly locale: string;
}

export const CURRENCIES: Readonly<Record<CurrencyCode, CurrencyInfo>> = {
  GBP: {
    code: 'GBP',
    name: 'British pound',
    symbol: '£',
    unit: 'pound',
    locale: 'en-GB',
  },
  USD: {
    code: 'USD',
    name: 'US dollar',
    symbol: '$',
    unit: 'dollar',
    locale: 'en-US',
  },
};

/** Integer minor units. A branded alias would be stricter; a plain alias keeps the demo readable. */
export type Minor = number;

export interface Money {
  readonly amount: Minor;
  readonly currency: CurrencyCode;
}

export function money(amount: Minor, currency: CurrencyCode): Money {
  if (!Number.isInteger(amount)) {
    throw new RangeError(`Money amounts must be integer minor units, received ${amount}`);
  }
  return { amount, currency };
}

export function isCurrencyCode(value: string): value is CurrencyCode {
  return (CURRENCY_CODES as readonly string[]).includes(value);
}

export function sumMinor(values: Iterable<Minor>): Minor {
  let total = 0;
  for (const value of values) total += value;
  return total;
}

const MAX_INPUT_MINOR = 100_000_000_00; // 100 million in major units; generous but finite.

/**
 * Parses what a person typed into a money field.
 * Accepts "1,234.56", "£1234", " 12.5 ". Rejects negatives, more than two
 * decimal places, and anything that is not a number. Returns null when invalid.
 */
export function parseAmount(input: string): Minor | null {
  const cleaned = input.trim().replace(/[£$,\s]/g, '');
  if (cleaned === '') return null;
  if (!/^\d+(\.\d{0,2})?$/.test(cleaned)) return null;
  const [whole = '0', fraction = ''] = cleaned.split('.');
  const minor = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(minor) || minor > MAX_INPUT_MINOR) return null;
  return minor;
}

/** Renders minor units as a plain decimal for an editable input, e.g. 123450 becomes "1234.50". */
export function toInputValue(amount: Minor): string {
  if (amount === 0) return '';
  const whole = Math.trunc(amount / 100);
  const fraction = Math.abs(amount % 100);
  return fraction === 0 ? String(whole) : `${whole}.${String(fraction).padStart(2, '0')}`;
}

export interface FormatOptions {
  readonly signDisplay?: 'auto' | 'always' | 'exceptZero';
  /** Drops the pence when the amount is a whole number. Used for headline figures. */
  readonly trimWholeUnits?: boolean;
}

const formatterCache = new Map<string, Intl.NumberFormat>();

function formatterFor(
  currency: CurrencyCode,
  options: FormatOptions,
  whole: boolean,
): Intl.NumberFormat {
  const key = `${currency}|${options.signDisplay ?? 'auto'}|${whole}`;
  let formatter = formatterCache.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(CURRENCIES[currency].locale, {
      style: 'currency',
      currency,
      signDisplay: options.signDisplay ?? 'auto',
      minimumFractionDigits: whole ? 0 : 2,
      maximumFractionDigits: whole ? 0 : 2,
    });
    formatterCache.set(key, formatter);
  }
  return formatter;
}

export function formatMoney(
  amount: Minor,
  currency: CurrencyCode,
  options: FormatOptions = {},
): string {
  const whole = options.trimWholeUnits === true && amount % 100 === 0;
  return formatterFor(currency, options, whole).format(amount / 100);
}
