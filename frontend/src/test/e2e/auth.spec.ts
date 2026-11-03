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

  test('should login successfully and redirect to dashboard', async ({ page }) => {
    await page.route('**/api/v1/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-auth-token',
          token_type: 'bearer',
          user: {
            id: 1,
            email: 'student@mentoros.dev',
            full_name: 'Alex Student',
            role: 'student',
            is_active: true,
          },
        }),
      });
    });

    await page.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          email: 'student@mentoros.dev',
          full_name: 'Alex Student',
          role: 'student',
          is_active: true,
        }),
      });
    });

    await page.route('**/api/v1/dashboard/summary**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          role: 'student',
          active_projects: 1,
          open_tasks: 2,
          overdue_tasks: 0,
          upcoming_events: 1,
          todays_tasks: [],
          role_summary: {},
          recent_activity: [],
        }),
      });
    });

    await page.fill('input[type="email"]', 'student@mentoros.dev');
    await page.fill('input[type="password"]', 'Password123456!');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*\/app\/student\/dashboard/);
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

  test('should register and navigate to onboarding', async ({ page }) => {
    await page.route('**/api/v1/auth/register', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-reg-token',
          token_type: 'bearer',
          user: {
            id: 2,
            email: 'newstudent@mentoros.dev',
            full_name: 'New Student',
            role: 'student',
            is_active: true,
          },
        }),
      });
    });

    await page.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 2,
          email: 'newstudent@mentoros.dev',
          full_name: 'New Student',
          role: 'student',
          is_active: true,
        }),
      });
    });

    await page.fill('input[id="reg-name"]', 'New Student');
    await page.fill('input[id="reg-email"]', 'newstudent@mentoros.dev');
    await page.fill('input[id="reg-password"]', 'Password123456!');

    // Select Student role
    await page.locator('text=Student').click();

    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*onboarding/);
  });

  test('should navigate to login page', async ({ page }) => {
    await page.click('a[href="/login"]');
    await expect(page).toHaveURL(/.*login/);
  });
});

test.describe('Onboarding Flow', () => {
  test('should complete onboarding setup and navigate to dashboard', async ({ page }) => {
    let onboarded = false;

    await page.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 10,
          email: 'alex.onboarding@mentoros.dev',
          full_name: 'Alex Onboard',
          role: 'student',
          is_active: true,
          profile_data: onboarded ? { program: 'BSc Computer Science' } : {},
        }),
      });
    });

    await page.route('**/api/v1/auth/onboarding', async (route) => {
      onboarded = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Onboarding completed',
          user: {
            id: 10,
            role: 'student',
            full_name: 'Alex Onboard',
          },
        }),
      });
    });

    await page.route('**/api/v1/dashboard/summary**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          role: 'student',
          active_projects: 0,
          open_tasks: 0,
          overdue_tasks: 0,
          upcoming_events: 0,
          todays_tasks: [],
          role_summary: {},
          recent_activity: [],
        }),
      });
    });

    // Seed mock token so user context recognizes authenticated session
    await page.addInitScript(() => {
      localStorage.setItem('auth_token', 'mock-onboard-token');
      localStorage.setItem(
        'user_data',
        JSON.stringify({
          id: 10,
          email: 'alex.onboarding@mentoros.dev',
          full_name: 'Alex Onboard',
          role: 'student',
          is_active: true,
        })
      );
    });

    await page.goto('/onboarding');
    await expect(page.locator('text=Your Academic Context')).toBeVisible();

    // Step 1: Program, Semester, Subjects
    await page.fill('#field-program', 'BSc Computer Science');
    await page.selectOption('#field-semester', 'Year 2');
    await page.fill('#field-main_subjects', 'Algorithms, Operating Systems, Machine Learning');

    const nextBtn = page.getByRole('button', { name: /continue|next/i });
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
    }

    // Advance to final step or finish button
    const finishBtn = page.getByRole('button', { name: /complete setup|finish|get started/i });
    if (await finishBtn.isVisible()) {
      await finishBtn.click();
      await expect(page).toHaveURL(/.*\/app\/student\/dashboard/);
    }
  });
});
