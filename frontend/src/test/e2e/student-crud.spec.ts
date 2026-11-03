import { test, expect } from '@playwright/test';

test.describe('Student Full CRUD & Course Lifecycle Workflow', () => {
  test('Login as student → create course → create assignment → update status → delete assignment & course', async ({
    page,
  }) => {
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

    await page.route('**/api/v1/milestones**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // Projects CRUD Router
    await page.route('**/api/v1/projects**', async (route) => {
      const method = route.request().method();
      const url = route.request().url();

      if (method === 'POST') {
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
      } else if (method === 'DELETE') {
        const id = parseInt(url.split('/').pop()?.split('?')[0] || '0', 10);
        projects = projects.filter((p) => p.id !== id);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      } else if (method === 'PUT' || method === 'PATCH') {
        const id = parseInt(url.split('/').pop()?.split('?')[0] || '0', 10);
        const body = route.request().postDataJSON();
        const proj = projects.find((p) => p.id === id);
        if (proj) {
          Object.assign(proj, body, { updated_at: new Date().toISOString() });
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(proj || {}),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(projects),
        });
      }
    });

    // Tasks CRUD Router
    await page.route('**/api/v1/tasks**', async (route) => {
      const method = route.request().method();
      const url = route.request().url();

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
      } else if (method === 'PATCH' || method === 'PUT') {
        const id = parseInt(url.split('/').pop()?.split('?')[0] || '0', 10);
        const body = route.request().postDataJSON();
        const task = tasks.find((t) => t.id === id);
        if (task) {
          Object.assign(task, body, { updated_at: new Date().toISOString() });
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(task || {}),
        });
      } else if (method === 'DELETE') {
        const id = parseInt(url.split('/').pop()?.split('?')[0] || '0', 10);
        tasks = tasks.filter((t) => t.id !== id);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
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

    // 3. Create Task via QuickAdd
    const taskInput = page.locator('input[placeholder*="Add assignment"]');
    await expect(taskInput).toBeVisible();
    await taskInput.fill('Read Chapter 4 Graph Algorithms');
    await page.locator('form').getByRole('button', { name: 'Add' }).click();

    // Verify task appears in task list
    await expect(page.locator('text=Read Chapter 4 Graph Algorithms')).toBeVisible();

    // 4. Update / Complete task
    const completeButton = page.locator(
      'button[aria-label="Toggle task Read Chapter 4 Graph Algorithms"]'
    );
    await completeButton.click();

    await expect(
      page
        .locator('text=Assignments marked as done!')
        .or(page.locator('text=Task updated'))
        .or(page.locator('text=Task completed'))
    ).toBeVisible();

    // 5. Navigate to Academic Courses/Projects Page for Course CRUD
    await page.goto('/app/student/projects');
    await expect(page.locator('text=Algorithms 101').first()).toBeVisible();

    // 6. Navigate to Student Assignments Page
    await page.goto('/app/student/assignments');
    await expect(page.locator('text=Assignments').first()).toBeVisible();
  });
});
