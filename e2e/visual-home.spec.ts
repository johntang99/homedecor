import { test, expect } from '@playwright/test';

const SCREENSHOT_DIR = 'e2e/screenshots';

test.describe('Homepage — English (/en)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en');
    await page.waitForLoadState('networkidle');
  });

  test('page loads and hero slideshow is visible', async ({ page }) => {
    const hero = page.locator('section').first();
    await expect(hero).toBeVisible();
    // Hero should contain slideshow images
    const heroImages = hero.locator('img');
    await expect(heroImages.first()).toBeVisible({ timeout: 15000 });
    // Tagline should be present
    await expect(page.getByText('25 Years of Timeless Design')).toBeVisible();
  });

  test('header is transparent on hero then solid after scroll', async ({ page }) => {
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // On hero, header should have bg-transparent class
    await expect(header).toHaveClass(/bg-transparent/);

    // Scroll down past hero
    await page.evaluate(() => window.scrollTo(0, 800));
    await page.waitForTimeout(500);

    // After scroll, header should no longer be transparent
    await expect(header).not.toHaveClass(/bg-transparent/);
    // Should have shadow after scrolling
    await expect(header).toHaveClass(/shadow-sm/);
  });

  test('introduction section is visible with image', async ({ page }) => {
    const introHeading = page.locator('h2', { hasText: 'Spaces That Transcend Trends' }).first();
    await introHeading.scrollIntoViewIfNeeded();
    await expect(introHeading).toBeVisible();

    // Introduction section should contain an image
    const introSection = introHeading.locator('xpath=ancestor::section[1] | ancestor::div[contains(@class,"container")][1]').first();
    const introImage = introSection.locator('img').first();
    await expect(introImage).toBeVisible();
  });

  test('portfolio preview grid shows project items', async ({ page }) => {
    const portfolioHeading = page.getByText('Portfolio Highlights');
    await portfolioHeading.scrollIntoViewIfNeeded();
    await expect(portfolioHeading).toBeVisible();

    // Grid should have project links
    const portfolioSection = page.locator('section:has-text("Portfolio Highlights")');
    const projectLinks = portfolioSection.locator('a[href*="/portfolio/"]');
    const count = await projectLinks.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('services section shows 3 cards', async ({ page }) => {
    const servicesHeading = page.getByText('What We Do');
    await servicesHeading.scrollIntoViewIfNeeded();
    await expect(servicesHeading).toBeVisible();

    // Service cards are links to /services and /shop
    const servicesSection = page.locator('section:has-text("What We Do")').first();
    const serviceLinks = servicesSection.locator('a');
    const count = await serviceLinks.count();
    expect(count).toBeGreaterThanOrEqual(3);

    // Verify service titles
    await expect(servicesSection.getByText('Interior Design').first()).toBeVisible();
    await expect(servicesSection.getByText('Construction & Installation')).toBeVisible();
    await expect(servicesSection.getByText('Furniture', { exact: false })).toBeVisible();
  });

  test('shop preview shows products', async ({ page }) => {
    const shopHeading = page.getByText('Shop Julia Studio');
    await shopHeading.scrollIntoViewIfNeeded();
    await expect(shopHeading).toBeVisible();

    const shopSection = page.locator('section:has-text("Shop Julia Studio")');
    const productLinks = shopSection.locator('a[href*="/shop/"]');
    const count = await productLinks.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('journal preview shows cards', async ({ page }) => {
    const journalHeading = page.getByText('From the Journal');
    await journalHeading.scrollIntoViewIfNeeded();
    await expect(journalHeading).toBeVisible();

    const journalSection = page.locator('section:has-text("From the Journal")');
    const journalCards = journalSection.locator('a[href*="/journal/"]');
    const count = await journalCards.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('testimonials section is visible', async ({ page }) => {
    const testimonialsHeading = page.getByText('What Clients Say About Julia Studio');
    await testimonialsHeading.scrollIntoViewIfNeeded();
    await expect(testimonialsHeading).toBeVisible();

    // Check for testimonial cards with star ratings
    const testimonialsSection = page.locator('section:has-text("Client Stories")');
    const testimonialCards = testimonialsSection.locator('article');
    const count = await testimonialCards.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('CTA section at bottom is visible', async ({ page }) => {
    const ctaHeading = page.getByText('Begin Your Design Journey');
    await ctaHeading.scrollIntoViewIfNeeded();
    await expect(ctaHeading).toBeVisible();

    const ctaButton = page.getByText('Book Consultation').last();
    await expect(ctaButton).toBeVisible();
  });

  test('no console errors on page load', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    await page.goto('/en');
    await page.waitForLoadState('networkidle');
    // Filter out known non-critical errors (e.g., favicon, third-party)
    const criticalErrors = consoleErrors.filter(
      (e) => !e.includes('favicon') && !e.includes('404') && !e.includes('Failed to load resource')
    );
    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe('Homepage — Chinese (/zh)', () => {
  test('loads with Chinese text', async ({ page }) => {
    await page.goto('/zh');
    await page.waitForLoadState('networkidle');

    // Chinese hero tagline
    await expect(page.getByText('25年匠心设计')).toBeVisible();

    // Chinese section headings
    await expect(page.getByText('超越潮流的空间设计')).toBeVisible();
    await expect(page.getByText('作品集精选')).toBeVisible();
    await expect(page.getByText('我们的服务')).toBeVisible();
    await expect(page.getByText('选购 Julia Studio')).toBeVisible();
    await expect(page.getByText('设计日志')).toBeVisible();
    await expect(page.getByText('开启您的设计之旅')).toBeVisible();
  });
});

test.describe('Homepage — Responsive screenshots', () => {
  const viewports = [
    { name: 'desktop', width: 1280, height: 800 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 390, height: 844 },
  ];

  for (const vp of viewports) {
    test(`full-page screenshot at ${vp.name} (${vp.width}px)`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
      });
      const page = await context.newPage();
      await page.goto('/en');
      await page.waitForLoadState('networkidle');
      // Wait for hero images to load
      await page.waitForTimeout(2000);
      await page.screenshot({
        fullPage: true,
        path: `${SCREENSHOT_DIR}/home-en-${vp.name}.png`,
      });
      await context.close();
    });
  }
});
