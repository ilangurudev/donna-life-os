import { test } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';
const SCREENSHOT_DIR = './screenshots';

test('verify-search-bar-fix', async ({ page }) => {
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000); // Wait for hot reload
  
  // Take screenshot of the search bar area
  await page.screenshot({ 
    path: `${SCREENSHOT_DIR}/FIXED-search-bar.png`,
    fullPage: true 
  });
  
  // Also take mobile view
  await page.setViewportSize({ width: 375, height: 667 });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  
  // Go to notes tab
  const notesTab = page.locator('.mobile-tab').nth(1);
  if (await notesTab.isVisible()) {
    await notesTab.click();
    await page.waitForTimeout(500);
    await page.screenshot({ 
      path: `${SCREENSHOT_DIR}/FIXED-mobile-search-bar.png`,
      fullPage: true 
    });
  }
});
