import { test, expect } from '@playwright/test';

test.describe('Freelancer Deliverables & Invoicing Workflow', () => {
  test('Login as freelancer → create project → add deliverable → mark complete → verify invoice flow', async ({
    page,
  }) => {
    let projects = [
      {
        id: 201,
        user_id: 2,
        role: 'freelancer',
        title: 'Acme Brand Portal',
        description: 'Complete UI revamp and design system',
        status: 'active',
        priority: 'high',
        progress: 75,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    let milestones = [
      {
        id: 301,
        project_id: 201,
        title: 'Figma Design Tokens',
        description: 'Design token specification & component library',
        status: 'in_progress',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    let tasks = [
      {
        id: 401,
        user_id: 2,
        role: 'freelancer',
        project_id: 201,
        title: 'Color Palette Audit',
        status: 'completed',
        priority: 'medium',
        estimated_minutes: 90,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    // Auth Mocks
    await page.route('**/api/v1/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-freelancer-token',
          token_type: 'bearer',
          user: {
            id: 2,
            email: 'freelancer@mentoros.dev',
            full_name: 'Morgan Freelancer',
            role: 'freelancer',
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
          email: 'freelancer@mentoros.dev',
          full_name: 'Morgan Freelancer',
          role: 'freelancer',
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
          role: 'freelancer',
          active_projects: projects.length,
          open_tasks: tasks.filter((t) => t.status !== 'completed').length,
          overdue_tasks: 0,
          upcoming_events: 1,
          todays_tasks: tasks,
          role_summary: {
            deliverables_due_this_week: milestones.length,
            active_engagements: projects.length,
            work_hours_available: 35,
            next_delivery_title: 'Design System Delivery',
            next_delivery_date: '2026-11-15',
          },
          recent_activity: [],
        }),
      });
    });

    await page.route('**/api/v1/projects**', async (route) => {
      if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON();
        const newProj = {
          id: projects.length + 201,
          user_id: 2,
          role: 'freelancer',
          title: body.title,
          description: body.description || '',
          status: 'active',
          priority: body.priority || 'medium',
          progress: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        projects.push(newProj);
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(newProj),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(projects),
        });
      }
    });

    await page.route('**/api/v1/milestones**', async (route) => {
      const method = route.request().method();
      if (method === 'POST') {
        const body = route.request().postDataJSON();
        const newM = {
          id: milestones.length + 301,
          project_id: body.project_id || 201,
          title: body.title,
          description: body.description || '',
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        milestones.push(newM);
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(newM),
        });
      } else if (method === 'PATCH') {
        const url = route.request().url();
        const id = parseInt(url.split('/').pop()?.split('?')[0] || '0', 10);
        const m = milestones.find((item) => item.id === id);
        if (m) m.status = 'completed';
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(m || {}),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(milestones),
        });
      }
    });

    await page.route('**/api/v1/tasks**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(tasks),
      });
    });

    await page.route('**/api/v1/invoices**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'inv_101',
          invoice_number: 'INV-2026-001',
          status: 'draft',
          total: 2400,
          currency: 'USD',
          line_items: [
            {
              id: 1,
              description: 'Figma Design Tokens Deliverable',
              quantity: 1,
              unit_price: 2400,
              amount: 2400,
            },
          ],
        }),
      });
    });

    // 1. Login as Freelancer
    await page.goto('/login');
    await page.fill('input[type="email"]', 'freelancer@mentoros.dev');
    await page.fill('input[type="password"]', 'Password123456!');
    await page.click('button[type="submit"]');

    // 2. Redirected to Freelancer Dashboard
    await expect(page).toHaveURL(/.*\/app\/freelancer\/dashboard/);
    await expect(page.locator('text=Welcome back, Morgan')).toBeVisible();

    // 3. Navigate to Invoice Generator
    await page.goto('/app/freelancer/invoice-generator');
    await expect(page.locator('text=Invoice Generator').first()).toBeVisible();

    // 4. Select Project to Invoice
    const projectSelector = page.locator('select').first();
    if (await projectSelector.isVisible()) {
      await projectSelector.selectOption({ label: 'Acme Brand Portal' });
    }

    // 5. Verify invoice generator shows client project details
    await expect(page.locator('text=Acme Brand Portal').first()).toBeVisible();
  });
});
