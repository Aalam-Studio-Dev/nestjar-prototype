import AxeBuilder from '@axe-core/playwright';
import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Presses Tab until `target` has focus. Fails if it is not reachable within
 * `limit` presses, which is exactly the regression we want to catch.
 */
export async function tabTo(page: Page, target: Locator, limit = 60): Promise<void> {
  for (let i = 0; i < limit; i++) {
    if (await target.evaluate((el) => el === document.activeElement)) return;
    await page.keyboard.press('Tab');
  }
  throw new Error(`Could not reach ${String(target)} with the keyboard in ${limit} presses`);
}

/** Tabs to a control and activates it with Enter, as a keyboard user would. */
export async function activate(page: Page, target: Locator): Promise<void> {
  await tabTo(page, target);
  await page.keyboard.press('Enter');
}

/** After client-side navigation, focus should sit on the new page's heading. */
export async function expectHeadingFocused(page: Page, name: string | RegExp): Promise<void> {
  const heading = page.getByRole('heading', { level: 1, name });
  await expect(heading).toBeVisible();
  await expect(heading).toBeFocused();
}

export async function expectNoAxeViolations(page: Page): Promise<void> {
  // Contrast measured mid-fade is meaningless, so let entrances settle first.
  // Long or endless animations (spinners, toast timers) are not waited for.
  await page.evaluate(() =>
    Promise.allSettled(
      document
        .getAnimations()
        .filter((a) => Number(a.effect?.getComputedTiming().endTime ?? Infinity) <= 1000)
        .map((a) => a.finished),
    ),
  );
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  const summary = results.violations.map(
    (v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`,
  );
  expect(summary).toEqual([]);
}

/** Starts every test from the beginning of the story. */
export async function freshStart(page: Page): Promise<void> {
  await page.goto('/');
  await page.evaluate(() => sessionStorage.clear());
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}
