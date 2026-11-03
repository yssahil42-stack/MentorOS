import { test, expect } from '@playwright/test';

test.describe('Developer GitHub/GitLab Sync Workflow', () => {
  test('Login as developer → connect repository → sync → map issue to task', async ({ page }) => {
    let repositories: any[] = [];
    const issues = [
      {
        id: 801,
        repository_id: 1,
        external_id: 42,
        title: 'Fix WebSocket reconnect exponential backoff',
        body: 'Client drops connection after network flap and does not retry cleanly.',
        state: 'open',
        author: { login: 'octocat' },
        assignees: [{ login: 'dev_user' }],
        labels: [{ id: 1, name: 'bug', color: 'd73a4a' }],
        milestone: { id: 1, title: 'v1.0 Milestone' },
        url: 'https://github.com/mentoros/engine/issues/42',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    let taskMapped = false;

    // 1. Auth & Workspace Mocks
    await page.route('**/api/v1/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-dev-token',
          token_type: 'bearer',
          user: {
            id: 3,
            email: 'dev@mentoros.dev',
            full_name: 'Dev Engineer',
            role: 'developer',
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
          id: 3,
          email: 'dev@mentoros.dev',
          full_name: 'Dev Engineer',
          role: 'developer',
          is_active: true,
        }),
      });
    });

    await page.route('**/api/v1/dashboard/summary**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          role: 'developer',
          active_projects: 1,
          open_tasks: 1,
          overdue_tasks: 0,
          upcoming_events: 0,
          todays_tasks: [],
          role_summary: {},
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

    await page.route('**/api/v1/projects**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 10,
            title: 'Core Engine Platform',
            role: 'developer',
            status: 'active',
          },
        ]),
      });
    });

    // Git Repositories API
    await page.route('**/api/v1/git/repositories**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(repositories),
      });
    });

    // Connect Repository endpoint
    await page.route('**/api/v1/git/connect', async (route) => {
      const newRepo = {
        id: 1,
        provider: 'github',
        name: 'engine',
        full_name: 'mentoros/engine',
        html_url: 'https://github.com/mentoros/engine',
        default_branch: 'main',
        sync_status: 'synced',
        last_synced_at: new Date().toISOString(),
        is_private: false,
        open_issues_count: 1,
        open_prs_count: 0,
      };
      repositories.push(newRepo);

      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(newRepo),
      });
    });

    // Trigger Sync endpoint
    await page.route('**/api/v1/git/sync**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Repository sync started',
          synced_at: new Date().toISOString(),
        }),
      });
    });

    // Git Issues endpoint
    await page.route('**/api/v1/git/issues**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(issues),
      });
    });

    await page.route('**/api/v1/git/pull-requests**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.route('**/api/v1/git/logs**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // Issue to Task mapping endpoint
    await page.route('**/api/v1/git/issues/create-task', async (route) => {
      taskMapped = true;
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          task_id: 550,
          issue_id: 801,
          title: 'Fix WebSocket reconnect exponential backoff',
          status: 'todo',
        }),
      });
    });

    await page.route('**/api/v1/git/issues/map-task', async (route) => {
      taskMapped = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          task_id: 550,
          issue_id: 801,
          success: true,
        }),
      });
    });

    // 2. Login as Developer
    await page.goto('/login');
    await page.fill('input[type="email"]', 'dev@mentoros.dev');
    await page.fill('input[type="password"]', 'Password123456!');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*\/app\/developer\/dashboard/);

    // 3. Navigate to GitHub Sync Page
    await page.goto('/app/developer/github-sync');
    await expect(page.locator('text=GitHub / GitLab Sync')).toBeVisible();

    // 4. Connect Repository Flow
    const connectRepoBtn = page.getByRole('button', { name: /Connect Repository/i }).first();
    await expect(connectRepoBtn).toBeVisible();
    await connectRepoBtn.click();

    // Fill Connect Modal
    const repoInput = page.locator('input[placeholder*="owner/repo"]').first();
    if (await repoInput.isVisible()) {
      await repoInput.fill('mentoros/engine');
    }
    const tokenInput = page.locator('input[type="password"]').first();
    if (await tokenInput.isVisible()) {
      await tokenInput.fill('ghp_mockPersonalAccessToken1234567890');
    }

    // Submit connect form inside modal
    const submitConnectBtn = page
      .getByRole('button', { name: /Connect Repository|Save|Submit/i })
      .last();
    await submitConnectBtn.click();

    // 5. Trigger Sync Now
    const syncNowBtn = page.getByRole('button', { name: /Sync Now/i }).first();
    if (await syncNowBtn.isVisible()) {
      await syncNowBtn.click();
      await expect(
        page
          .locator('text=Repository sync started')
          .or(page.locator('text=Synced'))
          .or(page.locator('text=Sync completed'))
      ).toBeVisible();
    }

    // 6. Switch to Issues Tab and Map Issue
    const issuesTabBtn = page.getByRole('button', { name: /Issues/i }).first();
    await expect(issuesTabBtn).toBeVisible();
    await issuesTabBtn.click();

    // Verify issue card rendered
    await expect(page.locator('text=Fix WebSocket reconnect exponential backoff')).toBeVisible();

    // Click Create Task or Map to Task
    const mapOrTaskBtn = page.getByRole('button', { name: /Create Task|Map to Task/i }).first();
    await expect(mapOrTaskBtn).toBeVisible();
    await mapOrTaskBtn.click();

    // Verify confirmation toast or mapped badge
    await expect(
      page
        .locator('text=Task created')
        .or(page.locator('text=Mapped to Task'))
        .or(page.locator('text=Task mapped'))
    ).toBeVisible();
  });
});
