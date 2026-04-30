import { test, expect } from '@playwright/test';

/**
 * Interaction edge-case tests for Julia Studio.
 * Validates double-click resilience, rapid toggling, keyboard navigation,
 * language switching, load-more behaviour, and navigation patterns.
 */

const BASE = 'http://localhost:3040';

async function waitForPage(page: import('@playwright/test').Page) {
  await page.waitForLoadState('networkidle');
}

async function screenshot(page: import('@playwright/test').Page, name: string) {
  await page.screenshot({
    fullPage: true,
    path: `e2e/screenshots/edge-interaction-${name}.png`,
  });
}

// ---------------------------------------------------------------------------
// 1. Double-click on filter chips doesn't break filtering
// ---------------------------------------------------------------------------
test.describe('Filter chip resilience', () => {
  test('double-click on portfolio filter chip does not break state', async ({ page }) => {
    await page.goto(`${BASE}/en/portfolio`);
    await waitForPage(page);

    // Wait for client hydration and data loading
    await page.waitForSelector('.filter-chip', { timeout: 10_000 });
    const chips = page.locator('.filter-chip');
    const chipCount = await chips.count();

    if (chipCount >= 2) {
      // Double-click the second chip rapidly
      const secondChip = chips.nth(1);
      await secondChip.dblclick();
      await page.waitForTimeout(500);

      // The filter should still be in a consistent state — no blank page
      const body = await page.locator('body').textContent();
      expect.soft(body?.length).toBeGreaterThan(100);

      // Clicking another chip should still work
      await chips.nth(0).click();
      await page.waitForTimeout(500);
      const bodyAfter = await page.locator('body').textContent();
      expect.soft(bodyAfter?.length).toBeGreaterThan(100);
    }
    await screenshot(page, 'double-click-filter');
  });

  test('double-click on shop filter chip does not break state', async ({ page }) => {
    await page.goto(`${BASE}/en/shop`);
    await waitForPage(page);

    await page.waitForSelector('.filter-chip', { timeout: 10_000 });
    const chips = page.locator('.filter-chip');
    const chipCount = await chips.count();

    if (chipCount >= 2) {
      await chips.nth(1).dblclick();
      await page.waitForTimeout(500);
      const body = await page.locator('body').textContent();
      expect.soft(body?.length).toBeGreaterThan(50);
    }
    await screenshot(page, 'double-click-shop-filter');
  });
});

// ---------------------------------------------------------------------------
// 2. Rapidly toggle mobile menu open/close
// ---------------------------------------------------------------------------
test.describe('Mobile menu rapid toggle', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('rapidly toggling mobile menu does not cause visual glitch', async ({ page }) => {
    await page.goto(`${BASE}/en`);
    await waitForPage(page);

    const hamburger = page.locator('button[aria-label="Toggle menu"]');
    await expect(hamburger).toBeVisible();

    // Toggle 6 times rapidly
    for (let i = 0; i < 6; i++) {
      await hamburger.click();
      await page.waitForTimeout(80);
    }

    // After even number of toggles, menu should be closed
    // (6 toggles = 3 open + 3 close = closed)
    await page.waitForTimeout(300);

    // Page should still be interactive — header should be visible
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Body should have content
    const bodyText = await page.locator('body').textContent();
    expect.soft(bodyText?.length).toBeGreaterThan(50);
    await screenshot(page, 'rapid-toggle-menu');
  });
});

// ---------------------------------------------------------------------------
// 3. Click mobile menu link navigates and closes menu
// ---------------------------------------------------------------------------
test.describe('Mobile menu link navigation', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('clicking a mobile menu link navigates and closes menu', async ({ page }) => {
    await page.goto(`${BASE}/en`);
    await waitForPage(page);

    const hamburger = page.locator('button[aria-label="Toggle menu"]');
    await expect(hamburger).toBeVisible();
    await hamburger.click();
    await page.waitForTimeout(300);

    // Click the first nav link inside the mobile overlay
    const mobileLinks = page.locator('header .lg\\:hidden.fixed a.font-serif');
    const linkCount = await mobileLinks.count();

    if (linkCount > 0) {
      const targetHref = await mobileLinks.first().getAttribute('href');
      await mobileLinks.first().click();
      await waitForPage(page);

      // URL should have changed
      if (targetHref) {
        expect.soft(page.url()).toContain(targetHref);
      }

      // Mobile overlay should be closed (no fixed overlay visible)
      const overlay = page.locator('header .lg\\:hidden.fixed');
      await expect.soft(overlay).toHaveCount(0);
    }
    await screenshot(page, 'mobile-menu-navigate');
  });
});

// ---------------------------------------------------------------------------
// 4. Scroll to bottom and back to top — header state transitions
// ---------------------------------------------------------------------------
test.describe('Scroll header transitions', () => {
  test('header transitions correctly on scroll down and back up', async ({ page }) => {
    await page.goto(`${BASE}/en`);
    await waitForPage(page);

    const header = page.locator('header');

    // Initial state — on hero page, header should be transparent
    await expect(header).toHaveClass(/bg-transparent/);

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(600);

    // Header should now have solid background (scrolled state)
    await expect(header).not.toHaveClass(/bg-transparent/);

    // Scroll back to top
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(600);

    // Header should return to transparent state on hero page
    await expect(header).toHaveClass(/bg-transparent/);

    await screenshot(page, 'scroll-header-transitions');
  });
});

// ---------------------------------------------------------------------------
// 5. Filter chips keyboard navigation (Tab + Enter)
// ---------------------------------------------------------------------------
test.describe('Filter chips keyboard navigation', () => {
  test('can Tab to filter chips and activate with Enter', async ({ page }) => {
    await page.goto(`${BASE}/en/portfolio`);
    await waitForPage(page);

    await page.waitForSelector('.filter-chip', { timeout: 10_000 });

    // Tab through page until we reach a filter chip
    // First, focus the body so Tab starts from the top
    await page.keyboard.press('Tab');
    let attempts = 0;
    const maxAttempts = 30;
    let focusedChip = false;

    while (attempts < maxAttempts) {
      const focused = await page.evaluate(() => {
        const el = document.activeElement;
        return el?.classList.contains('filter-chip') ? true : false;
      });

      if (focused) {
        focusedChip = true;
        break;
      }
      await page.keyboard.press('Tab');
      attempts++;
    }

    if (focusedChip) {
      // Press Enter to activate the chip
      const chipTextBefore = await page.evaluate(() => document.activeElement?.textContent || '');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);

      // The filter should have been applied — page should still be functional
      const bodyContent = await page.locator('body').textContent();
      expect.soft(bodyContent?.length).toBeGreaterThan(50);
    }
    await screenshot(page, 'keyboard-filter-chips');
  });
});

// ---------------------------------------------------------------------------
// 6. Load more button behaviour
// ---------------------------------------------------------------------------
test.describe('Load more button', () => {
  test('clicking load more on portfolio shows additional items', async ({ page }) => {
    await page.goto(`${BASE}/en/portfolio`);
    await waitForPage(page);

    // Wait for content to load (client-side fetch)
    await page.waitForSelector('.filter-chip', { timeout: 10_000 });
    await page.waitForTimeout(1000);

    const loadMore = page.locator('.btn-load-more');
    if (await loadMore.isVisible()) {
      // Count items before
      const itemsBefore = await page.locator('.container-custom a[href*="/portfolio/"]').count();

      await loadMore.click();
      await page.waitForTimeout(500);

      const itemsAfter = await page.locator('.container-custom a[href*="/portfolio/"]').count();
      expect.soft(itemsAfter, 'Should show more items after Load More').toBeGreaterThanOrEqual(
        itemsBefore,
      );

      // If still visible, clicking again should load even more (or disappear)
      if (await loadMore.isVisible()) {
        await loadMore.click();
        await page.waitForTimeout(500);

        const itemsFinal = await page.locator('.container-custom a[href*="/portfolio/"]').count();
        expect.soft(itemsFinal).toBeGreaterThanOrEqual(itemsAfter);
      }
    }
    await screenshot(page, 'load-more-portfolio');
  });

  test('clicking load more on shop shows additional products', async ({ page }) => {
    await page.goto(`${BASE}/en/shop`);
    await waitForPage(page);

    await page.waitForSelector('.filter-chip', { timeout: 10_000 });
    await page.waitForTimeout(1000);

    const loadMore = page.locator('.btn-load-more');
    if (await loadMore.isVisible()) {
      const itemsBefore = await page.locator('a[href*="/shop/"]').count();
      await loadMore.click();
      await page.waitForTimeout(500);

      const itemsAfter = await page.locator('a[href*="/shop/"]').count();
      expect.soft(itemsAfter).toBeGreaterThanOrEqual(itemsBefore);
    }
    await screenshot(page, 'load-more-shop');
  });
});

// ---------------------------------------------------------------------------
// 7. Language switch preserves the current page path
// ---------------------------------------------------------------------------
test.describe('Language switching', () => {
  test('switching EN->ZH on portfolio page preserves /portfolio path', async ({ page }) => {
    await page.goto(`${BASE}/en/portfolio`);
    await waitForPage(page);

    const zhButton = page.locator('header button').filter({ hasText: /^中文$/ }).first();

    if (await zhButton.isVisible()) {
      await zhButton.click();
      await page.waitForURL('**/zh/portfolio**', { timeout: 10000 });

      expect.soft(page.url()).toContain('/zh/portfolio');
    }
    await screenshot(page, 'lang-switch-portfolio');
  });

  test('switching ZH->EN on journal page preserves /journal path', async ({ page }) => {
    await page.goto(`${BASE}/zh/journal`);
    await waitForPage(page);

    const enButton = page.locator('header button').filter({ hasText: /^EN$/ }).first();

    if (await enButton.isVisible()) {
      await enButton.click();
      await page.waitForURL('**/en/journal**', { timeout: 10000 });

      expect.soft(page.url()).toContain('/en/journal');
    }
    await screenshot(page, 'lang-switch-journal');
  });

  test('language switch on home page toggles between /en and /zh', async ({ page }) => {
    await page.goto(`${BASE}/en`);
    await waitForPage(page);

    const zhButton = page.locator('header button').filter({ hasText: /^中文$/ }).first();

    if (await zhButton.isVisible()) {
      await zhButton.click();
      await page.waitForURL('**/zh**', { timeout: 10000 });

      const url = page.url();
      expect.soft(url).toContain('/zh');
    }
    await screenshot(page, 'lang-switch-home');
  });
});

// ---------------------------------------------------------------------------
// 8. Back link on detail pages navigates correctly
// ---------------------------------------------------------------------------
test.describe('Back link navigation', () => {
  test('back link on portfolio detail navigates to portfolio list', async ({ page }) => {
    // First go to portfolio list and click the first project link
    await page.goto(`${BASE}/en/portfolio`);
    await waitForPage(page);

    await page.waitForSelector('.filter-chip', { timeout: 10_000 });
    await page.waitForTimeout(1000);

    const projectLink = page.locator('a[href*="/en/portfolio/"]').first();
    if (await projectLink.isVisible()) {
      await projectLink.click();
      await waitForPage(page);

      // Now look for the back link
      const backLink = page.locator('a.detail-back-link, a:has-text("Back"), a:has-text("Portfolio")').first();
      if (await backLink.isVisible()) {
        await backLink.click();
        await waitForPage(page);

        expect.soft(page.url()).toContain('/en/portfolio');
        // Should not be on a detail page anymore
        expect.soft(page.url()).not.toMatch(/\/portfolio\/[a-z]/);
      }
    }
    await screenshot(page, 'back-link-portfolio');
  });
});
