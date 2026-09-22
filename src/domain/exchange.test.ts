import { describe, expect, it } from 'vitest';
import {
  convertConservatively,
  convertForDisplay,
  equivalentCurrency,
  equivalentFor,
  findRate,
  formatRate,
  MissingRateError,
  type RatePair,
} from './exchange';
import { money } from './money';

const rates: RatePair[] = [
  { from: 'USD', to: 'GBP', fixed: 0.74, live: 0.781, asOf: '2026-09-21' },
];

describe('convertConservatively', () => {
  it('leaves base-currency money untouched', () => {
    const result = convertConservatively(money(1000, 'GBP'), 'GBP', rates, 'inflow');
    expect(result.base).toEqual(money(1000, 'GBP'));
    expect(result.rate).toBeNull();
  });

  it('counts income at the rate that yields less', () => {
    const result = convertConservatively(money(4_200_00, 'USD'), 'GBP', rates, 'inflow');
    expect(result.base.amount).toBe(3_108_00);
    expect(result.rate).toEqual({ value: 0.74, kind: 'fixed' });
  });

  it('counts spending at the rate that yields more', () => {
    const result = convertConservatively(money(100_00, 'USD'), 'GBP', rates, 'outflow');
    expect(result.base.amount).toBe(78_10);
    expect(result.rate).toEqual({ value: 0.781, kind: 'live' });
  });

  it('flips the choice when the market moves the other way', () => {
    const weakDollar: RatePair[] = [{ ...rates[0]!, live: 0.7 }];
    expect(
      convertConservatively(money(100_00, 'USD'), 'GBP', weakDollar, 'inflow').rate?.kind,
    ).toBe('live');
    expect(
      convertConservatively(money(100_00, 'USD'), 'GBP', weakDollar, 'outflow').rate?.kind,
    ).toBe('fixed');
  });

  it('derives inverse rates', () => {
    expect(findRate(rates, 'GBP', 'USD').fixed).toBeCloseTo(1 / 0.74);
  });

  it('throws a typed error when a pair is missing', () => {
    expect(() => findRate([], 'USD', 'GBP')).toThrow(MissingRateError);
  });
});

describe('convertForDisplay', () => {
  it('uses the fixed planning rate', () => {
    expect(convertForDisplay(74_00, 'GBP', 'USD', rates)).toBe(100_00);
  });
});

describe('formatRate', () => {
  it('keeps meaningful decimals without trailing noise', () => {
    expect(formatRate('USD', 'GBP', 0.781)).toBe('$1 = £0.781');
    expect(formatRate('USD', 'GBP', 0.74)).toBe('$1 = £0.74');
    expect(formatRate('GBP', 'USD', 1 / 0.74)).toBe('£1 = $1.3514');
  });
});

describe('equivalentCurrency', () => {
  const household = ['GBP', 'USD'] as const;

  it('uses the viewing currency when the spend was paid in another', () => {
    expect(equivalentCurrency('USD', 'GBP', household)).toBe('GBP');
    expect(equivalentCurrency('GBP', 'USD', household)).toBe('USD');
  });

  it('falls back to the other household currency, so no row shows one currency twice', () => {
    expect(equivalentCurrency('GBP', 'GBP', household)).toBe('USD');
    expect(equivalentCurrency('USD', 'USD', household)).toBe('GBP');
  });

  it('has nothing to show for a one-currency household', () => {
    expect(equivalentCurrency('GBP', 'GBP', ['GBP'])).toBeNull();
  });
});

describe('equivalentFor', () => {
  const dollars = {
    original: money(60_00, 'USD'),
    base: 46_86,
    rate: { value: 0.781, kind: 'live' as const },
  };
  const pounds = { original: money(37_00, 'GBP'), base: 37_00, rate: null };

  it('shows a foreign spend in the base at exactly what the jar was charged', () => {
    expect(equivalentFor(dollars, 'GBP', 'GBP', rates)).toEqual({
      amount: money(46_86, 'GBP'),
      rate: { value: 0.781, kind: 'live' },
      booked: true,
    });
  });

  it('shows a base spend in the other currency at the planning rate', () => {
    const result = equivalentFor(pounds, 'USD', 'GBP', rates);
    expect(result?.amount).toEqual(money(50_00, 'USD'));
    expect(result?.rate.kind).toBe('fixed');
    expect(result?.rate.value).toBeCloseTo(1 / 0.74, 6);
    expect(result?.booked).toBe(false);
  });

  it('has no equivalent in the currency it was paid in', () => {
    expect(equivalentFor(pounds, 'GBP', 'GBP', rates)).toBeNull();
  });
});
