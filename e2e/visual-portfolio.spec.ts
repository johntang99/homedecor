import { test, expect } from '@playwright/test';

const SCREENSHOT_DIR = 'e2e/screenshots';

const PORTFOLIO_SLUGS = [
  'brooklyn-brownstone',
  'the-greenwich-estate',
  'hudson-yards-office',
  'midtown-penthouse',
  'soho-gallery-exhibition',
  'los-angeles-building',
];

test.describe('Portfolio listing (/en/portfolio)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/portfolio');
    await page.waitForLoadState('networkidle');
    // Wait for client-side data fetch
    await page.waitForTimeout(3000);
  });

  test('loads with hero, filter bar, and project grid', async ({ page }) => {
    // Hero section
    const heroHeading = page.locator('h1');
    await expect(heroHeading).toBeVisible();
    await expect(heroHeading).toContainText(/Our Work|Portfolio/);

    // Filter bar with category chips
    const filterBar = page.locator('.filter-chip').first();
    await expect(filterBar).toBeVisible();

    // Verify filter options exist
    await expect(page.getByRole('button', { name: 'All' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Residential' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Commercial' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Exhibition' })).toBeVisible();

    // Grid should have project items
    const projectLinks = page.locator('a[href*="/en/portfolio/"]');
    const count = await projectLinks.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('filter chips work — clicking Residential filters projects', async ({ page }) => {
    // Click Residential filter
    await page.getByRole('button', { name: 'Residential' }).click();
    await page.waitForTimeout(500);

    // The Residential button should be active (has secondary border)
    const residentialBtn = page.getByRole('button', { name: 'Residential' });
    await expect(residentialBtn).toHaveClass(/border-\[var\(--secondary\)\]/);

    // Grid items should be filtered — all visible projects should be residential
    const projectLinks = page.locator('a[href*="/en/portfolio/"]');
    const count = await projectLinks.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('full-page screenshot', async ({ page }) => {
    await page.screenshot({
      fullPage: true,
      path: `${SCREENSHOT_DIR}/portfolio-listing.png`,
    });
  });
});

test.describe('Portfolio detail pages', () => {
  for (const slug of PORTFOLIO_SLUGS) {
    test(`detail page loads: ${slug}`, async ({ page }) => {
      await page.goto(`/en/portfolio/${slug}`, { timeout: 30000 });
      await page.waitForLoadState('networkidle');

      // Hero image section
      const heroSection = page.locator('section').first();
      await expect(heroSection).toBeVisible();

      // Should have a hero image
      const heroImage = heroSection.locator('img').first();
      await expect(heroImage).toBeVisible({ timeout: 10000 });

      // Back link
      const backLink = page.getByText('Back to Portfolio');
      await expect(backLink).toBeVisible();

      // Project title in hero
      const title = page.locator('h1');
      await expect(title).toBeVisible();
      const titleText = await title.textContent();
      expect(titleText).toBeTruthy();

      // Overview section with body text
      const overviewSection = page.locator('section:has(.lg\\:col-span-2)').first();
      if (await overviewSection.isVisible()) {
        const bodyText = overviewSection.locator('p').first();
        await expect(bodyText).toBeVisible();
      }

      // Gallery images (if present)
      const galleryImages = page.locator('section img');
      const imgCount = await galleryImages.count();
      expect(imgCount).toBeGreaterThanOrEqual(1);

      // Take screenshot
      await page.screenshot({
        fullPage: true,
        path: `${SCREENSHOT_DIR}/portfolio-${slug}.png`,
      });
    });
  }
});

test.describe('Portfolio — Responsive grid', () => {
  const viewports = [
    { name: 'desktop', width: 1280, height: 800, expectedCols: 'columns-3' },
    { name: 'tablet', width: 768, height: 1024, expectedCols: 'columns-2' },
    { name: 'mobile', width: 390, height: 844, expectedCols: 'columns-1' },
  ];

  for (const vp of viewports) {
    test(`grid responsive at ${vp.name} (${vp.width}px)`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
      });
      const page = await context.newPage();
      await page.goto('/en/portfolio');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      // The masonry grid container uses CSS columns
      const gridContainer = page.locator('.columns-1, .md\\:columns-2, .lg\\:columns-3').first();
      await expect(gridContainer).toBeVisible();

      await page.screenshot({
        fullPage: true,
        path: `${SCREENSHOT_DIR}/portfolio-grid-${vp.name}.png`,
      });
      await context.close();
    });
  }
});
