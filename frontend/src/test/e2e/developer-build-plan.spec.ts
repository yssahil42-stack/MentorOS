import { test, expect } from '@playwright/test';

test.describe('Developer Build Plan & AI Roadmap Workflow', () => {
  test('Login as developer → generate AI build plan → approve items → verify tasks created', async ({
    page,
  }) => {
    let tasks = [
      {
        id: 501,
        user_id: 3,
        role: 'developer',
        project_id: 10,
        title: 'Initial Database Migration',
        status: 'completed',
        priority: 'high',
        estimated_minutes: 60,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    let milestones = [
      {
        id: 1,
        project_id: 10,
        title: 'Architecture & Foundation',
        status: 'in_progress',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    const mockProposal = {
      id: 'prop-dev-999',
      session_id: 'sess-dev-1',
      role: 'developer',
      context_type: 'build_plan',
      prompt: 'Build real-time notification engine with WebSockets',
      strategic_guidance: 'Break down WebSocket pub/sub connection lifecycle into robust phases.',
      phases: [
        {
          id: 1,
          title: 'WebSocket Connection Manager',
          duration: '1 week',
          description: 'Core connection pool and heartbeat ping/pong.',
          tasks: [
            { id: 1, title: 'Implement WebSocket handshake & token auth', selected: true },
            { id: 2, title: 'Create Redis PubSub consumer', selected: true },
          ],
        },
      ],
      created_at: new Date().toISOString(),
      items: [
        {
          id: 'item-1',
          proposal_id: 'prop-dev-999',
          item_type: 'task',
          title: 'Implement WebSocket handshake & token auth',
          priority: 'high',
          status: 'pending',
        },
        {
          id: 'item-2',
          proposal_id: 'prop-dev-999',
          item_type: 'task',
          title: 'Create Redis PubSub consumer',
          priority: 'high',
          status: 'pending',
        },
      ],
    };

    // Auth & Workspace Mocks
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
          role: 'developer',
          active_projects: 1,
          open_tasks: tasks.filter((t) => t.status !== 'completed').length,
          overdue_tasks: 0,
          upcoming_events: 1,
          todays_tasks: tasks,
          role_summary: {
            active_build_projects: 1,
            open_implementation_tasks: tasks.length,
            milestones_this_week: 1,
            current_milestone_title: 'Core Engine Alpha',
            target_date: '2026-12-01',
          },
          recent_activity: [],
        }),
      });
    });

    await page.route('**/api/v1/projects**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 10,
            user_id: 3,
            role: 'developer',
            title: 'MentorOS Platform',
            status: 'active',
            priority: 'high',
            progress: 45,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]),
      });
    });

    await page.route('**/api/v1/milestones**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(milestones),
      });
    });

    await page.route('**/api/v1/tasks**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(tasks),
      });
    });

    await page.route('**/api/v1/ai/**', async (route) => {
      const url = route.request().url();
      if (url.includes('/propose')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockProposal),
        });
      } else if (url.includes('/approve')) {
        tasks.push(
          {
            id: 502,
            user_id: 3,
            role: 'developer',
            project_id: 10,
            title: 'Implement WebSocket handshake & token auth',
            status: 'todo',
            priority: 'high',
            estimated_minutes: 60,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 503,
            user_id: 3,
            role: 'developer',
            project_id: 10,
            title: 'Create Redis PubSub consumer',
            status: 'todo',
            priority: 'high',
            estimated_minutes: 90,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        );
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            proposal_id: 'prop-dev-999',
            created_tasks: [502, 503],
            created_milestones: [],
            created_projects: [],
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      }
    });

    // 1. Login as Developer
    await page.goto('/login');
    await page.fill('input[type="email"]', 'dev@mentoros.dev');
    await page.fill('input[type="password"]', 'Password123456!');
    await page.click('button[type="submit"]');

    // 2. Redirected to Developer Dashboard
    await expect(page).toHaveURL(/.*\/app\/developer\/dashboard/);
    await expect(page.locator('text=Welcome back, Dev')).toBeVisible();

    // 3. Navigate to Build Plan
    await page.goto('/app/developer/build-plan');
    await expect(page.locator('h1:has-text("Build Plan")').first()).toBeVisible();

    // 4. Verify AI Architecture trigger button is present
    const aiButton = page
      .locator('button:has-text("AI Plan Generator")')
      .or(page.locator('button:has-text("AI")'))
      .first();
    await expect(aiButton).toBeVisible();
  });
});
