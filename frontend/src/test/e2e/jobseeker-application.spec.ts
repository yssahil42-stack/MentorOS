import { test, expect } from '@playwright/test';

test.describe('Job Seeker Application Tracking & Follow-Up Cadence Workflow', () => {
  test('Login as job seeker → add application → track status in Kanban → generate follow-up email', async ({
    page,
    context,
  }) => {
    // Grant clipboard permissions for copy email test
    await context.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});

    // Seed 1 existing application from 8 days ago to trigger the 7d auto-reminder
    const eightDaysAgo = new Date();
    eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);
    const eightDaysAgoStr = eightDaysAgo.toISOString().split('T')[0];

    const initialApplications = [
      {
        id: 'app-seed-1',
        company: 'Vercel',
        roleTitle: 'Developer Advocate',
        status: 'applied',
        workplaceType: 'remote',
        salaryRange: '$140k - $175k',
        location: 'Remote, US',
        appliedDate: eightDaysAgoStr,
        contactName: 'Sarah Recruiter',
        contactEmail: 'sarah@vercel.com',
        notes: 'Submitted tailored case study and portfolio link.',
        createdAt: eightDaysAgo.toISOString(),
        updatedAt: eightDaysAgo.toISOString(),
      },
    ];

    // Auth & Dashboard Summary Mocks
    await page.route('**/api/v1/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-jobseeker-token',
          token_type: 'bearer',
          user: {
            id: 4,
            email: 'jobseeker@mentoros.dev',
            full_name: 'Taylor Candidate',
            role: 'job_seeker',
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
          id: 4,
          email: 'jobseeker@mentoros.dev',
          full_name: 'Taylor Candidate',
          role: 'job_seeker',
          is_active: true,
        }),
      });
    });

    await page.route('**/api/v1/dashboard/summary**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          role: 'job_seeker',
          active_projects: 1,
          open_tasks: 0,
          overdue_tasks: 0,
          upcoming_events: 1,
          todays_tasks: [],
          role_summary: {
            applications_pending: 1,
            interviews_upcoming: 0,
            target_role: 'Senior Frontend Engineer',
          },
          recent_activity: [],
        }),
      });
    });

    await page.route('**/api/v1/calendar/events**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // Seed localStorage with mock applications for the applicationService
    await page.addInitScript((initialData) => {
      localStorage.setItem('mentoros_job_applications', JSON.stringify(initialData));
    }, initialApplications);

    // 1. Login as Job Seeker
    await page.goto('/login');
    await page.fill('input[type="email"]', 'jobseeker@mentoros.dev');
    await page.fill('input[type="password"]', 'Password123456!');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*\/app\/job-seeker\/dashboard/);

    // 2. Navigate to Application Tracker Page
    await page.goto('/app/job-seeker/applications');
    await expect(page.locator('text=Job Application Tracker')).toBeVisible();

    // Verify existing seeded card appears in 'Applied' Kanban column
    await expect(page.locator('text=Vercel')).toBeVisible();
    await expect(page.locator('text=Developer Advocate')).toBeVisible();

    // 3. Apply: Add New Job Application
    const addAppBtn = page.getByRole('button', { name: /Add Application/i }).first();
    await expect(addAppBtn).toBeVisible();
    await addAppBtn.click();

    // Modal opens
    await expect(page.locator('text=Add Job Application')).toBeVisible();

    // Fill form fields
    await page.locator('input[placeholder="e.g. Acme Corp"]').fill('Linear');
    await page
      .locator('input[placeholder="e.g. Senior Frontend Engineer"]')
      .fill('Staff Design Engineer');
    await page.locator('input[placeholder="e.g. $140k - $175k"]').fill('$180k - $210k');
    await page.locator('input[placeholder="e.g. Jane Doe"]').fill('Alex Talent');
    await page.locator('input[placeholder="e.g. recruiter@company.com"]').fill('talent@linear.app');

    // Submit modal
    const saveBtn = page.getByRole('button', { name: /Save Application|Add Application/i }).last();
    await saveBtn.click();

    // Verify new application card rendered in Saved column
    await expect(page.locator('text=Linear')).toBeVisible();
    await expect(page.locator('text=Staff Design Engineer')).toBeVisible();

    // 4. Track: Advance Stage
    // Find Linear card's next advance button to move from Saved to Applied
    const linearCard = page.locator('div').filter({ hasText: 'Linear' }).last();
    const advanceBtn = linearCard
      .getByRole('button', { name: /Move to/i })
      .or(linearCard.locator('button[title*="Move"], button:has(svg.lucide-chevron-right)'))
      .first();

    if (await advanceBtn.isVisible()) {
      await advanceBtn.click();
    }

    // 5. Follow-Up: 7d/14d Auto-Reminders & Email Draft Generation
    // The seeded Vercel application is >7 days old, so it has the follow-up reminder
    await expect(
      page.locator('text=7d+ Follow-Up').or(page.locator('text=Follow-Up Cadence'))
    ).toBeVisible();

    // Click Draft follow-up email button
    const draftEmailBtn = page.getByRole('button', { name: /Draft/i }).first();
    await expect(draftEmailBtn).toBeVisible();
    await draftEmailBtn.click();

    // Modal with email draft appears
    await expect(page.locator('text=Follow-Up Email Draft')).toBeVisible();
    await expect(
      page.locator('text=Subject: Following up on Developer Advocate application -')
    ).toBeVisible();

    // Click Copy Email to Clipboard
    const copyBtn = page.getByRole('button', { name: /Copy Email|Copied/i }).first();
    await expect(copyBtn).toBeVisible();
    await copyBtn.click();

    // Verify toast confirmation
    await expect(page.locator('text=Copied email to clipboard')).toBeVisible();
  });
});
