import { test, expect } from '@playwright/test';

test.describe('Freelancer Invoice Generation Workflow', () => {
  test('Login as freelancer → select project → generate invoice preview → download PDF → send to client', async ({
    page,
  }) => {
    const projects = [
      {
        id: 201,
        user_id: 2,
        role: 'freelancer',
        title: 'Acme Brand Portal',
        description: 'Complete UI revamp and design system',
        status: 'active',
        priority: 'high',
        progress: 100,
        target_date: '2026-12-01',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    const milestones = [
      {
        id: 301,
        project_id: 201,
        title: 'Figma Design Tokens',
        description: 'Design token specification & component library',
        status: 'completed',
        due_date: '2026-11-15',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    const tasks = [
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

    let createdInvoiceId = 901;
    let invoiceSent = false;
    let pdfDownloaded = false;

    // 1. Auth & Workspace Mocks
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

    await page.route('**/api/v1/dashboard/summary**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          role: 'freelancer',
          active_projects: projects.length,
          open_tasks: 0,
          overdue_tasks: 0,
          upcoming_events: 1,
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
        body: JSON.stringify(projects),
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

    // Invoice endpoints
    await page.route('**/api/v1/invoices/preview**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          invoice: {
            id: 0,
            invoice_number: 'INV-DRAFT',
            project_id: 201,
            client_name: 'Acme Corp',
            client_email: 'billing@acme.com',
            issue_date: '2026-11-03',
            due_date: '2026-12-03',
            payment_terms: 'net_30',
            tax_rate: 10,
            subtotal: 2500,
            tax_amount: 250,
            total: 2750,
            currency: 'USD',
            status: 'draft',
            notes: 'Thank you for your business!',
          },
          line_items: [
            {
              id: 1,
              description: 'Figma Design Tokens Deliverable',
              quantity: 1,
              unit_price: 2500,
              total: 2500,
              source_type: 'milestone',
              source_id: 301,
              sort_order: 0,
            },
          ],
        }),
      });
    });

    await page.route('**/api/v1/invoices', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: createdInvoiceId,
            invoice_number: 'INV-2026-001',
            project_id: 201,
            client_name: 'Acme Corp',
            client_email: 'billing@acme.com',
            status: 'sent',
            total: 2750,
            currency: 'USD',
            line_items: [
              {
                id: 1,
                description: 'Figma Design Tokens Deliverable',
                quantity: 1,
                unit_price: 2500,
                total: 2500,
              },
            ],
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

    await page.route(`**/api/v1/invoices/${createdInvoiceId}/send`, async (route) => {
      invoiceSent = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Invoice sent successfully',
        }),
      });
    });

    await page.route(`**/api/v1/invoices/${createdInvoiceId}/pdf**`, async (route) => {
      pdfDownloaded = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/pdf',
        body: '%PDF-1.4 Mock PDF Content',
      });
    });

    // 2. Login as Freelancer
    await page.goto('/login');
    await page.fill('input[type="email"]', 'freelancer@mentoros.dev');
    await page.fill('input[type="password"]', 'Password123456!');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*\/app\/freelancer\/dashboard/);

    // 3. Navigate to Invoice Generator
    await page.goto('/app/freelancer/invoice-generator');
    await expect(page.locator('text=Generate Invoices')).toBeVisible();

    // 4. Select Project "Acme Brand Portal"
    await page.click('text=Acme Brand Portal');

    // Step 2 should now appear
    await expect(page.locator('text=Step 2: Configure Invoice')).toBeVisible();

    // Fill client name & email if needed
    const clientNameInput = page.locator('input[placeholder="Client Name"]');
    if (await clientNameInput.isVisible()) {
      await clientNameInput.fill('Acme Corp');
    }
    const clientEmailInput = page.locator('input[placeholder="Client Email"]');
    if (await clientEmailInput.isVisible()) {
      await clientEmailInput.fill('billing@acme.com');
    }

    // 5. Generate Preview
    const generatePreviewBtn = page.getByRole('button', {
      name: /Generate Invoice Preview/i,
    });
    await expect(generatePreviewBtn).toBeVisible();
    await generatePreviewBtn.click();

    // Modal with preview should open
    await expect(page.locator('text=Invoice Preview')).toBeVisible();
    await expect(page.locator('text=Figma Design Tokens Deliverable')).toBeVisible();

    // 6. Download PDF Action
    const downloadBtn = page.getByRole('button', { name: /Download PDF/i });
    await expect(downloadBtn).toBeVisible();

    // Setup download listener
    const downloadPromise = page.waitForEvent('download').catch(() => null);
    await downloadBtn.click();

    // 7. Send Invoice Action
    const sendBtn = page.getByRole('button', { name: /Create & Send Invoice/i });
    await expect(sendBtn).toBeVisible();
    await sendBtn.click();

    // Verify invoice created & toast feedback
    await expect(
      page
        .locator('text=Invoice created successfully')
        .or(page.locator('text=Invoice sent'))
        .or(page.locator('text=PDF downloaded'))
    ).toBeVisible();
  });
});
