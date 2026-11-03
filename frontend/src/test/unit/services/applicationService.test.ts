import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  calculateReminders,
  calculateMetrics,
  generateFollowUpEmail,
  createApplication,
  updateApplicationStatus,
  deleteApplication,
  exportApplicationsCsv,
  DEFAULT_APPLICATIONS,
} from '../../../services/applicationService';
import type { JobApplication } from '../../../types/application';

describe('applicationService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('calculateReminders', () => {
    it('flags 7-day and 14-day auto-reminders for applied applications based on elapsed days', () => {
      const now = Date.now();
      const mockApps: JobApplication[] = [
        {
          id: 'app-7d',
          company: 'Acme Corp',
          role: 'Frontend Engineer',
          location: 'Remote',
          workplaceType: 'remote',
          status: 'applied',
          // 8 days ago
          appliedDate: new Date(now - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          lastActivityDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'app-14d',
          company: 'Globex Inc',
          role: 'Full-Stack Engineer',
          location: 'Remote',
          workplaceType: 'remote',
          status: 'applied',
          // 15 days ago
          appliedDate: new Date(now - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          lastActivityDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'app-recent',
          company: 'Starlight',
          role: 'Staff Engineer',
          location: 'Remote',
          workplaceType: 'remote',
          status: 'applied',
          // 2 days ago (no reminder due yet)
          appliedDate: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          lastActivityDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'app-saved',
          company: 'FutureCo',
          role: 'Tech Lead',
          location: 'Remote',
          workplaceType: 'remote',
          status: 'saved',
          appliedDate: null,
          lastActivityDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const reminders = calculateReminders(mockApps);
      expect(reminders.length).toBe(2);

      const reminder14d = reminders.find((r) => r.applicationId === 'app-14d');
      expect(reminder14d).toBeDefined();
      expect(reminder14d?.type).toBe('follow_up_14d');
      expect(reminder14d?.daysElapsed).toBeGreaterThanOrEqual(14);

      const reminder7d = reminders.find((r) => r.applicationId === 'app-7d');
      expect(reminder7d).toBeDefined();
      expect(reminder7d?.type).toBe('follow_up_7d');
      expect(reminder7d?.daysElapsed).toBeGreaterThanOrEqual(7);
      expect(reminder7d?.daysElapsed).toBeLessThan(14);
    });
  });

  describe('generateFollowUpEmail', () => {
    it('generates appropriate follow-up subject, body, and mailto URL for 7-day cadence', () => {
      const app = DEFAULT_APPLICATIONS[0];
      const email = generateFollowUpEmail(app, 'follow_up_7d', 'Alex Morgan');

      expect(email.subject).toContain(`Following up on ${app.role} application - Alex Morgan`);
      expect(email.body).toContain(app.company);
      expect(email.body).toContain('reiterate my strong enthusiasm');
      expect(email.mailtoUrl).toContain(encodeURIComponent(app.contactEmail || ''));
    });

    it('generates status check-in email for 14-day cadence', () => {
      const app = DEFAULT_APPLICATIONS[1];
      const email = generateFollowUpEmail(app, 'follow_up_14d', 'Alex Morgan');

      expect(email.subject).toContain(`Status Check: Application for ${app.role} - Alex Morgan`);
      expect(email.body).toContain('approximately two weeks ago');
    });
  });

  describe('calculateMetrics', () => {
    it('computes total counts, active pipeline, and response rate', () => {
      const reminders = calculateReminders(DEFAULT_APPLICATIONS);
      const metrics = calculateMetrics(DEFAULT_APPLICATIONS, reminders);

      expect(metrics.total).toBe(DEFAULT_APPLICATIONS.length);
      expect(metrics.applied).toBeGreaterThan(0);
      expect(metrics.interview).toBeGreaterThan(0);
      expect(metrics.offer).toBeGreaterThan(0);
      expect(metrics.responseRate).toBeGreaterThan(0);
    });
  });

  describe('CRUD and stage management', () => {
    it('creates an application and saves to storage', async () => {
      const created = await createApplication({
        company: 'Vercel Labs',
        role: 'AI Engineer',
        workplaceType: 'remote',
        status: 'saved',
        salaryRange: '$180k - $210k',
      });

      expect(created.id).toBeDefined();
      expect(created.company).toBe('Vercel Labs');
      expect(created.status).toBe('saved');
    });

    it('updates application status and sets applied date automatically when advancing to applied', async () => {
      const created = await createApplication({
        company: 'Neon Corp',
        role: 'Database Engineer',
        status: 'saved',
      });

      const updated = await updateApplicationStatus(created.id, 'applied');
      expect(updated.status).toBe('applied');
      expect(updated.appliedDate).toBe(new Date().toISOString().split('T')[0]);
    });

    it('deletes an application', async () => {
      const created = await createApplication({
        company: 'TempCo',
        role: 'Contractor',
        status: 'saved',
      });

      const success = await deleteApplication(created.id);
      expect(success).toBe(true);
    });
  });

  describe('exportApplicationsCsv', () => {
    it('triggers a download anchor with csv content', () => {
      const createObjectURLMock = vi.fn().mockReturnValue('blob:mock-csv');
      const revokeObjectURLMock = vi.fn();
      window.URL.createObjectURL = createObjectURLMock;
      window.URL.revokeObjectURL = revokeObjectURLMock;

      const clickSpy = vi.fn();
      const origCreateElement = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        const el = origCreateElement(tagName);
        if (tagName === 'a') {
          el.click = clickSpy;
        }
        return el;
      });

      exportApplicationsCsv(DEFAULT_APPLICATIONS);
      expect(clickSpy).toHaveBeenCalledTimes(1);
    });
  });
});
