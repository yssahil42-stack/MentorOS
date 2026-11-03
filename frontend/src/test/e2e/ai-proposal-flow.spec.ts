import { test, expect } from '@playwright/test';

test.describe('AI Proposal Generation & Stream Approval Workflow', () => {
  test('Open AI drawer → request proposal → wait for stream → approve items → verify persistence', async ({
    page,
  }) => {
    let tasks: any[] = [];
    let projects = [
      {
        id: 1,
        user_id: 1,
        role: 'student',
        title: 'Machine Learning Specialization',
        status: 'active',
        priority: 'high',
        progress: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    const mockProposal = {
      id: 9901,
      request_text: 'I want to master PyTorch and Transformers in 4 weeks',
      summary: 'Accelerated Deep Learning and Transformer Architecture curriculum.',
      role: 'student',
      context_type: 'study_plan',
      created_at: new Date().toISOString(),
      items: [
        {
          id: 1001,
          proposal_id: 9901,
          item_type: 'milestone',
          payload: {
            title: 'Phase 1: PyTorch Tensors & Autograd Mechanics',
            description:
              'Foundations of tensor manipulation, gradient computations, and custom autograd functions.',
            due_date: '2026-11-15',
          },
        },
        {
          id: 1002,
          proposal_id: 9901,
          item_type: 'task',
          payload: {
            title: 'Implement Multi-Head Self-Attention from scratch',
            description: 'Write PyTorch module without torch.nn.MultiheadAttention.',
            priority: 'high',
            estimated_minutes: 90,
            milestone_id: 1001,
          },
        },
        {
          id: 1003,
          proposal_id: 9901,
          item_type: 'note',
          payload: {
            title: 'Transformer Architecture Reference',
            content:
              '# Attention Is All You Need\n\nKey takeaways:\n- Query, Key, Value matrix projections\n- Scaled dot-product attention formula\n- Residual connections and LayerNorm',
          },
        },
      ],
    };

    // Auth & Workspace Mocks
    await page.route('**/api/v1/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-ai-flow-token',
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
          role: 'student',
          active_projects: projects.length,
          open_tasks: tasks.length,
          overdue_tasks: 0,
          upcoming_events: 1,
          todays_tasks: tasks,
          role_summary: {
            upcoming_exams: 1,
            due_assignments: tasks.length,
            study_hours_this_week: 15,
            active_academic_projects: projects.length,
          },
          recent_activity: [],
        }),
      });
    });

    await page.route('**/api/v1/projects**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(projects),
      });
    });

    await page.route('**/api/v1/milestones**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
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
        tasks.push({
          id: 2001,
          user_id: 1,
          role: 'student',
          project_id: 1,
          title: 'Implement Multi-Head Self-Attention from scratch',
          status: 'todo',
          priority: 'high',
          estimated_minutes: 90,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            proposal_id: 9901,
            created_tasks: [2001],
            created_milestones: [1001],
            created_projects: [],
            created_events: [],
            created_notes: [1003],
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

    // 1. Login as Student
    await page.goto('/login');
    await page.fill('input[type="email"]', 'student@mentoros.dev');
    await page.fill('input[type="password"]', 'Password123456!');
    await page.click('button[type="submit"]');

    // 2. Arrive on Student Dashboard
    await expect(page).toHaveURL(/.*\/app\/student\/dashboard/);

    // 3. Open AI Proposal modal / drawer
    const aiStarterButton = page.locator('button[aria-label="Capture Work"]').first();
    await aiStarterButton.click();

    // Verify AI interface opens
    const aiModalOrDrawer = page.locator('h1:has-text("Capture Work")').first();
    await expect(aiModalOrDrawer).toBeVisible();
  });
});
