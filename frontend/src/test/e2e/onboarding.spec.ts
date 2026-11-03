import { test, expect } from '@playwright/test';

test.describe('Onboarding Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/onboarding');
  });

  test('should redirect to login if not authenticated', async ({ page }) => {
    await expect(page).toHaveURL(/.*login/);
  });
});

test.describe('Protected Routes', () => {
  test('should redirect to login for unauthenticated user', async ({ page }) => {
    await page.goto('/app/student/dashboard');
    await expect(page).toHaveURL(/.*login/);
  });

  test('should show unauthorized page for wrong role', async ({ page }) => {
    // This would require mocking auth state - skipping for now
    test.skip();
  });
});
