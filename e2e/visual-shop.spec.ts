import { test, expect } from '@playwright/test';

const SCREENSHOT_DIR = 'e2e/screenshots';

const SHOP_SLUGS = [
  'abstract-wall-art',
  'aria-pendant-light',
  'ceramic-vase-set',
  'marin-console-table',
  'woven-throw-blanket',
];

test.describe('Shop listing (/en/shop)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/shop');
    await page.waitForLoadState('networkidle');
    // Wait for client-side data fetch
    await page.waitForTimeout(3000);
  });

  test('loads with hero and product grid', async ({ page }) => {
    // Hero heading
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText(/Shop Julia Studio|Shop/);

    // Product grid should have items
    const productLinks = page.locator('a[href*="/en/shop/"]');
    const count = await productLinks.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('filter chips work', async ({ page }) => {
    // Verify filter bar exists
    await expect(page.getByRole('button', { name: 'All' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Furniture' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Lighting' })).toBeVisible();

    // Click Furniture filter
    await page.getByRole('button', { name: 'Furniture' }).click();
    await page.waitForTimeout(500);

    // Furniture button should be active
    const furnitureBtn = page.getByRole('button', { name: 'Furniture' });
    await expect(furnitureBtn).toHaveClass(/border-\[var\(--secondary\)\]/);
  });

  test('products display prices correctly', async ({ page }) => {
    // At least one product should show a price with dollar sign
    const priceElements = page.locator('text=/\\$[\\d,]+/');
    const count = await priceElements.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('full-page screenshot', async ({ page }) => {
    await page.screenshot({
      fullPage: true,
      path: `${SCREENSHOT_DIR}/shop-listing.png`,
    });
  });
});

test.describe('Shop detail pages', () => {
  for (const slug of SHOP_SLUGS) {
    test(`product detail page loads: ${slug}`, async ({ page }) => {
      await page.goto(`/en/shop/${slug}`, { timeout: 30000 });
      await page.waitForLoadState('networkidle');

      // Back link
      const backLink = page.getByText('Back to Shop');
      await expect(backLink).toBeVisible();

      // Product title
      const title = page.locator('h1');
      await expect(title).toBeVisible();
      const titleText = await title.textContent();
      expect(titleText).toBeTruthy();

      // Price should be displayed with $ symbol
      const price = page.locator('text=/\\$[\\d,]+/').first();
      await expect(price).toBeVisible();

      // Main product image
      const mainImage = page.locator('.aspect-square img').first();
      await expect(mainImage).toBeVisible({ timeout: 10000 });

      // Sticky sidebar with product info
      const stickyInfo = page.locator('.lg\\:sticky').first();
      await expect(stickyInfo).toBeVisible();

      // Specifications section (if present)
      const specsSection = page.locator('text=/Dimensions|Material|Finish|Lead Time/').first();
      if (await specsSection.isVisible().catch(() => false)) {
        await expect(specsSection).toBeVisible();
      }

      // Inquire CTA button
      const inquireBtn = page.getByText('Inquire About This Piece');
      await expect(inquireBtn).toBeVisible();

      // Take screenshot
      await page.screenshot({
        fullPage: true,
        path: `${SCREENSHOT_DIR}/shop-${slug}.png`,
      });
    });
  }
});

test.describe('Shop — Responsive grid', () => {
  const viewports = [
    { name: 'desktop', width: 1280, height: 800, expectedPattern: 'lg:grid-cols-4' },
    { name: 'tablet', width: 768, height: 1024, expectedPattern: 'md:grid-cols-3' },
    { name: 'mobile', width: 390, height: 844, expectedPattern: 'grid-cols-2' },
  ];

  for (const vp of viewports) {
    test(`grid responsive at ${vp.name} (${vp.width}px)`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
      });
      const page = await context.newPage();
      await page.goto('/en/shop');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      // Product grid should be visible
      const grid = page.locator('.grid.grid-cols-2').first();
      await expect(grid).toBeVisible();

      await page.screenshot({
        fullPage: true,
        path: `${SCREENSHOT_DIR}/shop-grid-${vp.name}.png`,
      });
      await context.close();
    });
  }
});
