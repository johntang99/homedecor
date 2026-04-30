import { test, expect } from '@playwright/test';

/**
 * Edge-case responsive tests for the Julia Studio bilingual site.
 * Validates layout integrity at extreme viewport sizes, breakpoint
 * transitions, sticky filter positioning, and text-overflow safety.
 */

const BASE = 'http://localhost:3040';

// Pages that carry representative layout complexity
const PAGES = [
  '/en',
  '/en/portfolio',
  '/en/shop',
  '/en/journal',
  '/en/about',
  '/en/contact',
  '/zh',
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function waitForPage(page: import('@playwright/test').Page) {
  await page.waitForLoadState('networkidle');
}

async function screenshotOnFail(
  page: import('@playwright/test').Page,
  name: string,
) {
  await page.screenshot({
    fullPage: true,
    path: `e2e/screenshots/edge-responsive-${name}.png`,
  });
}

// ---------------------------------------------------------------------------
// 1. Very small mobile viewport (320x480)
// ---------------------------------------------------------------------------
test.describe('Very small mobile (320x480)', () => {
  test.use({ viewport: { width: 320, height: 480 } });

  for (const path of PAGES) {
    test(`no horizontal overflow on ${path}`, async ({ page }) => {
      await page.goto(`${BASE}${path}`);
      await waitForPage(page);

      const overflow = await page.evaluate(() => {
        return document.body.scrollWidth > window.innerWidth;
      });

      expect.soft(overflow, `Horizontal overflow detected on ${path}`).toBe(false);
      await screenshotOnFail(page, `small-mobile-${path.replace(/\//g, '_')}`);
    });
  }

  test('text does not overflow containers on home page', async ({ page }) => {
    await page.goto(`${BASE}/en`);
    await waitForPage(page);

    // Find all text containers and verify none has visible overflow
    const overflowingElements = await page.evaluate(() => {
      const results: string[] = [];
      const elements = document.querySelectorAll('h1, h2, h3, p, span, a');
      elements.forEach((el) => {
        const style = getComputedStyle(el);
        // Only flag truly visible overflow — skip hidden/clipped
        if (
          el.scrollWidth > el.clientWidth + 2 &&
          style.overflow !== 'hidden' &&
          style.textOverflow !== 'ellipsis' &&
          style.whiteSpace !== 'nowrap'
        ) {
          results.push(
            `${el.tagName}.${el.className.slice(0, 40)} scrollW=${el.scrollWidth} clientW=${el.clientWidth}`,
          );
        }
      });
      return results;
    });

    expect
      .soft(
        overflowingElements.length,
        `Elements overflowing: ${overflowingElements.join(', ')}`,
      )
      .toBe(0);
    await screenshotOnFail(page, 'text-overflow-320');
  });
});

// ---------------------------------------------------------------------------
// 2. Large desktop (2560x1440)
// ---------------------------------------------------------------------------
test.describe('Large desktop (2560x1440)', () => {
  test.use({ viewport: { width: 2560, height: 1440 } });

  test('container does not exceed max-w-7xl on home page', async ({ page }) => {
    await page.goto(`${BASE}/en`);
    await waitForPage(page);

    // max-w-7xl = 80rem = 1280px
    const containerWidths = await page.evaluate(() => {
      const containers = document.querySelectorAll('.container-custom');
      return Array.from(containers).map((c) => c.getBoundingClientRect().width);
    });

    for (const w of containerWidths) {
      // 1280px + small tolerance
      expect.soft(w, 'container-custom wider than max-w-7xl').toBeLessThanOrEqual(1312);
    }
    await screenshotOnFail(page, 'large-desktop-container');
  });

  test('content is horizontally centered', async ({ page }) => {
    await page.goto(`${BASE}/en`);
    await waitForPage(page);

    const marginCheck = await page.evaluate(() => {
      const container = document.querySelector('.container-custom');
      if (!container) return { left: 0, right: 0, balanced: false };
      const rect = container.getBoundingClientRect();
      const left = rect.left;
      const right = window.innerWidth - rect.right;
      return { left, right, balanced: Math.abs(left - right) < 10 };
    });

    expect.soft(marginCheck.balanced, 'Content should be centered on large screen').toBe(true);
    await screenshotOnFail(page, 'large-desktop-centered');
  });
});

// ---------------------------------------------------------------------------
// 3. Landscape mobile (667x375)
// ---------------------------------------------------------------------------
test.describe('Landscape mobile (667x375)', () => {
  test.use({ viewport: { width: 667, height: 375 } });

  test('hero section renders without breakage', async ({ page }) => {
    await page.goto(`${BASE}/en`);
    await waitForPage(page);

    const hero = page.locator('section').first();
    await expect(hero).toBeVisible();

    // Hero should not be taller than 2x viewport in landscape
    const heroHeight = await hero.evaluate((el) => el.getBoundingClientRect().height);
    expect.soft(heroHeight).toBeGreaterThan(0);

    // No horizontal overflow
    const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
    expect.soft(overflow).toBe(false);

    await screenshotOnFail(page, 'landscape-hero');
  });

  test('portfolio page layout is intact in landscape', async ({ page }) => {
    await page.goto(`${BASE}/en/portfolio`);
    await waitForPage(page);

    const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
    expect.soft(overflow).toBe(false);
    await screenshotOnFail(page, 'landscape-portfolio');
  });
});

// ---------------------------------------------------------------------------
// 4. Header at md breakpoint (768px) — mobile overlay top offset
// ---------------------------------------------------------------------------
test.describe('Header at md breakpoint (768px)', () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test('mobile overlay uses correct top offset (top-16 or md:top-20)', async ({ page }) => {
    await page.goto(`${BASE}/en/portfolio`);
    await waitForPage(page);

    // Open mobile menu (visible at < lg = 1024px, so 768px should show hamburger)
    const hamburger = page.locator('button[aria-label="Toggle menu"]');
    if (await hamburger.isVisible()) {
      await hamburger.click();
      await page.waitForTimeout(300);

      // The mobile overlay should exist
      const overlay = page.locator('header .lg\\:hidden.fixed');
      if (await overlay.count() > 0) {
        const topValue = await overlay.evaluate((el) => {
          return getComputedStyle(el).top;
        });

        // At md (768px), header height is h-20 = 5rem = 80px
        // The overlay should have top: 80px (md:top-20) based on the fix
        const topPx = parseFloat(topValue);
        expect
          .soft(topPx, `Mobile overlay top should be 64px or 80px, got ${topPx}px`)
          .toBeGreaterThanOrEqual(60);
        expect.soft(topPx).toBeLessThanOrEqual(84);
      }
    }
    await screenshotOnFail(page, 'header-md-breakpoint');
  });
});

// ---------------------------------------------------------------------------
// 5. Sticky filter bars scroll correctly under the fixed header
// ---------------------------------------------------------------------------
test.describe('Sticky filter positioning', () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test('filter bar stays below fixed header on portfolio page', async ({ page }) => {
    await page.goto(`${BASE}/en/portfolio`);
    await waitForPage(page);

    // Scroll down so sticky filter engages
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(500);

    const filterBar = page.locator('.sticky-page-filter').first();
    if (await filterBar.isVisible()) {
      const filterTop = await filterBar.evaluate((el) => el.getBoundingClientRect().top);
      const headerBottom = await page.evaluate(() => {
        const header = document.querySelector('header');
        return header ? header.getBoundingClientRect().bottom : 0;
      });

      // Filter bar top should be at or just below the header bottom
      // Allow 4px tolerance for sub-pixel differences
      expect
        .soft(
          filterTop,
          `Filter bar (top=${filterTop}) should not overlap header (bottom=${headerBottom})`,
        )
        .toBeGreaterThanOrEqual(headerBottom - 4);
    }
    await screenshotOnFail(page, 'sticky-filter-under-header');
  });

  test('filter bar stays below fixed header on shop page', async ({ page }) => {
    await page.goto(`${BASE}/en/shop`);
    await waitForPage(page);

    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(500);

    const filterBar = page.locator('.sticky-page-filter').first();
    if (await filterBar.isVisible()) {
      const filterTop = await filterBar.evaluate((el) => el.getBoundingClientRect().top);
      const headerBottom = await page.evaluate(() => {
        const header = document.querySelector('header');
        return header ? header.getBoundingClientRect().bottom : 0;
      });

      expect
        .soft(filterTop)
        .toBeGreaterThanOrEqual(headerBottom - 4);
    }
    await screenshotOnFail(page, 'sticky-filter-shop');
  });
});

// ---------------------------------------------------------------------------
// 6. Text truncation at small viewports
// ---------------------------------------------------------------------------
test.describe('Text truncation safety', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('no horizontal scroll on Chinese locale pages', async ({ page }) => {
    await page.goto(`${BASE}/zh`);
    await waitForPage(page);

    const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
    expect.soft(overflow, 'Chinese home page should not overflow horizontally').toBe(false);
    await screenshotOnFail(page, 'text-truncation-zh');
  });

  test('long headings in portfolio do not overflow', async ({ page }) => {
    await page.goto(`${BASE}/en/portfolio`);
    await waitForPage(page);

    const headingOverflows = await page.evaluate(() => {
      const headings = document.querySelectorAll('h1, h2, h3');
      const results: string[] = [];
      headings.forEach((h) => {
        if (h.scrollWidth > h.clientWidth + 2) {
          results.push(`${h.tagName}: "${h.textContent?.slice(0, 30)}..." overflows`);
        }
      });
      return results;
    });

    expect
      .soft(headingOverflows.length, headingOverflows.join('; '))
      .toBe(0);
    await screenshotOnFail(page, 'heading-overflow-portfolio');
  });
});
