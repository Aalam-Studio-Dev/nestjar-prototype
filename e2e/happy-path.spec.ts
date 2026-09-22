import { expect, test } from '@playwright/test';
import {
  activate,
  expectHeadingFocused,
  expectNoAxeViolations,
  freshStart,
  tabTo,
} from './support';

/**
 * The whole story, keyboard only, with an axe scan at every stage.
 * No mouse events are used anywhere in this file.
 */
test('a couple plans and fully seeds a month using only the keyboard', async ({ page }) => {
  await freshStart(page);
  await expectNoAxeViolations(page);

  await activate(page, page.getByRole('link', { name: 'Start the demo' }));
  await expectHeadingFocused(page, 'Name your budget');
  await expectNoAxeViolations(page);

  await activate(page, page.getByRole('button', { name: 'Create budget' }));
  await expectHeadingFocused(page, 'Invite your partner');

  await activate(page, page.getByRole('button', { name: 'Send invite' }));
  await expectHeadingFocused(page, 'What is coming in?');
  await expect(page.getByText('Counts as £3,108.00 at the fixed rate of 0.74.')).toBeVisible();
  await expectNoAxeViolations(page);

  await activate(page, page.getByRole('button', { name: 'Continue' }));
  await expectHeadingFocused(page, 'Where does each account start?');

  await activate(page, page.getByRole('button', { name: 'Continue' }));
  await expectHeadingFocused(page, 'Give every jar a target');
  await expect(page.getByText('£58.00 without a plan yet.', { exact: false })).toBeVisible();
  await expectNoAxeViolations(page);

  await activate(page, page.getByRole('button', { name: 'Continue' }));
  await expectHeadingFocused(page, 'Ready to start October?');

  await activate(page, page.getByRole('button', { name: 'Start October' }));
  await expectHeadingFocused(page, 'October 2026');
  await expectNoAxeViolations(page);

  // Seed every jar to plan. Focus stays on the central jar as its content changes.
  await activate(page, page.getByRole('button', { name: /Seed all to plan/ }));
  await expect(page.getByRole('heading', { name: 'Ready to seed' })).toBeFocused();
  await expect(page.getByText('£58.00 still needs a job', { exact: false })).toBeVisible();

  // Give the remainder a home through the seed sheet.
  const emergency = page.getByRole('button', { name: 'Emergency fund', exact: true });
  await activate(page, emergency);
  const sheet = page.getByRole('dialog', { name: 'Seed Emergency fund' });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByLabel('Amount to seed')).toBeFocused();
  await expectNoAxeViolations(page);
  await page.keyboard.press('Enter');
  await expect(sheet).toBeHidden();
  await expect(page.getByText('Every pound has a job.')).toBeVisible();
  // The chip that opened the sheet is gone, so focus falls back to the jar.
  await expect(page.getByRole('heading', { name: 'Central jar' })).toBeFocused();

  // Log a spend and see its jar move to "Spending".
  await activate(page, page.getByRole('button', { name: 'Log spend' }));
  const log = page.getByRole('dialog', { name: 'Log spending' });
  await expect(log.getByLabel('What was it?')).toBeFocused();
  await tabTo(page, log.getByRole('button', { name: 'Log spend' }));
  await page.keyboard.press('Enter');
  await expect(log).toBeHidden();
  await expect(
    page.getByRole('button', { name: /Groceries, Spending\. £455\.80 left/ }),
  ).toBeVisible();

  await activate(page, page.getByRole('link', { name: 'See October at a glance' }));
  await expectHeadingFocused(page, 'October at a glance');
  await expectNoAxeViolations(page);
});

test('sheets trap focus, close on Escape and return focus to their trigger', async ({ page }) => {
  await freshStart(page);
  await page.goto('/setup');
  await page.getByRole('button', { name: 'Create budget' }).press('Enter');
  await page.getByRole('button', { name: 'Send invite' }).press('Enter');
  for (const next of [
    'Where does each account start?',
    'Give every jar a target',
    /Ready to start/,
  ]) {
    await page.getByRole('button', { name: 'Continue' }).press('Enter');
    await expectHeadingFocused(page, next);
  }
  await page.getByRole('button', { name: 'Start October' }).press('Enter');
  await expectHeadingFocused(page, 'October 2026');

  const groceries = page.getByRole('button', { name: /^Groceries,/ });
  await activate(page, groceries);
  const sheet = page.getByRole('dialog', { name: 'Seed Groceries' });
  await expect(sheet).toBeVisible();

  // Tab never reaches the page behind the dialog. (Browsers may briefly move
  // focus to their own toolbar between cycles, which reports as <body>.)
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    const contained = await sheet.evaluate(
      (el) => el.contains(document.activeElement) || document.activeElement === document.body,
    );
    expect(contained).toBe(true);
  }

  await page.keyboard.press('Escape');
  await expect(sheet).toBeHidden();
  await expect(groceries).toBeFocused();
});

test('paths outside the demo explain themselves instead of breaking', async ({ page }) => {
  await freshStart(page);
  await page.goto('/budget');
  // Before a budget exists, deep links lead back to the start of the story.
  await expect(page).toHaveURL(/\/welcome$/);

  await page.goto('/plan/review');
  await expect(page).toHaveURL(/\/welcome$/);

  await page.goto('/nowhere');
  await expectNoAxeViolations(page);
  await expect(page.getByRole('heading', { name: 'This jar is empty' })).toBeVisible();
});

test('the plan refuses to spend more than the couple earns', async ({ page }) => {
  await freshStart(page);
  await page.goto('/setup');
  await page.getByRole('button', { name: 'Create budget' }).press('Enter');
  await page.getByRole('button', { name: 'Send invite' }).press('Enter');
  await page.getByRole('button', { name: 'Continue' }).press('Enter');
  await expectHeadingFocused(page, 'Where does each account start?');
  await page.getByRole('button', { name: 'Continue' }).press('Enter');
  await expectHeadingFocused(page, 'Give every jar a target');

  const rent = page.getByLabel('Rent & bills');
  await rent.fill('9000');
  await page.getByRole('button', { name: 'Continue' }).press('Enter');

  await expect(page).toHaveURL(/\/plan\/plan$/);
  await expect(page.locator('#plan-summary')).toBeFocused();
  await expect(page.getByRole('alert')).toContainText('more than you expect to earn');
});

test('every stage reflows at 320 CSS pixels without horizontal scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await freshStart(page);
  // Lists anything whose right edge passes the viewport, so a failure names the culprit.
  const noSideScroll = async () => {
    const offenders = await page.evaluate(() => {
      const width = document.documentElement.clientWidth;
      if (document.documentElement.scrollWidth <= width) return [];
      const culprits = [...document.querySelectorAll('main *')]
        .filter((el) => el.getBoundingClientRect().right > width + 1)
        .map((el) => `${el.tagName.toLowerCase()} ${el.getAttribute('class') ?? ''}`)
        .slice(0, 5);
      return culprits.length > 0
        ? culprits
        : [`page is ${document.documentElement.scrollWidth}px wide`];
    });
    expect(offenders).toEqual([]);
  };
  await noSideScroll();
  await page.goto('/setup');
  await page.getByRole('button', { name: 'Create budget' }).press('Enter');
  await page.getByRole('button', { name: 'Send invite' }).press('Enter');
  await expectHeadingFocused(page, 'What is coming in?');
  await noSideScroll();
  await page.getByRole('button', { name: 'Continue' }).press('Enter');
  await expectHeadingFocused(page, 'Where does each account start?');
  await page.getByRole('button', { name: 'Continue' }).press('Enter');
  await expectHeadingFocused(page, 'Give every jar a target');
  await noSideScroll();
  await page.getByRole('button', { name: 'Continue' }).press('Enter');
  await expectHeadingFocused(page, 'Ready to start October?');
  await page.getByRole('button', { name: 'Start October' }).press('Enter');
  await expectHeadingFocused(page, 'October 2026');
  await noSideScroll();
  await page.getByRole('button', { name: /Seed all to plan/ }).press('Enter');
  await expect(page.getByText('still needs a job', { exact: false })).toBeVisible();
  await noSideScroll();
});

test('the design notes sit beside the story and lead back to it', async ({ page }) => {
  await freshStart(page);
  await activate(page, page.getByRole('link', { name: 'Design notes' }));
  await expectHeadingFocused(page, 'Design system');
  await expectNoAxeViolations(page);

  await activate(page, page.getByRole('link', { name: 'Prototype notes' }));
  await expectHeadingFocused(page, 'Prototype notes');
  await expect(page.getByRole('link', { name: 'Prototype notes' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expectNoAxeViolations(page);

  await page.setViewportSize({ width: 320, height: 640 });
  for (const path of ['/system', '/system/notes']) {
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `${path} scrolls sideways`).toBeLessThanOrEqual(0);
  }

  await activate(page, page.getByRole('link', { name: 'Back to the story' }));
  await expect(page).toHaveURL(/\/welcome$/);
});
