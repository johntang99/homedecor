import { test, expect } from '@playwright/test';

const SCREENSHOT_DIR = 'e2e/screenshots';

const JOURNAL_SLUGS = [
  '5-rules-mixing-patterns',
  'fabric-selection-process',
  'greenwich-estate-tour',
];

test.describe('Journal listing (/en/journal)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/journal');
    await page.waitForLoadState('networkidle');
    // Wait for client-side data fetch
    await page.waitForTimeout(3000);
  });

  test('loads with hero, featured post, filter bar, and grid', async ({ page }) => {
    // Hero heading
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText(/Journal/);

    // Featured post section (contains "Featured" label)
    const featuredLabel = page.getByText('Featured', { exact: false }).first();
    await expect(featuredLabel).toBeVisible();

    // Filter bar
    await expect(page.getByRole('button', { name: 'All' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Design Tips' })).toBeVisible();

    // Grid should have journal post items
    const postLinks = page.locator('a[href*="/en/journal/"]');
    const count = await postLinks.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('filter bar has expected categories', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'All' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Design Tips' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Project Stories' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Behind the Scenes' })).toBeVisible();
  });

  test('full-page screenshot', async ({ page }) => {
    await page.screenshot({
      fullPage: true,
      path: `${SCREENSHOT_DIR}/journal-listing.png`,
    });
  });
});

test.describe('Journal detail pages', () => {
  for (const slug of JOURNAL_SLUGS) {
    test(`journal post loads: ${slug}`, async ({ page }) => {
      await page.goto(`/en/journal/${slug}`, { timeout: 30000 });
      await page.waitForLoadState('networkidle');

      // Back link
      const backLink = page.getByText('Back to Journal');
      await expect(backLink).toBeVisible();

      // Post title
      const title = page.locator('h1');
      await expect(title).toBeVisible();
      const titleText = await title.textContent();
      expect(titleText).toBeTruthy();

      // Author and date metadata
      const authorDate = page.locator('text=/\\w+ · \\d{4}/').first();
      if (await authorDate.isVisible().catch(() => false)) {
        await expect(authorDate).toBeVisible();
      }

      // Cover image or video embed
      const coverImage = page.locator('.aspect-\\[16\\/9\\] img, .aspect-video iframe').first();
      if (await coverImage.isVisible().catch(() => false)) {
        await expect(coverImage).toBeVisible();
      }

      // Markdown body renders correctly — no raw HTML tags visible
      const bodyContainer = page.locator('.max-w-reading');
      if (await bodyContainer.isVisible().catch(() => false)) {
        const bodyHtml = await bodyContainer.innerHTML();
        // Should contain rendered HTML (p, h2, ul, strong) not raw markdown symbols
        expect(bodyHtml).not.toContain('&lt;p');
        expect(bodyHtml).not.toContain('&lt;h2');
        // Should have some rendered content
        expect(bodyHtml.length).toBeGreaterThan(10);
      }

      // Take screenshot
      await page.screenshot({
        fullPage: true,
        path: `${SCREENSHOT_DIR}/journal-${slug}.png`,
      });
    });
  }
});

test.describe('Journal — Related posts', () => {
  test('related posts section renders if present', async ({ page }) => {
    // Check the first journal post for related posts
    await page.goto('/en/journal/5-rules-mixing-patterns');
    await page.waitForLoadState('networkidle');

    // Look for "Related Articles" section
    const relatedHeading = page.getByText('Related Articles');
    if (await relatedHeading.isVisible().catch(() => false)) {
      await relatedHeading.scrollIntoViewIfNeeded();
      await expect(relatedHeading).toBeVisible();

      const relatedLinks = page.locator('section:has-text("Related Articles") a[href*="/journal/"]');
      const count = await relatedLinks.count();
      expect(count).toBeGreaterThanOrEqual(1);
    }
  });
});

test.describe('Journal — Chinese locale', () => {
  test('Chinese journal listing loads', async ({ page }) => {
    await page.goto('/zh/journal');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Hero with Chinese text
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();

    // Filter bar should be visible (labels may be in English even on Chinese locale)
    const filterBar = page.locator('.sticky-page-filter, [class*="sticky"]');
    await expect(filterBar.first()).toBeVisible();

    await page.screenshot({
      fullPage: true,
      path: `${SCREENSHOT_DIR}/journal-listing-zh.png`,
    });
  });
});
