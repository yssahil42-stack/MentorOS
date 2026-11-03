import type {
  JobApplication,
  CreateApplicationInput,
  ApplicationStatus,
  ApplicationReminder,
  ApplicationMetrics,
} from '../types/application';
import { api } from './api';

const STORAGE_KEY = 'mentor_job_applications';

export const DEFAULT_APPLICATIONS: JobApplication[] = [
  {
    id: 'app-1',
    company: 'Stripe',
    role: 'Senior Frontend Engineer (Dashboard & Billing)',
    location: 'San Francisco, CA (Remote)',
    workplaceType: 'remote',
    status: 'applied',
    // 8 days ago to trigger the 7-day reminder
    appliedDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    salaryRange: '$175,000 - $210,000',
    url: 'https://stripe.com/jobs/frontend-senior',
    contactName: 'Sarah Jenkins',
    contactEmail: 'sjenkins@stripe.com',
    notes: 'Tailored resume emphasizing React 19, latency reduction, and multi-tenant billing.',
    lastActivityDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'app-2',
    company: 'Linear',
    role: 'Full-Stack Product Engineer',
    location: 'Remote (Global)',
    workplaceType: 'remote',
    status: 'applied',
    // 16 days ago to trigger the 14-day reminder
    appliedDate: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    salaryRange: '$160,000 - $195,000',
    url: 'https://linear.app/careers/product-engineer',
    contactName: 'Karri Saarinen',
    contactEmail: 'jobs@linear.app',
    notes: 'Shared case study on sub-50ms UI synchronization and keyboard-driven workflows.',
    lastActivityDate: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'app-3',
    company: 'Figma',
    role: 'Senior Web Platform Engineer',
    location: 'New York, NY (Hybrid)',
    workplaceType: 'hybrid',
    status: 'interview',
    appliedDate: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    salaryRange: '$180,000 - $225,000',
    url: 'https://figma.com/careers/web-platform',
    contactName: 'Elena Rostova',
    contactEmail: 'erostova@figma.com',
    notes: 'Passed initial recruiter screen. Virtual onsite scheduled for Thursday at 2 PM EST.',
    interviewStages: [
      {
        id: 'int-1',
        stageName: 'Recruiter Screen',
        date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        completed: true,
      },
      {
        id: 'int-2',
        stageName: 'System Architecture & Canvas Round',
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        completed: false,
      },
    ],
    lastActivityDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'app-4',
    company: 'Vercel',
    role: 'Developer Experience Engineer',
    location: 'San Francisco, CA (Remote)',
    workplaceType: 'remote',
    status: 'offer',
    appliedDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    salaryRange: '$190,000 base + Equity',
    url: 'https://vercel.com/careers',
    contactName: 'David Gomez',
    contactEmail: 'david.g@vercel.com',
    notes: 'Written offer received! Negotiating signing bonus and stock vesting schedule.',
    lastActivityDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 38 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'app-5',
    company: 'Supabase',
    role: 'Frontend Platform Engineer',
    location: 'Remote',
    workplaceType: 'remote',
    status: 'saved',
    appliedDate: null,
    salaryRange: '$150,000 - $180,000',
    url: 'https://supabase.com/careers',
    notes: 'Need to tailor resume to highlight real-time websockets and client query caching.',
    lastActivityDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

/**
 * Loads applications from LocalStorage
 */
export function loadApplicationsFromStorage(): JobApplication[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Non-fatal fallback
  }
  return DEFAULT_APPLICATIONS;
}

/**
 * Saves applications to LocalStorage
 */
export function saveApplicationsToStorage(apps: JobApplication[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
  } catch {
    // Non-fatal
  }
}

/**
 * Fetches applications from API or local storage fallback
 */
export async function getApplications(signal?: AbortSignal): Promise<JobApplication[]> {
  try {
    const res = await api.get<JobApplication[]>('/job-seeker/applications', { signal });
    if (Array.isArray(res) && res.length > 0) {
      saveApplicationsToStorage(res);
      return res;
    }
  } catch {
    // Graceful offline/local-first fallback
  }

  return loadApplicationsFromStorage();
}

/**
 * Creates a new job application
 */
export async function createApplication(
  input: CreateApplicationInput,
  signal?: AbortSignal
): Promise<JobApplication> {
  const newApp: JobApplication = {
    id: `app-${Date.now()}`,
    company: input.company,
    role: input.role,
    location: input.location || 'Remote',
    workplaceType: input.workplaceType || 'remote',
    status: input.status || 'saved',
    appliedDate:
      input.status === 'applied' && !input.appliedDate
        ? new Date().toISOString().split('T')[0]
        : input.appliedDate || null,
    salaryRange: input.salaryRange || '',
    url: input.url || '',
    contactName: input.contactName || '',
    contactEmail: input.contactEmail || '',
    notes: input.notes || '',
    lastActivityDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    await api.post<JobApplication>('/job-seeker/applications', newApp, { signal });
  } catch {
    // Non-fatal offline fallback
  }

  const existing = loadApplicationsFromStorage();
  const updated = [newApp, ...existing];
  saveApplicationsToStorage(updated);
  return newApp;
}

/**
 * Updates an existing job application
 */
export async function updateApplication(
  id: string,
  updates: Partial<JobApplication>,
  signal?: AbortSignal
): Promise<JobApplication> {
  const existing = loadApplicationsFromStorage();
  const index = existing.findIndex((a) => a.id === id);
  if (index === -1) {
    throw new Error(`Application with id ${id} not found`);
  }

  const updatedApp: JobApplication = {
    ...existing[index],
    ...updates,
    lastActivityDate: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    await api.patch<JobApplication>(`/job-seeker/applications/${id}`, updatedApp, { signal });
  } catch {
    // Non-fatal
  }

  existing[index] = updatedApp;
  saveApplicationsToStorage(existing);
  return updatedApp;
}

/**
 * Updates application status and adjusts applied date if transitioning to applied
 */
export async function updateApplicationStatus(
  id: string,
  newStatus: ApplicationStatus,
  signal?: AbortSignal
): Promise<JobApplication> {
  const existing = loadApplicationsFromStorage();
  const current = existing.find((a) => a.id === id);
  if (!current) {
    throw new Error(`Application with id ${id} not found`);
  }

  const updates: Partial<JobApplication> = {
    status: newStatus,
  };

  // If moving from saved to applied and no applied date is set, record today
  if (newStatus === 'applied' && !current.appliedDate) {
    updates.appliedDate = new Date().toISOString().split('T')[0];
  }

  return updateApplication(id, updates, signal);
}

/**
 * Deletes an application
 */
export async function deleteApplication(id: string, signal?: AbortSignal): Promise<boolean> {
  try {
    await api.delete(`/job-seeker/applications/${id}`, { signal });
  } catch {
    // Non-fatal
  }

  const existing = loadApplicationsFromStorage();
  const filtered = existing.filter((a) => a.id !== id);
  saveApplicationsToStorage(filtered);
  return true;
}

/**
 * Calculates automated follow-up reminders at 7 days and 14 days
 */
export function calculateReminders(applications: JobApplication[]): ApplicationReminder[] {
  if (!Array.isArray(applications)) return [];
  const now = Date.now();
  const reminders: ApplicationReminder[] = [];

  for (const app of applications) {
    if (!app) continue;
    // Auto-reminders only apply to applications in 'applied' status
    if (app.status !== 'applied' || !app.appliedDate) {
      continue;
    }

    const appliedTimestamp = new Date(app.appliedDate).getTime();
    if (isNaN(appliedTimestamp)) continue;

    const daysElapsed = Math.floor((now - appliedTimestamp) / (1000 * 60 * 60 * 24));

    if (daysElapsed >= 14) {
      reminders.push({
        id: `rem-14d-${app.id}`,
        applicationId: app.id,
        company: app.company,
        role: app.role,
        type: 'follow_up_14d',
        dueDate: new Date(appliedTimestamp + 14 * 24 * 60 * 60 * 1000).toISOString(),
        daysElapsed,
        message: `Applied ${daysElapsed} days ago. Send 14-day status check-in or reconnect with hiring manager.`,
        dismissed: false,
      });
    } else if (daysElapsed >= 7) {
      reminders.push({
        id: `rem-7d-${app.id}`,
        applicationId: app.id,
        company: app.company,
        role: app.role,
        type: 'follow_up_7d',
        dueDate: new Date(appliedTimestamp + 7 * 24 * 60 * 60 * 1000).toISOString(),
        daysElapsed,
        message: `Applied ${daysElapsed} days ago. Send polite 7-day follow-up note to recruiter.`,
        dismissed: false,
      });
    }
  }

  // Sort by oldest (most urgent) first
  return reminders.sort((a, b) => b.daysElapsed - a.daysElapsed);
}

/**
 * Generates an email template for 7-day or 14-day follow-ups
 */
export function generateFollowUpEmail(
  app: JobApplication,
  type: 'follow_up_7d' | 'follow_up_14d',
  candidateName = 'Candidate'
): { subject: string; body: string; mailtoUrl: string } {
  const recipientName = app.contactName ? app.contactName.split(' ')[0] : 'Hiring Team';

  let subject = '';
  let body = '';

  if (type === 'follow_up_7d') {
    subject = `Following up on ${app.role} application - ${candidateName}`;
    body = `Hi ${recipientName},

I hope you're having a productive week.

I recently submitted my application for the ${app.role} position at ${app.company} on ${app.appliedDate || 'last week'}. Given my background delivering scalable web platforms and high-reliability systems, I wanted to reiterate my strong enthusiasm for joining the team.

I understand you're likely reviewing many profiles, but I'd welcome the chance to briefly discuss how my background aligns with ${app.company}'s upcoming milestones.

Thank you for your time and consideration, and I look forward to hearing from you.

Best regards,
${candidateName}`;
  } else {
    subject = `Status Check: Application for ${app.role} - ${candidateName}`;
    body = `Hi ${recipientName},

I hope this note finds you well.

I am writing to check in regarding the status of my application for the ${app.role} position at ${app.company}, submitted approximately two weeks ago. 

I remain very interested in the opportunity to contribute to ${app.company} and would be thrilled to provide any additional project portfolios, code samples, or references that could aid in your evaluation.

Thank you again for your time, and I look forward to connecting when convenient.

Warm regards,
${candidateName}`;
  }

  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);
  const toAddress = app.contactEmail ? encodeURIComponent(app.contactEmail) : '';
  const mailtoUrl = `mailto:${toAddress}?subject=${encodedSubject}&body=${encodedBody}`;

  return { subject, body, mailtoUrl };
}

/**
 * Calculates high-level metrics for the application pipeline
 */
export function calculateMetrics(
  applications: JobApplication[],
  reminders: ApplicationReminder[]
): ApplicationMetrics {
  const safeApps = Array.isArray(applications) ? applications : [];
  const safeReminders = Array.isArray(reminders) ? reminders : [];
  const total = safeApps.length;
  const saved = safeApps.filter((a) => a.status === 'saved').length;
  const applied = safeApps.filter((a) => a.status === 'applied').length;
  const interview = safeApps.filter((a) => a.status === 'interview').length;
  const offer = safeApps.filter((a) => a.status === 'offer').length;
  const rejected = safeApps.filter((a) => a.status === 'rejected').length;

  const activeApplications = applied + interview + offer;
  const responseRate =
    activeApplications > 0
      ? Math.round(((interview + offer) / (applied + interview + offer)) * 100)
      : 0;

  return {
    total,
    saved,
    applied,
    interview,
    offer,
    rejected,
    responseRate,
    pendingRemindersCount: safeReminders.length,
  };
}

/**
 * Exports applications to CSV
 */
export function exportApplicationsCsv(applications: JobApplication[]): void {
  const headers = [
    'Company',
    'Role',
    'Status',
    'Applied Date',
    'Workplace Type',
    'Location',
    'Salary Range',
    'Contact Name',
    'Contact Email',
    'Notes',
  ];
  const rows = applications.map((a) => [
    `"${a.company.replace(/"/g, '""')}"`,
    `"${a.role.replace(/"/g, '""')}"`,
    `"${a.status}"`,
    `"${a.appliedDate || ''}"`,
    `"${a.workplaceType}"`,
    `"${a.location}"`,
    `"${a.salaryRange || ''}"`,
    `"${a.contactName || ''}"`,
    `"${a.contactEmail || ''}"`,
    `"${(a.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `job-applications-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
