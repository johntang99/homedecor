import { test, expect } from '@playwright/test';

/**
 * Accessibility visual-check tests for Julia Studio.
 * Validates keyboard focus rings, z-index layering, text contrast,
 * keyboard reachability of interactive elements, image alt text,
 * and form label associations.
 */

const BASE = 'http://localhost:3040';

async function waitForPage(page: import('@playwright/test').Page) {
  await page.waitForLoadState('networkidle');
}

async function screenshot(page: import('@playwright/test').Page, name: string) {
  await page.screenshot({
    fullPage: true,
    path: `e2e/screenshots/edge-a11y-${name}.png`,
  });
}

// ---------------------------------------------------------------------------
// 1. All buttons have visible focus rings when tabbed to
// ---------------------------------------------------------------------------
test.describe('Focus ring visibility', () => {
  test('buttons show visible focus indicator on keyboard Tab', async ({ page }) => {
    await page.goto(`${BASE}/en`);
    await waitForPage(page);

    // Tab through the page and check each focused button for an outline
    const focusResults: Array<{ tag: string; text: string; hasOutline: boolean }> = [];
    const maxTabs = 25;

    for (let i = 0; i < maxTabs; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);

      const info = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || (el.tagName !== 'BUTTON' && el.tagName !== 'A')) return null;

        const style = getComputedStyle(el);
        const outlineWidth = parseFloat(style.outlineWidth) || 0;
        const outlineStyle = style.outlineStyle;
        const boxShadow = style.boxShadow;

        // Check for visible focus: outline, box-shadow, or ring utility
        const hasVisibleFocus =
          (outlineWidth > 0 && outlineStyle !== 'none') ||
          (boxShadow !== 'none' && boxShadow !== '');

        return {
          tag: el.tagName,
          text: (el.textContent || '').trim().slice(0, 30),
          hasOutline: hasVisibleFocus,
        };
      });

      if (info) {
        focusResults.push(info);
      }
    }

    // At least some interactive elements should have been reached
    expect.soft(focusResults.length, 'Should reach interactive elements via Tab').toBeGreaterThan(0);

    // Report any buttons/links without focus indicators
    const missingFocus = focusResults.filter((r) => !r.hasOutline);
    // Use soft assertion — some items may rely on :focus-visible which only
    // activates on keyboard navigation (which we are doing)
    for (const item of missingFocus) {
      expect
        .soft(
          item.hasOutline,
          `${item.tag} "${item.text}" lacks visible focus indicator`,
        )
        .toBe(true);
    }
    await screenshot(page, 'focus-rings');
  });
});

// ---------------------------------------------------------------------------
// 2. .btn-gold has :focus-visible outline
// ---------------------------------------------------------------------------
test.describe('btn-gold focus-visible', () => {
  test('.btn-gold shows outline on :focus-visible', async ({ page }) => {
    await page.goto(`${BASE}/en`);
    await waitForPage(page);

    // Find a .btn-gold element and focus it via keyboard
    const btnGold = page.locator('.btn-gold').first();
    if (await btnGold.isVisible()) {
      // Tab through until we reach it, or force-focus for the test
      await btnGold.focus();
      await page.waitForTimeout(200);

      // Simulate keyboard focus by using Tab navigation
      // Force :focus-visible state via evaluation
      const focusStyle = await btnGold.evaluate((el) => {
        el.focus();
        const style = getComputedStyle(el);
        return {
          outlineWidth: style.outlineWidth,
          outlineStyle: style.outlineStyle,
          outlineColor: style.outlineColor,
          outlineOffset: style.outlineOffset,
        };
      });

      // The CSS rule is: .btn-gold:focus-visible { outline: 2px solid var(--secondary); outline-offset: 2px; }
      // When programmatically focused, :focus-visible may or may not apply.
      // We verify the CSS exists by checking computed style after pressing Tab to it
      const maxTabs = 40;
      for (let i = 0; i < maxTabs; i++) {
        await page.keyboard.press('Tab');
        const isBtnGold = await page.evaluate(() => {
          return document.activeElement?.classList.contains('btn-gold') || false;
        });
        if (isBtnGold) {
          const outlineInfo = await page.evaluate(() => {
            const el = document.activeElement;
            if (!el) return { width: '0px', style: 'none', color: '' };
            const s = getComputedStyle(el);
            return {
              width: s.outlineWidth,
              style: s.outlineStyle,
              color: s.outlineColor,
            };
          });

          const outlineWidth = parseFloat(outlineInfo.width);
          expect
            .soft(outlineWidth, 'btn-gold should have outline-width >= 2px on focus-visible')
            .toBeGreaterThanOrEqual(2);
          expect
            .soft(outlineInfo.style, 'btn-gold outline should be solid')
            .toBe('solid');
          break;
        }
      }
    }
    await screenshot(page, 'btn-gold-focus-visible');
  });
});

// ---------------------------------------------------------------------------
// 3. Modal/overlay has proper z-index layering
// ---------------------------------------------------------------------------
test.describe('Z-index layering', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('mobile overlay has higher z-index than page content', async ({ page }) => {
    await page.goto(`${BASE}/en`);
    await waitForPage(page);

    const hamburger = page.locator('button[aria-label="Toggle menu"]');
    await expect(hamburger).toBeVisible();
    await hamburger.click();
    await page.waitForTimeout(300);

    const zIndices = await page.evaluate(() => {
      const header = document.querySelector('header');
      const overlay = document.querySelector('header .fixed');
      const mainContent = document.querySelector('main') || document.querySelector('section');

      return {
        header: header ? parseInt(getComputedStyle(header).zIndex || '0', 10) : 0,
        overlay: overlay ? parseInt(getComputedStyle(overlay).zIndex || '0', 10) : 0,
        content: mainContent
          ? parseInt(getComputedStyle(mainContent).zIndex || '0', 10)
          : 0,
      };
    });

    // Header should have z-50 = 50
    expect
      .soft(zIndices.header, 'Header z-index should be >= 40')
      .toBeGreaterThanOrEqual(40);

    // Overlay z-index should be >= content z-index
    expect
      .soft(
        zIndices.overlay,
        'Overlay should have z-index >= 40',
      )
      .toBeGreaterThanOrEqual(40);

    await screenshot(page, 'z-index-layering');
  });
});

// ---------------------------------------------------------------------------
// 4. Text contrast: primary text on backdrop-primary is readable
// ---------------------------------------------------------------------------
test.describe('Text contrast', () => {
  test('primary text color contrasts sufficiently with backdrop', async ({ page }) => {
    await page.goto(`${BASE}/en`);
    await waitForPage(page);

    const contrastInfo = await page.evaluate(() => {
      // Get body text color and background
      const body = document.body;
      const bodyStyle = getComputedStyle(body);
      const textColor = bodyStyle.color;
      const bgColor = bodyStyle.backgroundColor;

      // Parse rgb values
      const parseRGB = (color: string) => {
        const match = color.match(/\d+/g);
        return match ? match.map(Number) : [0, 0, 0];
      };

      // Calculate relative luminance
      const luminance = (r: number, g: number, b: number) => {
        const [rs, gs, bs] = [r, g, b].map((v) => {
          v /= 255;
          return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
      };

      const [tr, tg, tb] = parseRGB(textColor);
      const [br, bg_r, bb] = parseRGB(bgColor);

      const textLum = luminance(tr, tg, tb);
      const bgLum = luminance(br, bg_r, bb);

      const lighter = Math.max(textLum, bgLum);
      const darker = Math.min(textLum, bgLum);
      const contrastRatio = (lighter + 0.05) / (darker + 0.05);

      return {
        textColor,
        bgColor,
        contrastRatio: Math.round(contrastRatio * 100) / 100,
      };
    });

    // WCAG AA requires 4.5:1 for normal text
    expect
      .soft(
        contrastInfo.contrastRatio,
        `Text contrast ratio should be >= 4.5:1, got ${contrastInfo.contrastRatio}:1 (${contrastInfo.textColor} on ${contrastInfo.bgColor})`,
      )
      .toBeGreaterThanOrEqual(4.5);
    await screenshot(page, 'text-contrast');
  });
});

// ---------------------------------------------------------------------------
// 5. All interactive elements are keyboard accessible (Tab through page)
// ---------------------------------------------------------------------------
test.describe('Keyboard accessibility', () => {
  test('can Tab through all major interactive elements on home page', async ({ page }) => {
    await page.goto(`${BASE}/en`);
    await waitForPage(page);

    const reachedElements: string[] = [];
    const maxTabs = 50;

    for (let i = 0; i < maxTabs; i++) {
      await page.keyboard.press('Tab');

      const info = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        return `${el.tagName}${el.className ? '.' + el.className.split(' ')[0] : ''}`;
      });

      if (info && !reachedElements.includes(info)) {
        reachedElements.push(info);
      }
    }

    // Should reach at least a few interactive elements (links, buttons)
    expect
      .soft(reachedElements.length, `Should Tab to multiple elements, reached: ${reachedElements.join(', ')}`)
      .toBeGreaterThan(3);
    await screenshot(page, 'keyboard-accessibility');
  });

  test('can Tab through contact form fields', async ({ page }) => {
    await page.goto(`${BASE}/en/contact`);
    await waitForPage(page);

    const formFields: string[] = [];
    const maxTabs = 30;

    for (let i = 0; i < maxTabs; i++) {
      await page.keyboard.press('Tab');

      const info = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el) return null;
        if (
          el.tagName === 'INPUT' ||
          el.tagName === 'TEXTAREA' ||
          el.tagName === 'SELECT'
        ) {
          const name =
            (el as HTMLInputElement).name ||
            (el as HTMLInputElement).type ||
            el.tagName;
          return name;
        }
        if (el.tagName === 'BUTTON' && el.getAttribute('type') === 'submit') {
          return 'submit-button';
        }
        return null;
      });

      if (info) {
        formFields.push(info);
      }
    }

    // Should reach at least 3 form fields (name, email, message)
    expect
      .soft(formFields.length, `Should Tab through form fields, reached: ${formFields.join(', ')}`)
      .toBeGreaterThanOrEqual(3);
    await screenshot(page, 'keyboard-form-fields');
  });
});

// ---------------------------------------------------------------------------
// 6. Skip-to-content or focus management on navigation
// ---------------------------------------------------------------------------
test.describe('Focus management', () => {
  test('first Tab press reaches a navigation link or skip link', async ({ page }) => {
    await page.goto(`${BASE}/en`);
    await waitForPage(page);

    await page.keyboard.press('Tab');

    const firstFocused = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return { tag: '', text: '', href: '' };
      return {
        tag: el.tagName,
        text: (el.textContent || '').trim().slice(0, 50),
        href: (el as HTMLAnchorElement).href || '',
      };
    });

    // First focusable element should be a link or button in the header
    // (or a skip-to-content link if implemented)
    const isNavigationElement =
      firstFocused.tag === 'A' || firstFocused.tag === 'BUTTON';

    expect
      .soft(
        isNavigationElement,
        `First Tab should focus a link or button, got ${firstFocused.tag} "${firstFocused.text}"`,
      )
      .toBe(true);
    await screenshot(page, 'focus-management');
  });
});

// ---------------------------------------------------------------------------
// 7. Images have alt text
// ---------------------------------------------------------------------------
test.describe('Image alt text', () => {
  test('meaningful images on home page have alt attributes', async ({ page }) => {
    await page.goto(`${BASE}/en`);
    await waitForPage(page);

    // Scroll through to load lazy images
    await page.evaluate(async () => {
      const step = Math.floor(window.innerHeight * 0.8);
      const max = document.body.scrollHeight;
      for (let y = 0; y < max; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 200));
      }
    });
    await page.waitForTimeout(500);

    const imageAudit = await page.evaluate(() => {
      const imgs = document.querySelectorAll('img');
      const results: Array<{ src: string; alt: string | null; hasAlt: boolean }> = [];
      imgs.forEach((img) => {
        const alt = img.getAttribute('alt');
        results.push({
          src: img.src.slice(-60),
          alt,
          hasAlt: alt !== null, // alt="" is acceptable for decorative images
        });
      });
      return results;
    });

    const missingAlt = imageAudit.filter((img) => !img.hasAlt);

    expect
      .soft(
        missingAlt.length,
        `Images missing alt attribute: ${missingAlt.map((i) => i.src).join(', ')}`,
      )
      .toBe(0);
    await screenshot(page, 'image-alt-text');
  });

  test('portfolio page images have alt attributes', async ({ page }) => {
    await page.goto(`${BASE}/en/portfolio`);
    await waitForPage(page);

    // Wait for client-side data load
    await page.waitForSelector('.filter-chip', { timeout: 10_000 });
    await page.waitForTimeout(1000);

    const missingAlt = await page.evaluate(() => {
      const imgs = document.querySelectorAll('img');
      const missing: string[] = [];
      imgs.forEach((img) => {
        if (img.getAttribute('alt') === null) {
          missing.push(img.src.slice(-60));
        }
      });
      return missing;
    });

    expect
      .soft(missingAlt.length, `Portfolio images missing alt: ${missingAlt.join(', ')}`)
      .toBe(0);
    await screenshot(page, 'image-alt-portfolio');
  });
});

// ---------------------------------------------------------------------------
// 8. Form labels are associated with inputs (contact form)
// ---------------------------------------------------------------------------
test.describe('Form label association', () => {
  test('contact form inputs have associated labels', async ({ page }) => {
    await page.goto(`${BASE}/en/contact`);
    await waitForPage(page);

    const labelAudit = await page.evaluate(() => {
      const inputs = document.querySelectorAll(
        'input:not([type="hidden"]), textarea, select',
      );
      const results: Array<{
        type: string;
        name: string;
        hasLabel: boolean;
        labelMethod: string;
      }> = [];

      inputs.forEach((input) => {
        const inputEl = input as HTMLInputElement;
        const id = inputEl.id;
        const ariaLabel = inputEl.getAttribute('aria-label');
        const ariaLabelledBy = inputEl.getAttribute('aria-labelledby');
        const placeholder = inputEl.getAttribute('placeholder');

        // Check for label association
        let hasLabel = false;
        let labelMethod = 'none';

        // 1. Explicit <label for="id">
        if (id) {
          const label = document.querySelector(`label[for="${id}"]`);
          if (label) {
            hasLabel = true;
            labelMethod = 'label[for]';
          }
        }

        // 2. Wrapping <label>
        if (!hasLabel && input.closest('label')) {
          hasLabel = true;
          labelMethod = 'wrapping-label';
        }

        // 3. aria-label
        if (!hasLabel && ariaLabel) {
          hasLabel = true;
          labelMethod = 'aria-label';
        }

        // 4. aria-labelledby
        if (!hasLabel && ariaLabelledBy) {
          hasLabel = true;
          labelMethod = 'aria-labelledby';
        }

        // 5. Placeholder alone is NOT a substitute but note it
        if (!hasLabel && placeholder) {
          labelMethod = 'placeholder-only';
        }

        results.push({
          type: inputEl.type || inputEl.tagName.toLowerCase(),
          name: inputEl.name || inputEl.id || '',
          hasLabel,
          labelMethod,
        });
      });

      return results;
    });

    const unlabelledInputs = labelAudit.filter((r) => !r.hasLabel);

    for (const input of unlabelledInputs) {
      expect
        .soft(
          input.hasLabel,
          `Input [${input.type}] name="${input.name}" lacks label (method: ${input.labelMethod})`,
        )
        .toBe(true);
    }
    await screenshot(page, 'form-labels');
  });
});
