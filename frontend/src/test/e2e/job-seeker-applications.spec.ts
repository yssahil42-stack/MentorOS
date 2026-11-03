import { test, expect } from '@playwright/test';

test.describe('Job Seeker Applications & Interview Prep Workflow', () => {
  test('Login as job seeker → log application → add interview prep → track status', async ({
    page,
  }) => {
    let applications = [
      {
        id: 601,
        user_id: 4,
        role: 'job_seeker',
        title: 'Senior Frontend Engineer @ Stripe',
        description: 'React, TypeScript, design systems team',
        status: 'active',
        priority: 'high',
        progress: 25,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    let tasks = [
      {
        id: 701,
        user_id: 4,
        role: 'job_seeker',
        project_id: 601,
        title: 'Review System Design - Stripe Terminal API',
        status: 'todo',
        priority: 'high',
        estimated_minutes: 45,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    // Auth & Workspace Mocks
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

    await page.route('**/api/v1/calendar/events**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.route('**/api/v1/dashboard/summary**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          role: 'job_seeker',
          active_projects: applications.length,
          open_tasks: tasks.filter((t) => t.status !== 'completed').length,
          overdue_tasks: 0,
          upcoming_events: 1,
          todays_tasks: tasks,
          role_summary: {
            applications_pending: applications.length,
            interviews_upcoming: 1,
            portfolio_tasks_remaining: tasks.length,
            target_role: 'Senior Frontend Engineer',
            application_stage: 'In Interviews',
          },
          recent_activity: [],
        }),
      });
    });

    await page.route('**/api/v1/projects**', async (route) => {
      if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON();
        const newApp = {
          id: applications.length + 601,
          user_id: 4,
          role: 'job_seeker',
          title: body.title,
          description: body.description || '',
          status: 'active',
          priority: body.priority || 'high',
          progress: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        applications.push(newApp);
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(newApp),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(applications),
        });
      }
    });

    await page.route('**/api/v1/tasks**', async (route) => {
      const method = route.request().method();
      if (method === 'POST') {
        const body = route.request().postDataJSON();
        const newTask = {
          id: tasks.length + 701,
          user_id: 4,
          role: 'job_seeker',
          project_id: body.project_id || 601,
          title: body.title,
          status: 'todo',
          priority: body.priority || 'high',
          estimated_minutes: body.estimated_minutes || 30,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        tasks.push(newTask);
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(newTask),
        });
      } else if (method === 'PATCH') {
        const url = route.request().url();
        const id = parseInt(url.split('/').pop()?.split('?')[0] || '0', 10);
        const task = tasks.find((t) => t.id === id);
        if (task) task.status = 'completed';
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(task || {}),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(tasks),
        });
      }
    });

    // 1. Login as Job Seeker
    await page.goto('/login');
    await page.fill('input[type="email"]', 'jobseeker@mentoros.dev');
    await page.fill('input[type="password"]', 'Password123456!');
    await page.click('button[type="submit"]');

    // 2. Redirected to Job Seeker Dashboard
    await expect(page).toHaveURL(/.*\/app\/job-seeker\/dashboard/);
    await expect(page.locator('text=Welcome back, Taylor')).toBeVisible();

    // 3. Verify Applications & Search Tasks sections
    await expect(page.locator('text=Action Items & Interview Prep').first()).toBeVisible();

    // 4. Add Interview Prep Task via quick add
    const taskInput = page.locator('input[placeholder*="Add interview prep"]').first();
    if (await taskInput.isVisible()) {
      await taskInput.fill('Prepare Behavioral Answers - STAR Method');
      await page.locator('button:has-text("Add")').click();
      await expect(
        page
          .locator('text=Prepare Behavioral Answers - STAR Method')
          .or(page.locator('text=Career task added!'))
          .or(page.locator('text=Task added!'))
          .first()
      ).toBeVisible();
    }

    // 5. Track Task Completion
    const checkBtn = page.locator('button:has(svg)').first();
    if (await checkBtn.isVisible()) {
      await checkBtn.click();
    }
  });
});
