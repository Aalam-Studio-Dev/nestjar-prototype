import { describe, expect, it } from 'vitest';
import { contrastRatio, parseHex } from './contrast';

describe('contrastRatio', () => {
  it('spans 1:1 to 21:1', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrastRatio('#777', '#777')).toBeCloseTo(1, 5);
  });

  it('matches the ratios documented for the brand tokens', () => {
    expect(contrastRatio('#8a5f12', '#fbf8f0')).toBeCloseTo(5.3, 1);
    expect(contrastRatio('#7c5a14', '#f3dfb1')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#8a5f12', '#f3dfb1')).toBeLessThan(4.5);
  });

  it('declines colours it cannot measure', () => {
    expect(parseHex('rgb(0 0 0)')).toBeNull();
    expect(contrastRatio('rgb(0 0 0)', '#fff')).toBeNull();
  });
});
