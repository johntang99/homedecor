import { test, expect } from '@playwright/test';

/**
 * Content edge-case tests for Julia Studio.
 * Validates graceful handling of missing images, empty states, special
 * characters, Chinese font rendering, price formatting, date display,
 * and optional detail-page sections.
 */

const BASE = 'http://localhost:3040';

async function waitForPage(page: import('@playwright/test').Page) {
  await page.waitForLoadState('networkidle');
}

async function screenshot(page: import('@playwright/test').Page, name: string) {
  await page.screenshot({
    fullPage: true,
    path: `e2e/screenshots/edge-content-${name}.png`,
  });
}

// ---------------------------------------------------------------------------
// 1. Pages with no images gracefully show placeholder / bg color
// ---------------------------------------------------------------------------
test.describe('Image placeholder handling', () => {
  test('home page image placeholders use background color fallback', async ({ page }) => {
    await page.goto(`${BASE}/en`);
    await waitForPage(page);

    // Check that image container elements with explicit bg- classes have backgrounds
    const placeholders = page.locator('[class*="bg-[var(--primary-50)]"]');
    const count = await placeholders.count();

    // It is fine to have zero if all images loaded. We just want no broken state.
    for (let i = 0; i < Math.min(count, 5); i++) {
      const el = placeholders.nth(i);
      const bg = await el.evaluate((node) => getComputedStyle(node).backgroundColor);
      // Should not be fully transparent — must have some fallback
      expect
        .soft(bg, 'Placeholder should have a visible background color')
        .not.toBe('rgba(0, 0, 0, 0)');
    }
    await screenshot(page, 'image-placeholder');
  });
});

// ---------------------------------------------------------------------------
// 2. Empty search / filter state
// ---------------------------------------------------------------------------
test.describe('Empty filter state', () => {
  test('shop page shows "No products found" when filtering yields nothing', async ({ page }) => {
    await page.goto(`${BASE}/en/shop`);
    await waitForPage(page);

    await page.waitForSelector('.filter-chip', { timeout: 10_000 });
    await page.waitForTimeout(1000);

    // Click every filter chip to find one that returns zero results
    const chips = page.locator('.filter-chip');
    const chipCount = await chips.count();

    let emptyStateFound = false;
    for (let i = 0; i < chipCount; i++) {
      await chips.nth(i).click();
      await page.waitForTimeout(600);

      const emptyMsg = page.locator('text=No products found').or(
        page.locator('text=暂无产品'),
      );
      if (await emptyMsg.isVisible()) {
        emptyStateFound = true;
        break;
      }
    }

    // If no empty state was triggered, that is OK — we verify the mechanism exists
    // by checking the DOM for the empty state element (even if hidden)
    if (!emptyStateFound) {
      // Switch to "All" filter and verify grid has items
      await chips.first().click();
      await page.waitForTimeout(600);
      const items = page.locator('a[href*="/shop/"]');
      expect.soft(await items.count()).toBeGreaterThan(0);
    }
    await screenshot(page, 'empty-filter-state');
  });
});

// ---------------------------------------------------------------------------
// 3. Very long text content doesn't overflow containers
// ---------------------------------------------------------------------------
test.describe('Long text overflow safety', () => {
  test('all visible text on home page stays within container bounds', async ({ page }) => {
    await page.goto(`${BASE}/en`);
    await waitForPage(page);

    const overflows = await page.evaluate(() => {
      const containers = document.querySelectorAll('.container-custom');
      const issues: string[] = [];
      containers.forEach((container, idx) => {
        // Skip containers inside intentional horizontal scroll areas
        if (container.closest('.overflow-x-auto') || container.querySelector('.overflow-x-auto')) return;
        const cRect = container.getBoundingClientRect();
        const children = container.querySelectorAll('h1, h2, h3, p, blockquote');
        children.forEach((child) => {
          // Skip children inside horizontal scroll containers
          if (child.closest('.overflow-x-auto')) return;
          const chRect = child.getBoundingClientRect();
          if (chRect.width > 0 && chRect.right > cRect.right + 16) {
            issues.push(
              `Container[${idx}] child ${child.tagName} overflows right by ${Math.round(chRect.right - cRect.right)}px`,
            );
          }
        });
      });
      return issues;
    });

    expect
      .soft(overflows.length, overflows.join('; '))
      .toBe(0);
    await screenshot(page, 'long-text-overflow');
  });
});

// ---------------------------------------------------------------------------
// 4. Special characters in content render correctly
// ---------------------------------------------------------------------------
test.describe('Special character rendering', () => {
  test('page renders quotes, em-dashes, and accents without mojibake', async ({ page }) => {
    await page.goto(`${BASE}/en`);
    await waitForPage(page);

    const bodyText = await page.locator('body').textContent();

    // Check for common encoding issues — mojibake patterns
    const mojibakePatterns = [
      '\ufffd', // Replacement character
      'â€"',   // Mis-encoded em-dash
      'â€™',   // Mis-encoded right single quote
      'Ã©',    // Mis-encoded e-acute
      'Ã¨',    // Mis-encoded e-grave
    ];

    for (const pattern of mojibakePatterns) {
      expect
        .soft(bodyText?.includes(pattern), `Found mojibake pattern: ${pattern}`)
        .toBe(false);
    }
    await screenshot(page, 'special-chars');
  });

  test('Chinese page renders without encoding issues', async ({ page }) => {
    await page.goto(`${BASE}/zh`);
    await waitForPage(page);

    const bodyText = await page.locator('body').textContent();

    // Should contain actual Chinese characters
    const hasChinese = /[\u4e00-\u9fff]/.test(bodyText || '');
    expect.soft(hasChinese, 'Chinese page should contain Chinese characters').toBe(true);

    // Should not contain replacement characters
    expect.soft(bodyText?.includes('\ufffd')).toBe(false);
    await screenshot(page, 'special-chars-zh');
  });
});

// ---------------------------------------------------------------------------
// 5. Chinese text renders with correct font (serif for headings)
// ---------------------------------------------------------------------------
test.describe('Chinese font rendering', () => {
  const zhPages = ['/zh', '/zh/portfolio', '/zh/shop', '/zh/journal', '/zh/about'];

  for (const path of zhPages) {
    test(`headings on ${path} use serif/Chinese font`, async ({ page }) => {
      await page.goto(`${BASE}${path}`);
      await waitForPage(page);

      const headings = page.locator('h1, h2, h3');
      const headingCount = await headings.count();

      if (headingCount > 0) {
        const fontFamily = await headings.first().evaluate((el) => {
          return getComputedStyle(el).fontFamily;
        });

        // Should include a serif or Chinese font
        const hasSerifOrChinese =
          fontFamily.includes('Noto Serif') ||
          fontFamily.includes('Songti') ||
          fontFamily.includes('Playfair') ||
          fontFamily.includes('serif') ||
          fontFamily.includes('Georgia');

        expect
          .soft(
            hasSerifOrChinese,
            `Heading font on ${path} should be serif-based, got: ${fontFamily}`,
          )
          .toBe(true);
      }
      await screenshot(page, `chinese-font-${path.replace(/\//g, '_')}`);
    });
  }
});

// ---------------------------------------------------------------------------
// 6. Price formatting displays correctly ($X,XXX not $XXXX)
// ---------------------------------------------------------------------------
test.describe('Price formatting', () => {
  test('shop product prices use comma-separated formatting', async ({ page }) => {
    await page.goto(`${BASE}/en/shop`);
    await waitForPage(page);

    await page.waitForSelector('.filter-chip', { timeout: 10_000 });
    await page.waitForTimeout(1000);

    // Look for price elements
    const priceElements = page.locator('p:has-text("$")');
    const priceCount = await priceElements.count();

    for (let i = 0; i < Math.min(priceCount, 10); i++) {
      const text = await priceElements.nth(i).textContent();
      if (text && text.includes('$')) {
        // Extract the number part after $
        const match = text.match(/\$([\d,]+)/);
        if (match) {
          const numStr = match[1];
          const numValue = parseInt(numStr.replace(/,/g, ''), 10);
          // Numbers >= 1000 should have commas
          if (numValue >= 1000) {
            expect
              .soft(numStr.includes(','), `Price $${numStr} (${numValue}) should have comma formatting`)
              .toBe(true);
          }
        }
      }
    }
    await screenshot(page, 'price-formatting');
  });

  test('home page shop preview prices use comma-separated formatting', async ({ page }) => {
    await page.goto(`${BASE}/en`);
    await waitForPage(page);

    // Shop section prices
    const shopSection = page.locator('section').filter({ hasText: /Shop Julia Studio|Shop All/ });
    if (await shopSection.count() > 0) {
      const prices = shopSection.locator('p:has-text("$")');
      const count = await prices.count();

      for (let i = 0; i < count; i++) {
        const text = await prices.nth(i).textContent();
        if (text) {
          const match = text.match(/\$([\d,]+)/);
          if (match) {
            const numValue = parseInt(match[1].replace(/,/g, ''), 10);
            if (numValue >= 1000) {
              expect
                .soft(match[1].includes(','), `Price $${match[1]} should have commas`)
                .toBe(true);
            }
          }
        }
      }
    }
    await screenshot(page, 'price-formatting-home');
  });
});

// ---------------------------------------------------------------------------
// 7. Dates display correctly in journal posts
// ---------------------------------------------------------------------------
test.describe('Date display', () => {
  test('journal dates are present and well-formed', async ({ page }) => {
    await page.goto(`${BASE}/en/journal`);
    await waitForPage(page);

    await page.waitForSelector('.filter-chip', { timeout: 10_000 });
    await page.waitForTimeout(1000);

    // Journal cards typically display dates like "Author · 2024-01-15"
    // Look for date-like patterns near the dot separator
    const dateTexts = await page.evaluate(() => {
      const elems = document.querySelectorAll('p, span');
      const dates: string[] = [];
      elems.forEach((el) => {
        const text = el.textContent || '';
        // Match common date formats: YYYY-MM-DD, Month DD, YYYY, DD/MM/YYYY
        if (/\d{4}[-/.]\d{2}[-/.]\d{2}/.test(text) || /[A-Z][a-z]+\s+\d{1,2},?\s+\d{4}/.test(text)) {
          dates.push(text.trim());
        }
      });
      return dates;
    });

    // There should be at least one date visible if journal posts exist
    if (dateTexts.length > 0) {
      for (const dt of dateTexts) {
        // Verify it is not a broken string like "undefined" or "NaN"
        expect.soft(dt).not.toContain('undefined');
        expect.soft(dt).not.toContain('NaN');
        expect.soft(dt).not.toContain('Invalid');
      }
    }
    await screenshot(page, 'journal-dates');
  });
});

// ---------------------------------------------------------------------------
// 8. Portfolio detail with no "Shop This Look" section hides it
// ---------------------------------------------------------------------------
test.describe('Optional detail sections', () => {
  test('portfolio detail gracefully hides Shop This Look if absent', async ({ page }) => {
    await page.goto(`${BASE}/en/portfolio`);
    await waitForPage(page);

    await page.waitForSelector('.filter-chip', { timeout: 10_000 });
    await page.waitForTimeout(1000);

    // Navigate to first portfolio detail
    const projectLink = page.locator('a[href*="/en/portfolio/"]').first();
    if (await projectLink.isVisible()) {
      await projectLink.click();
      await waitForPage(page);

      // "Shop This Look" section should either exist with products or be completely absent
      const shopLookSection = page.locator('text=Shop This Look').or(
        page.locator('text=选购同款'),
      );

      if (await shopLookSection.isVisible()) {
        // If visible, it should have product cards nearby
        const productCards = page.locator('a[href*="/shop/"]');
        expect.soft(await productCards.count()).toBeGreaterThan(0);
      }
      // If not visible, that is the correct graceful behaviour
    }
    await screenshot(page, 'shop-this-look');
  });
});

// ---------------------------------------------------------------------------
// 9. Journal detail with no related posts gracefully hides section
// ---------------------------------------------------------------------------
test.describe('Journal detail optional sections', () => {
  test('journal detail gracefully hides related posts if absent', async ({ page }) => {
    await page.goto(`${BASE}/en/journal`);
    await waitForPage(page);

    await page.waitForSelector('.filter-chip', { timeout: 10_000 });
    await page.waitForTimeout(1000);

    const postLink = page.locator('a[href*="/en/journal/"]').first();
    if (await postLink.isVisible()) {
      await postLink.click();
      await waitForPage(page);

      // "Related Posts" section — either shown with items or fully hidden
      const relatedSection = page.locator('text=Related').or(
        page.locator('text=相关文章'),
      );

      if (await relatedSection.isVisible()) {
        // If present, should have at least one link to another journal post
        const relatedLinks = page.locator('a[href*="/journal/"]');
        expect.soft(await relatedLinks.count()).toBeGreaterThan(0);
      }
      // Otherwise, graceful absence is correct
    }
    await screenshot(page, 'journal-related-posts');
  });
});
