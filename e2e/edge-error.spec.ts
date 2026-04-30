import { test, expect } from '@playwright/test';

/**
 * Error and boundary tests for Julia Studio.
 * Validates 404 pages for invalid slugs / locales, redirect behaviour,
 * API health, console error monitoring, and resource loading integrity.
 */

const BASE = 'http://localhost:3040';

async function waitForPage(page: import('@playwright/test').Page) {
  await page.waitForLoadState('networkidle');
}

async function screenshot(page: import('@playwright/test').Page, name: string) {
  await page.screenshot({
    fullPage: true,
    path: `e2e/screenshots/edge-error-${name}.png`,
  });
}

// ---------------------------------------------------------------------------
// 1. Invalid locale (/fr/portfolio) — should redirect or 404
// ---------------------------------------------------------------------------
test.describe('Invalid locale handling', () => {
  test('/fr/portfolio redirects to /en/fr/portfolio or shows 404', async ({ page }) => {
    const response = await page.goto(`${BASE}/fr/portfolio`);
    await waitForPage(page);

    const url = page.url();
    const status = response?.status();

    // Should either redirect to /en/... (middleware adds locale prefix)
    // or show a 404 page
    const redirectedToEn = url.includes('/en/');
    const is404 = status === 404 || (await page.locator('text=404').isVisible());

    expect
      .soft(
        redirectedToEn || is404,
        `Invalid locale /fr/ should redirect or 404, got URL=${url} status=${status}`,
      )
      .toBe(true);
    await screenshot(page, 'invalid-locale-fr');
  });

  test('/de/shop redirects to /en/ or shows 404', async ({ page }) => {
    const response = await page.goto(`${BASE}/de/shop`);
    await waitForPage(page);

    const url = page.url();
    const is404 =
      response?.status() === 404 || (await page.locator('text=404').isVisible());
    const redirectedToEn = url.includes('/en/');

    expect.soft(redirectedToEn || is404).toBe(true);
    await screenshot(page, 'invalid-locale-de');
  });
});

// ---------------------------------------------------------------------------
// 2. Non-existent slugs — 404 pages
// ---------------------------------------------------------------------------
test.describe('Non-existent slugs return 404', () => {
  const slugTests = [
    { path: '/en/portfolio/nonexistent-project-xyz-99', label: 'portfolio' },
    { path: '/en/shop/nonexistent-product-xyz-99', label: 'shop' },
    { path: '/en/journal/nonexistent-article-xyz-99', label: 'journal' },
    { path: '/en/collections/nonexistent-collection-xyz-99', label: 'collections' },
  ];

  for (const { path, label } of slugTests) {
    test(`${label} non-existent slug shows 404: ${path}`, async ({ page }) => {
      const response = await page.goto(`${BASE}${path}`);
      await waitForPage(page);

      const status = response?.status();
      const has404Text = (await page.locator('text=404').count()) > 0 ||
        (await page.locator('text=Page Not Found').count()) > 0 ||
        (await page.locator('text=not found').count()) > 0;

      expect
        .soft(
          status === 404 || has404Text,
          `Expected 404 for ${path}, got status=${status}, 404text=${has404Text}`,
        )
        .toBe(true);

      // 404 page should have a "Go Home" link
      const goHomeLink = page.locator('a:has-text("Go Home")');
      if (has404Text) {
        expect.soft(await goHomeLink.isVisible()).toBe(true);
      }
      await screenshot(page, `404-${label}`);
    });
  }
});

// ---------------------------------------------------------------------------
// 3. Root path (/) redirects to /en
// ---------------------------------------------------------------------------
test.describe('Root path redirect', () => {
  test('/ redirects to /en', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await waitForPage(page);

    const url = page.url();
    expect.soft(url, 'Root / should redirect to /en').toMatch(/\/en\/?$/);
    await screenshot(page, 'root-redirect');
  });
});

// ---------------------------------------------------------------------------
// 4. Path without locale redirects to /en/...
// ---------------------------------------------------------------------------
test.describe('Path without locale redirects', () => {
  test('/portfolio redirects to /en/portfolio', async ({ page }) => {
    await page.goto(`${BASE}/portfolio`);
    await waitForPage(page);

    const url = page.url();
    expect.soft(url).toContain('/en/portfolio');
    await screenshot(page, 'redirect-portfolio');
  });

  test('/shop redirects to /en/shop', async ({ page }) => {
    await page.goto(`${BASE}/shop`);
    await waitForPage(page);

    const url = page.url();
    expect.soft(url).toContain('/en/shop');
    await screenshot(page, 'redirect-shop');
  });

  test('/contact redirects to /en/contact', async ({ page }) => {
    await page.goto(`${BASE}/contact`);
    await waitForPage(page);

    const url = page.url();
    expect.soft(url).toContain('/en/contact');
    await screenshot(page, 'redirect-contact');
  });
});

// ---------------------------------------------------------------------------
// 5. API route /api/health returns 200
// ---------------------------------------------------------------------------
test.describe('API health check', () => {
  test('/api/health returns 200', async ({ page }) => {
    const response = await page.goto(`${BASE}/api/health`);

    expect.soft(response?.status(), '/api/health should return 200').toBe(200);
    await screenshot(page, 'api-health');
  });
});

// ---------------------------------------------------------------------------
// 6. No JavaScript console errors on any page
// ---------------------------------------------------------------------------
test.describe('Console error monitoring', () => {
  const pagesToCheck = [
    '/en',
    '/en/portfolio',
    '/en/shop',
    '/en/journal',
    '/en/about',
    '/en/contact',
    '/zh',
  ];

  for (const path of pagesToCheck) {
    test(`no console errors on ${path}`, async ({ page }) => {
      const errors: string[] = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          const text = msg.text();
          // Filter out known noisy errors that are not bugs
          if (
            !text.includes('favicon') &&
            !text.includes('net::ERR_') &&
            !text.includes('Failed to load resource') &&
            !text.includes('third-party') &&
            !text.includes('ResizeObserver')
          ) {
            errors.push(text);
          }
        }
      });

      page.on('pageerror', (error) => {
        errors.push(`PAGE ERROR: ${error.message}`);
      });

      await page.goto(`${BASE}${path}`);
      await waitForPage(page);

      // Scroll the page to trigger lazy-loaded content
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight / 2);
      });
      await page.waitForTimeout(1000);

      expect
        .soft(errors.length, `Console errors on ${path}: ${errors.join(' | ')}`)
        .toBe(0);
      await screenshot(page, `console-errors-${path.replace(/\//g, '_')}`);
    });
  }
});

// ---------------------------------------------------------------------------
// 7. All images load without 404
// ---------------------------------------------------------------------------
test.describe('Image loading integrity', () => {
  test('no broken images (404) on home page', async ({ page }) => {
    const failedImages: string[] = [];

    page.on('response', (response) => {
      const url = response.url();
      if (
        response.status() === 404 &&
        (url.endsWith('.jpg') ||
          url.endsWith('.jpeg') ||
          url.endsWith('.png') ||
          url.endsWith('.webp') ||
          url.endsWith('.svg') ||
          url.includes('_next/image'))
      ) {
        failedImages.push(url);
      }
    });

    await page.goto(`${BASE}/en`);
    await waitForPage(page);

    // Scroll through page to trigger lazy images
    await page.evaluate(async () => {
      const step = Math.floor(window.innerHeight * 0.8);
      const max = document.body.scrollHeight;
      for (let y = 0; y < max; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 200));
      }
    });
    await page.waitForTimeout(1000);

    expect
      .soft(failedImages.length, `Broken images: ${failedImages.join(', ')}`)
      .toBe(0);
    await screenshot(page, 'broken-images-home');
  });

  test('no broken images on portfolio page', async ({ page }) => {
    const failedImages: string[] = [];

    page.on('response', (response) => {
      const url = response.url();
      if (
        response.status() === 404 &&
        (url.match(/\.(jpg|jpeg|png|webp|svg)(\?|$)/) || url.includes('_next/image'))
      ) {
        failedImages.push(url);
      }
    });

    await page.goto(`${BASE}/en/portfolio`);
    await waitForPage(page);

    // Wait for client-side content
    await page.waitForTimeout(2000);

    expect
      .soft(failedImages.length, `Broken images: ${failedImages.join(', ')}`)
      .toBe(0);
    await screenshot(page, 'broken-images-portfolio');
  });
});

// ---------------------------------------------------------------------------
// 8. No mixed content warnings
// ---------------------------------------------------------------------------
test.describe('Mixed content check', () => {
  test('no HTTP resource requests on localhost pages', async ({ page }) => {
    const httpResources: string[] = [];

    page.on('request', (request) => {
      const url = request.url();
      // Only flag non-localhost HTTP resources (not http://localhost which is expected)
      if (
        url.startsWith('http://') &&
        !url.includes('localhost') &&
        !url.includes('127.0.0.1')
      ) {
        httpResources.push(url);
      }
    });

    await page.goto(`${BASE}/en`);
    await waitForPage(page);

    // Scroll through the page
    await page.evaluate(async () => {
      const step = Math.floor(window.innerHeight * 0.8);
      const max = document.body.scrollHeight;
      for (let y = 0; y < max; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 150));
      }
    });
    await page.waitForTimeout(500);

    expect
      .soft(
        httpResources.length,
        `Insecure HTTP resources found: ${httpResources.join(', ')}`,
      )
      .toBe(0);
    await screenshot(page, 'mixed-content');
  });
});
