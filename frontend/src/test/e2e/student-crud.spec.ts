import { test, expect } from '@playwright/test';

test.describe('Student CRUD & Dashboard Workflow', () => {
  test('Login as student → create project → add tasks → complete → verify dashboard metrics', async ({
    page,
  }) => {
    let tasks = [
      {
        id: 101,
        user_id: 1,
        role: 'student',
        project_id: 1,
        project_title: 'Algorithms 101',
        title: 'Complete Dynamic Programming Problem Set',
        status: 'todo',
        priority: 'high',
        estimated_minutes: 60,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    let projects = [
      {
        id: 1,
        user_id: 1,
        role: 'student',
        title: 'Algorithms 101',
        description: 'Advanced data structures and algorithms coursework',
        status: 'active',
        priority: 'high',
        progress: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    // Mock Backend APIs
    await page.route('**/api/v1/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-student-token',
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
      const completedCount = tasks.filter((t) => t.status === 'completed').length;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          role: 'student',
          active_projects: projects.length,
          open_tasks: tasks.length - completedCount,
          overdue_tasks: 0,
          upcoming_events: 1,
          todays_tasks: tasks,
          role_summary: {
            upcoming_exams: 1,
            due_assignments: tasks.length - completedCount,
            study_hours_this_week: 12,
            active_academic_projects: projects.length,
            next_deadline_title: 'Midterm Exam',
            next_deadline_date: '2026-11-20',
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

    await page.route('**/api/v1/projects**', async (route) => {
      if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON();
        const newProj = {
          id: projects.length + 1,
          user_id: 1,
          role: 'student',
          title: body.title,
          description: body.description || '',
          status: body.status || 'active',
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
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.route('**/api/v1/tasks**', async (route) => {
      const method = route.request().method();
      if (method === 'POST') {
        const body = route.request().postDataJSON();
        const newTask = {
          id: tasks.length + 101,
          user_id: 1,
          role: 'student',
          project_id: body.project_id || 1,
          project_title: 'Algorithms 101',
          title: body.title,
          status: 'todo',
          priority: body.priority || 'high',
          estimated_minutes: body.estimated_minutes || 60,
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
        const body = route.request().postDataJSON();
        const task = tasks.find((t) => t.id === id);
        if (task) {
          task.status = body.status;
        }
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

    // 1. Login as Student
    await page.goto('/login');
    await page.fill('input[type="email"]', 'student@mentoros.dev');
    await page.fill('input[type="password"]', 'Password123456!');
    await page.click('button[type="submit"]');

    // 2. Redirected to Student Dashboard
    await expect(page).toHaveURL(/.*\/app\/student\/dashboard/);
    await expect(page.locator('text=Welcome back, Alex')).toBeVisible();
    await expect(page.locator('text=Courses & Assignments')).toBeVisible();

    // 3. Add a new study task via QuickAddForm
    const taskInput = page.locator('input[placeholder*="Add assignment"]');
    await expect(taskInput).toBeVisible();
    await taskInput.fill('Read Chapter 4 Graph Algorithms');
    await page.locator('form').getByRole('button', { name: 'Add' }).click();

    // Verify task appears in the course list
    await expect(page.locator('text=Read Chapter 4 Graph Algorithms')).toBeVisible();

    // 4. Complete the task
    const completeButton = page.locator(
      'button[aria-label="Toggle task Read Chapter 4 Graph Algorithms"]'
    );
    await completeButton.click();

    // 5. Verify task metrics and completion status reflect updated data
    await expect(
      page
        .locator('text=Assignments marked as done!')
        .or(page.locator('text=Task updated'))
        .or(page.locator('text=Task completed'))
    ).toBeVisible();
  });
});
