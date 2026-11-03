import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ApplicationTrackerPage from '../../../pages/job_seeker/ApplicationTrackerPage';

// Mock WorkspaceContext
vi.mock('../../../contexts/WorkspaceContext', () => ({
  useWorkspace: () => ({
    showToast: vi.fn(),
  }),
}));

// Mock api client to resolve immediately to null so fallback to DEFAULT_APPLICATIONS triggers safely
vi.mock('../../../services/api', () => ({
  api: {
    get: vi.fn().mockRejectedValue(new Error('offline')),
    post: vi.fn().mockResolvedValue({}),
    put: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
  },
}));

describe('ApplicationTrackerPage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders header, KPI metrics strip, reminders alert, and all 4 kanban columns', async () => {
    render(
      <MemoryRouter>
        <ApplicationTrackerPage />
      </MemoryRouter>
    );

    // Header
    expect(screen.getByRole('heading', { name: /Job Application Tracker/i })).toBeInTheDocument();

    // 4 Kanban Columns
    expect(screen.getByTestId('kanban-column-saved')).toBeInTheDocument();
    expect(screen.getByTestId('kanban-column-applied')).toBeInTheDocument();
    expect(screen.getByTestId('kanban-column-interview')).toBeInTheDocument();
    expect(screen.getByTestId('kanban-column-offer')).toBeInTheDocument();

    // Default applications rendered in columns
    await waitFor(() => {
      expect(screen.getByText('Stripe')).toBeInTheDocument();
      expect(screen.getByText('Linear')).toBeInTheDocument();
      expect(screen.getByText('Figma')).toBeInTheDocument();
      expect(screen.getByText('Vercel')).toBeInTheDocument();
    });

    // Automated 7d/14d Reminders alert banner
    expect(screen.getByTestId('reminders-alert-banner')).toBeInTheDocument();
  });

  it('displays 7-day and 14-day auto-reminder pills on overdue applied cards', async () => {
    render(
      <MemoryRouter>
        <ApplicationTrackerPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/7d\+ Follow-Up/i)).toBeInTheDocument();
      expect(screen.getByText(/14d\+ Follow-Up/i)).toBeInTheDocument();
    });
  });

  it('advances an application to the next stage using Next button', async () => {
    render(
      <MemoryRouter>
        <ApplicationTrackerPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Supabase')).toBeInTheDocument();
    });

    // Supabase is in Saved column initially
    const savedColumn = screen.getByTestId('kanban-column-saved');
    expect(savedColumn).toHaveTextContent('Supabase');

    // Click 'Next' on the Supabase card
    const nextButtons = screen.getAllByRole('button', { name: /Next/i });
    // Find Next button inside saved column
    const supabaseNextBtn = nextButtons[0];
    fireEvent.click(supabaseNextBtn);

    // Supabase should now be in Applied column
    await waitFor(() => {
      const appliedColumn = screen.getByTestId('kanban-column-applied');
      expect(appliedColumn).toHaveTextContent('Supabase');
    });
  });

  it('opens follow-up email draft modal when clicking Draft button', async () => {
    render(
      <MemoryRouter>
        <ApplicationTrackerPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/7d\+ Follow-Up/i)).toBeInTheDocument();
    });

    const draftButtons = screen.getAllByRole('button', { name: /Draft/i });
    fireEvent.click(draftButtons[0]);

    // Modal should open
    expect(screen.getByText(/Follow-Up Email Draft/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Copy Email/i })).toBeInTheDocument();
    expect(screen.getByText(/Open in Mail App/i)).toBeInTheDocument();
  });
});
