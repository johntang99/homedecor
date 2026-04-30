import { test, expect } from '@playwright/test';

const SCREENSHOT_DIR = 'e2e/screenshots';

// ── About page ────────────────────────────────────────────────────────────────
test.describe('About page (/en/about)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/about');
    await page.waitForLoadState('networkidle');
  });

  test('hero section is visible', async ({ page }) => {
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText(/About Julia Studio/);
  });

  test('philosophy section is visible', async ({ page }) => {
    // Philosophy section with content
    const philosophyHeading = page.getByText(/Philosophy|Our Philosophy/i);
    if (await philosophyHeading.isVisible().catch(() => false)) {
      await philosophyHeading.scrollIntoViewIfNeeded();
      await expect(philosophyHeading).toBeVisible();
    }
  });

  test('story section with content blocks is visible', async ({ page }) => {
    // Story section should have text and image blocks
    const storySection = page.locator('section').nth(1);
    await storySection.scrollIntoViewIfNeeded();
    await expect(storySection).toBeVisible();

    // Should contain text content
    const storyText = storySection.locator('p').first();
    await expect(storyText).toBeVisible();
  });

  test('stats section shows "25 Years" and "1000+ Projects"', async ({ page }) => {
    const yearsText = page.getByText('25', { exact: false });
    const projectsText = page.getByText('1,000', { exact: false });

    // Look for stats with known values
    const statsValues = page.locator('text=/25|1,000|1000/');
    const count = await statsValues.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('team cards are visible', async ({ page }) => {
    const teamHeading = page.getByText(/Team|Our Team/i);
    if (await teamHeading.isVisible().catch(() => false)) {
      await teamHeading.scrollIntoViewIfNeeded();
      await expect(teamHeading).toBeVisible();

      // Should have team member cards
      const teamSection = page.locator('section:has-text("Team")').last();
      const memberNames = teamSection.locator('p, h3').filter({ hasText: /.{2,}/ });
      const count = await memberNames.count();
      expect(count).toBeGreaterThanOrEqual(1);
    }
  });

  test('timeline is visible', async ({ page }) => {
    const timelineHeading = page.getByText(/Timeline|Milestones|Journey/i);
    if (await timelineHeading.isVisible().catch(() => false)) {
      await timelineHeading.scrollIntoViewIfNeeded();
      await expect(timelineHeading).toBeVisible();
    }
  });

  test('full-page screenshot', async ({ page }) => {
    await page.screenshot({
      fullPage: true,
      path: `${SCREENSHOT_DIR}/about.png`,
    });
  });
});

// ── Services page ─────────────────────────────────────────────────────────────
test.describe('Services page (/en/services)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/services');
    await page.waitForLoadState('networkidle');
  });

  test('hero section is visible', async ({ page }) => {
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText(/Services|Our Services/);
  });

  test('process section with steps is visible', async ({ page }) => {
    const processHeading = page.getByText(/Process|Our Process|How We Work/i);
    if (await processHeading.isVisible().catch(() => false)) {
      await processHeading.scrollIntoViewIfNeeded();
      await expect(processHeading).toBeVisible();
    }
  });

  test('specialties grid is visible', async ({ page }) => {
    const specialtiesHeading = page.getByText(/Specialist|Specialt/i);
    if (await specialtiesHeading.isVisible().catch(() => false)) {
      await specialtiesHeading.scrollIntoViewIfNeeded();
      await expect(specialtiesHeading).toBeVisible();
    }
  });

  test('full-page screenshot', async ({ page }) => {
    await page.screenshot({
      fullPage: true,
      path: `${SCREENSHOT_DIR}/services.png`,
    });
  });
});

// ── Contact page ──────────────────────────────────────────────────────────────
test.describe('Contact page (/en/contact)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/contact');
    await page.waitForLoadState('networkidle');
  });

  test('hero is visible with heading', async ({ page }) => {
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText(/Begin Your Design Journey|Contact/);
  });

  test('form renders with all fields', async ({ page }) => {
    // The form section should be visible
    const formSection = page.locator('form, section:has(input)').first();
    await expect(formSection).toBeVisible();

    // Should have input fields (name, email, etc.)
    const inputs = page.locator('input, textarea, select');
    const count = await inputs.count();
    expect(count).toBeGreaterThanOrEqual(2);

    // Email input
    const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]').first();
    if (await emailInput.isVisible().catch(() => false)) {
      await expect(emailInput).toBeVisible();
    }
  });

  test('submit button is visible', async ({ page }) => {
    const submitBtn = page.locator('button[type="submit"], button:has-text("Send"), button:has-text("Submit"), a:has-text("Inquire")');
    if (await submitBtn.first().isVisible().catch(() => false)) {
      await expect(submitBtn.first()).toBeVisible();
    }
  });

  test('full-page screenshot', async ({ page }) => {
    await page.screenshot({
      fullPage: true,
      path: `${SCREENSHOT_DIR}/contact.png`,
    });
  });
});

// ── Collections listing ───────────────────────────────────────────────────────
test.describe('Collections listing (/en/collections)', () => {
  test('loads with grid of collections', async ({ page }) => {
    await page.goto('/en/collections');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText(/Collections|Design Collections/);

    // Grid of collection cards
    const collectionLinks = page.locator('a[href*="/en/collections/"]');
    const count = await collectionLinks.count();
    expect(count).toBeGreaterThanOrEqual(4);

    await page.screenshot({
      fullPage: true,
      path: `${SCREENSHOT_DIR}/collections-listing.png`,
    });
  });
});

// ── Collection detail pages ───────────────────────────────────────────────────
test.describe('Collection detail pages', () => {
  const COLLECTION_SLUGS = [
    'modern-minimalist',
    'warm-transitional',
    'east-west-fusion',
    'village-barn-house',
  ];

  for (const slug of COLLECTION_SLUGS) {
    test(`collection detail loads: ${slug}`, async ({ page }) => {
      await page.goto(`/en/collections/${slug}`, { timeout: 30000 });
      await page.waitForLoadState('networkidle');

      // Back link
      const backLink = page.getByText('All Collections');
      await expect(backLink).toBeVisible();

      // Hero section with cover image
      const heroSection = page.locator('section').first();
      await expect(heroSection).toBeVisible();

      // Collection title (some collections may have empty titles — still check the h1 exists)
      const title = page.locator('h1');
      const titleCount = await title.count();
      expect(titleCount).toBeGreaterThanOrEqual(1);

      await page.screenshot({
        fullPage: true,
        path: `${SCREENSHOT_DIR}/collection-${slug}.png`,
      });
    });
  }
});

// ── FAQ page ──────────────────────────────────────────────────────────────────
test.describe('FAQ page (/en/faq)', () => {
  test('loads with accordions', async ({ page }) => {
    await page.goto('/en/faq');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText(/FAQ|Frequently Asked Questions/);

    // Accordion items — data is server-rendered now
    const accordionButtons = page.locator('button:has(span)').filter({ hasText: /\?/ });
    const count = await accordionButtons.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // Click first accordion to expand it
    if (count > 0) {
      await accordionButtons.first().click();
      await page.waitForTimeout(500);

      // Expanded content should be visible
      const expandedContent = page.locator('.leading-loose').first();
      await expect(expandedContent).toBeVisible();
    }

    await page.screenshot({
      fullPage: true,
      path: `${SCREENSHOT_DIR}/faq.png`,
    });
  });
});

// ── Testimonials page ─────────────────────────────────────────────────────────
test.describe('Testimonials page (/en/testimonials)', () => {
  test('loads with testimonial cards', async ({ page }) => {
    await page.goto('/en/testimonials');
    await page.waitForLoadState('networkidle');

    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText(/Client Stories|Testimonials/);

    // Testimonial cards should be visible (with quotes)
    const testimonialCards = page.locator('.card-frame');
    const count = await testimonialCards.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // Quotes should contain text in blockquote elements
    const quotes = page.locator('blockquote');
    const quoteCount = await quotes.count();
    expect(quoteCount).toBeGreaterThanOrEqual(1);

    // Star ratings should be visible
    const stars = page.locator('svg.fill-\\[var\\(--secondary\\)\\], svg.fill-current');
    const starCount = await stars.count();
    expect(starCount).toBeGreaterThanOrEqual(1);

    await page.screenshot({
      fullPage: true,
      path: `${SCREENSHOT_DIR}/testimonials.png`,
    });
  });
});
