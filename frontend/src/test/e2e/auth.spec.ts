import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should show login form', async ({ page }) => {
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Please fill in all fields')).toBeVisible();
  });

  test('should toggle password visibility', async ({ page }) => {
    const passwordInput = page.locator('#login-password');
    const toggleButton = page.locator('button[aria-label*="password"]');

    await expect(passwordInput).toHaveAttribute('type', 'password');
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should navigate to register page', async ({ page }) => {
    await page.locator('a[href="/register"]').first().click();
    await expect(page).toHaveURL(/.*register/);
  });
});

test.describe('Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('should show registration form with role selection', async ({ page }) => {
    await expect(page.locator('input[id="reg-name"]')).toBeVisible();
    await expect(page.locator('input[id="reg-email"]')).toBeVisible();
    await expect(page.locator('input[id="reg-password"]')).toBeVisible();
    await expect(page.locator('text=Select Your Workspace Role')).toBeVisible();
    await expect(page.locator('text=Student')).toBeVisible();
    await expect(page.locator('text=Freelancer')).toBeVisible();
    await expect(page.locator('text=Developer')).toBeVisible();
    await expect(page.locator('text=Job Seeker')).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Please enter your full name')).toBeVisible();
  });

  test('should validate password length', async ({ page }) => {
    await page.fill('input[id="reg-name"]', 'Test User');
    await page.fill('input[id="reg-email"]', 'test@example.com');
    await page.fill('input[id="reg-password"]', 'short');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Password must be at least 12 characters')).toBeVisible();
  });

  test('should require role selection', async ({ page }) => {
    await page.fill('input[id="reg-name"]', 'Test User');
    await page.fill('input[id="reg-email"]', 'test@example.com');
    await page.fill('input[id="reg-password"]', 'password123456');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Please select your workspace type')).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    await page.click('a[href="/login"]');
    await expect(page).toHaveURL(/.*login/);
  });
});
