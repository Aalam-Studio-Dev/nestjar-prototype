import axe from 'axe-core';
import { expect } from 'vitest';

/**
 * Runs axe against a rendered component. jsdom has no layout, so rules that
 * need real geometry (colour contrast, target size) are left to the
 * Playwright suite, which runs axe in a real browser.
 */
export async function expectAccessible(container: Element): Promise<void> {
  const results = await axe.run(container, {
    rules: {
      'color-contrast': { enabled: false },
      'target-size': { enabled: false },
      region: { enabled: false },
    },
  });
  expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
}
