import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';
const SCREENSHOT_DIR = './screenshots';

test.describe('Donna Life OS - Visual Testing', () => {
  test.beforeEach(async ({ page }) => {
    // Wait for the app to be ready
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000); // Give React time to hydrate
  });

  test('01-initial-load: Full app on initial load', async ({ page }) => {
    await page.screenshot({ 
      path: `${SCREENSHOT_DIR}/01-initial-load.png`,
      fullPage: true 
    });
  });

  test('02-notes-panel: Notes panel with search bar', async ({ page }) => {
    // Take screenshot of just the notes panel area
    const notesPanel = page.locator('.bg-donna-bg-secondary').first();
    await notesPanel.screenshot({ 
      path: `${SCREENSHOT_DIR}/02-notes-panel.png` 
    });
  });

  test('03-search-bar-focus: Search bar close-up', async ({ page }) => {
    // Find and focus the search input
    const searchInput = page.locator('input[placeholder="Search notes..."]');
    if (await searchInput.isVisible()) {
      await searchInput.scrollIntoViewIfNeeded();
      
      // Take screenshot before focus
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/03-search-bar-unfocused.png`,
        fullPage: true
      });
      
      // Focus and type something
      await searchInput.click();
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/03-search-bar-focused.png`,
        fullPage: true
      });
      
      await searchInput.fill('test');
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/03-search-bar-with-text.png`,
        fullPage: true
      });
      
      // Clear and screenshot empty state
      await searchInput.fill('');
    } else {
      console.log('Search input not visible');
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/03-search-bar-not-found.png`,
        fullPage: true
      });
    }
  });

  test('04-chat-panel: Chat panel', async ({ page }) => {
    // Get the chat panel area
    const chatPanel = page.locator('text=Donna').first().locator('..');
    await page.screenshot({ 
      path: `${SCREENSHOT_DIR}/04-chat-panel.png`,
      fullPage: true 
    });
  });

  test('05-view-toggle: Toggle between Recent and Folders view', async ({ page }) => {
    // Click the Recent button first
    const recentButton = page.locator('button:has-text("Recent")');
    if (await recentButton.isVisible()) {
      await recentButton.click();
      await page.waitForTimeout(500);
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/05-view-recent.png`,
        fullPage: true 
      });
    }

    // Click the Folders button
    const foldersButton = page.locator('button:has-text("Folders")');
    if (await foldersButton.isVisible()) {
      await foldersButton.click();
      await page.waitForTimeout(500);
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/05-view-folders.png`,
        fullPage: true 
      });
    }
  });

  test('06-note-selection: Click on a note', async ({ page }) => {
    // Look for any note card/item
    const noteItem = page.locator('.note-card').first();
    if (await noteItem.isVisible()) {
      await noteItem.click();
      await page.waitForTimeout(500);
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/06-note-selected.png`,
        fullPage: true 
      });
    } else {
      // Try alternative selectors
      const anyFileText = page.locator('button:has(.lucide-file-text)').first();
      if (await anyFileText.isVisible()) {
        await anyFileText.click();
        await page.waitForTimeout(500);
        await page.screenshot({ 
          path: `${SCREENSHOT_DIR}/06-note-selected.png`,
          fullPage: true 
        });
      } else {
        await page.screenshot({ 
          path: `${SCREENSHOT_DIR}/06-no-notes-found.png`,
          fullPage: true 
        });
      }
    }
  });

  test('07-chat-input: Chat input area', async ({ page }) => {
    // Find the chat input
    const chatInput = page.locator('textarea[placeholder="Talk to Donna..."]');
    if (await chatInput.isVisible()) {
      // Screenshot with empty input
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/07-chat-input-empty.png`,
        fullPage: true 
      });
      
      // Type a message
      await chatInput.fill('Hello Donna, what can you help me with?');
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/07-chat-input-with-message.png`,
        fullPage: true 
      });
    }
  });

  test('08-mobile-view: Mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    
    await page.screenshot({ 
      path: `${SCREENSHOT_DIR}/08-mobile-view.png`,
      fullPage: true 
    });
    
    // Check for mobile tab bar
    const tabBar = page.locator('.mobile-tab-bar');
    if (await tabBar.isVisible()) {
      // Try switching tabs
      const notesTab = page.locator('.mobile-tab').nth(1);
      if (await notesTab.isVisible()) {
        await notesTab.click();
        await page.waitForTimeout(500);
        await page.screenshot({ 
          path: `${SCREENSHOT_DIR}/08-mobile-notes-tab.png`,
          fullPage: true 
        });
      }
    }
  });

  test('09-connection-status: Connection indicator', async ({ page }) => {
    // Screenshot showing the connection status
    const connectionStatus = page.locator('.lucide-wifi, .lucide-wifi-off');
    if (await connectionStatus.isVisible()) {
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/09-connection-status.png`,
        fullPage: true 
      });
    }
  });

  test('10-dev-mode-toggle: Dev mode toggle button', async ({ page }) => {
    // Look for dev mode toggle
    const devToggle = page.locator('[title*="mode"], [aria-label*="mode"]');
    if (await devToggle.first().isVisible()) {
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/10-dev-mode-before.png`,
        fullPage: true 
      });
      
      await devToggle.first().click();
      await page.waitForTimeout(300);
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/10-dev-mode-after.png`,
        fullPage: true 
      });
    } else {
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/10-no-dev-toggle.png`,
        fullPage: true 
      });
    }
  });

  test('11-resize-panels: Split pane resizer', async ({ page }) => {
    // Look for the resize handle
    const resizeHandle = page.locator('.resize-handle');
    if (await resizeHandle.isVisible()) {
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/11-resize-handle.png`,
        fullPage: true 
      });
      
      // Try dragging to resize
      const box = await resizeHandle.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + 200, box.y + box.height / 2);
        await page.mouse.up();
        await page.waitForTimeout(300);
        await page.screenshot({ 
          path: `${SCREENSHOT_DIR}/11-resized-panels.png`,
          fullPage: true 
        });
      }
    }
  });

  test('12-empty-states: Empty states and loading', async ({ page }) => {
    // Look for any empty state indicators
    await page.screenshot({ 
      path: `${SCREENSHOT_DIR}/12-current-state.png`,
      fullPage: true 
    });
    
    // Check for "No notes" or similar text
    const emptyState = page.locator('text=/No notes|No files|Empty/i');
    if (await emptyState.isVisible()) {
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/12-empty-state.png`,
        fullPage: true 
      });
    }
  });

  test('13-folder-tree-navigation: Folder tree expansion', async ({ page }) => {
    // Switch to Folders view
    const foldersButton = page.locator('button:has-text("Folders")');
    if (await foldersButton.isVisible()) {
      await foldersButton.click();
      await page.waitForTimeout(500);
      
      // Try expanding a folder
      const folderButtons = page.locator('button:has(.lucide-folder)');
      const count = await folderButtons.count();
      
      if (count > 0) {
        await folderButtons.first().click();
        await page.waitForTimeout(300);
        await page.screenshot({ 
          path: `${SCREENSHOT_DIR}/13-folder-expanded.png`,
          fullPage: true 
        });
      }
    }
  });
});
