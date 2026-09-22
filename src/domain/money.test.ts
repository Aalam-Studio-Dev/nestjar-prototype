import { describe, expect, it } from 'vitest';
import { formatMoney, money, parseAmount, sumMinor, toInputValue } from './money';

describe('parseAmount', () => {
  it.each([
    ['12', 1200],
    ['12.5', 1250],
    ['12.05', 1205],
    ['1,234.56', 123456],
    [' £64.20 ', 6420],
    ['$4200', 420000],
    ['0', 0],
  ])('parses %j as %i minor units', (input, expected) => {
    expect(parseAmount(input)).toBe(expected);
  });

  it.each(['', '  ', 'abc', '-5', '1.234', '1.2.3', '12e3'])('rejects %j', (input) => {
    expect(parseAmount(input)).toBeNull();
  });

  it('avoids floating point drift', () => {
    expect(parseAmount('0.29')).toBe(29);
    expect(parseAmount('1.10')).toBe(110);
  });
});

describe('toInputValue', () => {
  it('round-trips with parseAmount', () => {
    for (const value of [1, 99, 100, 6420, 123456]) {
      expect(parseAmount(toInputValue(value))).toBe(value);
    }
  });

  it('renders zero as an empty field', () => {
    expect(toInputValue(0)).toBe('');
  });
});

describe('formatMoney', () => {
  it('formats each currency in its own locale', () => {
    expect(formatMoney(123456, 'GBP')).toBe('£1,234.56');
    expect(formatMoney(123456, 'USD')).toBe('$1,234.56');
  });

  it('can trim whole units for headline figures', () => {
    expect(formatMoney(5800, 'GBP', { trimWholeUnits: true })).toBe('£58');
    expect(formatMoney(5850, 'GBP', { trimWholeUnits: true })).toBe('£58.50');
  });

  it('can always show a sign', () => {
    expect(formatMoney(500, 'GBP', { signDisplay: 'always' })).toBe('+£5.00');
  });
});

describe('money', () => {
  it('refuses fractional minor units', () => {
    expect(() => money(1.5, 'GBP')).toThrow(RangeError);
  });

  it('sums minor units', () => {
    expect(sumMinor([1, 2, 3])).toBe(6);
  });
});
