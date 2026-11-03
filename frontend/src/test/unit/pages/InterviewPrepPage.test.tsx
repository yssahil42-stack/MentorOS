import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import InterviewPrepPage from '../../../pages/job_seeker/InterviewPrepPage';

// Mock WorkspaceContext
vi.mock('../../../contexts/WorkspaceContext', () => ({
  useWorkspace: () => ({
    showToast: vi.fn(),
  }),
}));

describe('InterviewPrepPage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders page header, category tabs, and curated questions', () => {
    render(
      <MemoryRouter>
        <InterviewPrepPage />
      </MemoryRouter>
    );

    expect(
      screen.getByRole('heading', { name: /Interview Prep & Compensation Guide/i })
    ).toBeInTheDocument();

    // Tab buttons
    expect(screen.getByRole('button', { name: /Question Banks/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Salary & Levels\.fyi/i })).toBeInTheDocument();

    // Curated questions rendered
    expect(
      screen.getByText(/Design a real-time collaborative document editing engine/i)
    ).toBeInTheDocument();
  });

  it('filters questions by company', () => {
    render(
      <MemoryRouter>
        <InterviewPrepPage />
      </MemoryRouter>
    );

    const stripeFilterBtn = screen.getByRole('button', { name: 'Stripe' });
    fireEvent.click(stripeFilterBtn);

    expect(
      screen.getByText(/Design an idempotent payment processing and webhook delivery system/i)
    ).toBeInTheDocument();
  });

  it('toggles question mastered state', () => {
    render(
      <MemoryRouter>
        <InterviewPrepPage />
      </MemoryRouter>
    );

    const markMasteredBtns = screen.getAllByRole('button', { name: /Mark Mastered/i });
    fireEvent.click(markMasteredBtns[0]);

    expect(screen.getByRole('button', { name: /^Mastered$/ })).toBeInTheDocument();
  });

  it('switches to Salary tab and displays Levels.fyi benchmarks', () => {
    render(
      <MemoryRouter>
        <InterviewPrepPage />
      </MemoryRouter>
    );

    const salaryTab = screen.getByRole('button', { name: /Salary & Levels\.fyi/i });
    fireEvent.click(salaryTab);

    expect(screen.getByText(/Levels\.fyi Real-Time Compensation Reference/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add Salary Target/i })).toBeInTheDocument();

    // Curated default salary entries
    expect(screen.getByText('Google')).toBeInTheDocument();
    expect(screen.getByText('L5 (Senior SWE)')).toBeInTheDocument();
  });
});
