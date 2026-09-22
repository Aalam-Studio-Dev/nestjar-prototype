import { CURRENCIES, money, type CurrencyCode, type Minor, type Money } from './money';

/**
 * Exchange rates and the conservative conversion rule.
 *
 * nestjar keeps two rates per currency pair: a "fixed" planning rate the couple
 * agree on for the month, and the "live" market rate. When money crosses
 * currencies the app picks whichever rate is less flattering:
 *
 *   - Money coming in (income) uses the rate that yields LESS base currency.
 *   - Money going out (spending) uses the rate that yields MORE base currency.
 *
 * The budget can therefore only ever be pessimistic about exchange movements,
 * never surprised by them.
 */

export type RateKind = 'fixed' | 'live';
export type FlowDirection = 'inflow' | 'outflow';

export interface RatePair {
  readonly from: CurrencyCode;
  readonly to: CurrencyCode;
  readonly fixed: number;
  readonly live: number;
  /** ISO date the live rate was observed. */
  readonly asOf: string;
}

export interface AppliedRate {
  readonly value: number;
  readonly kind: RateKind;
}

export interface Conversion {
  readonly original: Money;
  readonly base: Money;
  /** Null when no conversion was needed. */
  readonly rate: AppliedRate | null;
}

export class MissingRateError extends Error {
  constructor(from: CurrencyCode, to: CurrencyCode) {
    super(`No exchange rate available from ${from} to ${to}`);
    this.name = 'MissingRateError';
  }
}

/** Finds a rate for the pair, deriving it from the inverse pair if needed. */
export function findRate(
  rates: readonly RatePair[],
  from: CurrencyCode,
  to: CurrencyCode,
): { fixed: number; live: number } {
  const direct = rates.find((r) => r.from === from && r.to === to);
  if (direct) return { fixed: direct.fixed, live: direct.live };
  const inverse = rates.find((r) => r.from === to && r.to === from);
  if (inverse) return { fixed: 1 / inverse.fixed, live: 1 / inverse.live };
  throw new MissingRateError(from, to);
}

export function convertConservatively(
  original: Money,
  baseCurrency: CurrencyCode,
  rates: readonly RatePair[],
  direction: FlowDirection,
): Conversion {
  if (original.currency === baseCurrency) {
    return { original, base: original, rate: null };
  }
  const { fixed, live } = findRate(rates, original.currency, baseCurrency);
  const viaFixed = Math.round(original.amount * fixed);
  const viaLive = Math.round(original.amount * live);

  const preferFixed = direction === 'inflow' ? viaFixed <= viaLive : viaFixed >= viaLive;
  return preferFixed
    ? {
        original,
        base: money(viaFixed, baseCurrency),
        rate: { value: fixed, kind: 'fixed' },
      }
    : {
        original,
        base: money(viaLive, baseCurrency),
        rate: { value: live, kind: 'live' },
      };
}

/**
 * Converts a base-currency amount for display in another currency.
 * Display always uses the fixed planning rate so figures stay stable while
 * the couple flips between currencies.
 */
export function convertForDisplay(
  amount: Minor,
  baseCurrency: CurrencyCode,
  displayCurrency: CurrencyCode,
  rates: readonly RatePair[],
): Minor {
  if (baseCurrency === displayCurrency) return amount;
  const { fixed } = findRate(rates, baseCurrency, displayCurrency);
  return Math.round(amount * fixed);
}

/** "$1 = £0.781". Rates keep up to four decimals, and never fewer than two. */
export function formatRate(from: CurrencyCode, to: CurrencyCode, value: number): string {
  const digits = value.toFixed(4).replace(/0{1,2}$/, '');
  return `${CURRENCIES[from].symbol}1 = ${CURRENCIES[to].symbol}${digits}`;
}

/**
 * The same spend in another currency, with the rate that got it there.
 *   booked: the rate stored with the spend when it was logged. Used whenever
 *           the other currency is the base, so the figure is exactly what the
 *           jar was charged and never shifts.
 *   fixed:  the planning rate, for any other pairing. A stable estimate.
 */
export interface Equivalent {
  readonly amount: Money;
  /** Converts one unit of the paid currency into the equivalent's currency. */
  readonly rate: AppliedRate;
  readonly booked: boolean;
}

export interface SpendLike {
  readonly original: Money;
  readonly base: Minor;
  readonly rate: AppliedRate | null;
}

/**
 * Which currency to show a spend's equivalent in: the viewer's chosen
 * currency, unless the spend was paid in it, in which case the household's
 * other currency. So every row always shows two currencies, never one twice.
 */
export function equivalentCurrency(
  paid: CurrencyCode,
  view: CurrencyCode,
  householdCurrencies: readonly CurrencyCode[],
): CurrencyCode | null {
  if (view !== paid) return view;
  return householdCurrencies.find((c) => c !== paid) ?? null;
}

/**
 * A spend's equivalent in another currency. When that currency is the base,
 * this is the booked figure and its stored rate; a booked amount is never
 * converted again, because converting a conversion would agree with neither
 * the statement nor the jar.
 */
export function equivalentFor(
  spend: SpendLike,
  target: CurrencyCode,
  baseCurrency: CurrencyCode,
  rates: readonly RatePair[],
): Equivalent | null {
  const { original } = spend;
  if (target === original.currency) return null;
  if (target === baseCurrency && spend.rate) {
    return { amount: money(spend.base, baseCurrency), rate: spend.rate, booked: true };
  }
  const { fixed } = findRate(rates, original.currency, target);
  return {
    amount: money(Math.round(original.amount * fixed), target),
    rate: { value: fixed, kind: 'fixed' },
    booked: false,
  };
}
