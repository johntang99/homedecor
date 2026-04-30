import { test, expect } from '@playwright/test';

const SCREENSHOT_DIR = 'e2e/screenshots';

const NAV_LINKS = [
  { label: 'Home', href: '/en/' },
  { label: 'Portfolio', href: '/en/portfolio' },
  { label: 'Collections', href: '/en/collections' },
  { label: 'Services', href: '/en/services' },
  { label: 'Shop', href: '/en/shop' },
  { label: 'Journal', href: '/en/journal' },
  { label: 'About', href: '/en/about' },
  { label: 'Contact', href: '/en/contact' },
];

test.describe('Header', () => {
  test('renders with logo "Julia Studio"', async ({ page }) => {
    await page.goto('/en/portfolio');
    await page.waitForLoadState('networkidle');

    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Logo text
    const logo = header.locator('a').first();
    await expect(logo).toContainText('Julia Studio');
  });

  test('desktop nav has all 8 links', async ({ page }) => {
    await page.goto('/en/portfolio');
    await page.waitForLoadState('networkidle');

    // Desktop nav is only visible on lg screens
    const desktopNav = page.locator('header nav');
    await expect(desktopNav).toBeVisible();

    for (const link of NAV_LINKS) {
      const navLink = desktopNav.getByText(link.label, { exact: true });
      await expect(navLink).toBeVisible();
    }
  });
});

test.describe('Mobile navigation', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('hamburger button is visible on mobile', async ({ page }) => {
    await page.goto('/en/portfolio');
    await page.waitForLoadState('networkidle');

    const hamburger = page.locator('button[aria-label="Toggle menu"]');
    await expect(hamburger).toBeVisible();
  });

  test('clicking hamburger opens overlay with all nav links', async ({ page }) => {
    await page.goto('/en/portfolio');
    await page.waitForLoadState('networkidle');

    // Click hamburger
    const hamburger = page.locator('button[aria-label="Toggle menu"]');
    await hamburger.click();
    await page.waitForTimeout(300);

    // Mobile overlay should be visible
    const overlay = page.locator('.lg\\:hidden.fixed');
    await expect(overlay).toBeVisible();

    // All nav links should be in the overlay
    for (const link of NAV_LINKS) {
      const mobileLink = overlay.getByText(link.label, { exact: true });
      await expect(mobileLink).toBeVisible();
    }

    // Language switcher should be present
    await expect(overlay.getByText('EN')).toBeVisible();
    await expect(overlay.getByText('中文')).toBeVisible();

    await page.screenshot({
      fullPage: true,
      path: `${SCREENSHOT_DIR}/mobile-nav-open.png`,
    });
  });
});

test.describe('Language switcher', () => {
  test('toggles between EN and Chinese', async ({ page }) => {
    await page.goto('/en/portfolio');
    await page.waitForLoadState('networkidle');

    // EN and 中文 buttons should be present in the desktop header area
    const zhBtn = page.locator('header').locator('button', { hasText: '中文' }).first();
    await expect(zhBtn).toBeVisible();

    // Click Chinese switcher and wait for navigation
    await zhBtn.click();
    await page.waitForURL('**/zh/**', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Should navigate to /zh/ path
    expect(page.url()).toContain('/zh');
  });
});

test.describe('Footer', () => {
  test('renders with tagline, columns, newsletter, social links, copyright', async ({ page }) => {
    // Use a shorter page (contact) so footer is easier to reach
    await page.goto('/en/contact');
    await page.waitForLoadState('networkidle');

    const footer = page.locator('footer');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await expect(footer).toBeVisible();

    // Brand name in footer
    await expect(footer.getByText('Julia Studio').first()).toBeVisible();

    // Tagline
    await expect(footer.getByText('Creating timeless spaces since 2001.')).toBeVisible();

    // Column headings
    await expect(footer.getByText('Explore')).toBeVisible();
    await expect(footer.locator('h4', { hasText: 'Studio' })).toBeVisible();

    // Newsletter section
    await expect(footer.getByText('Newsletter')).toBeVisible();
    await expect(footer.getByText('Design inspiration, delivered weekly.')).toBeVisible();
    await expect(footer.locator('input[type="email"]')).toBeVisible();
    await expect(footer.getByText('Subscribe')).toBeVisible();

    // Social links
    const instagramLink = footer.locator('a[href*="instagram"]');
    await expect(instagramLink).toBeVisible();
    const pinterestLink = footer.getByText('Pinterest');
    await expect(pinterestLink).toBeVisible();

    // Copyright
    await expect(footer.getByText(/© 20\d{2} Julia Studio/)).toBeVisible();

    // Legal links
    await expect(footer.getByText('Privacy Policy')).toBeVisible();
    await expect(footer.getByText('Terms of Service')).toBeVisible();

    await page.screenshot({
      fullPage: true,
      path: `${SCREENSHOT_DIR}/footer.png`,
    });
  });
});

test.describe('404 page', () => {
  test('shows proper not-found page', async ({ page }) => {
    const response = await page.goto('/en/nonexistent-page');
    // Should get a 404 status
    expect(response?.status()).toBe(404);

    await page.waitForLoadState('networkidle');

    await page.screenshot({
      fullPage: true,
      path: `${SCREENSHOT_DIR}/404-page.png`,
    });
  });
});

test.describe('All nav links resolve — no 404s', () => {
  const mainRoutes = [
    '/en',
    '/en/portfolio',
    '/en/collections',
    '/en/services',
    '/en/shop',
    '/en/journal',
    '/en/about',
    '/en/contact',
  ];

  for (const route of mainRoutes) {
    test(`${route} does not return 404`, async ({ page }) => {
      const response = await page.goto(route, { timeout: 30000 });
      expect(response?.status()).not.toBe(404);
      expect(response?.status()).toBeLessThan(500);
    });
  }
});
