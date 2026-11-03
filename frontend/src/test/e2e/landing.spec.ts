import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load landing page successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/MentorOS/);
    await expect(page.locator('h1').first()).toContainText(/MentorOS/);
  });

  test('should have navigation links', async ({ page }) => {
    await expect(page.locator('a[href="/login"]').first()).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    await page.locator('a[href="/login"]').first().click();
    await expect(page).toHaveURL(/.*login/);
    await expect(page.locator('text=Sign in to your intelligent workspace')).toBeVisible();
  });
});
