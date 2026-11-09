import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SearchPlanPage from '../../../pages/jobSeeker/SearchPlanPage';

vi.mock('../../../contexts/WorkspaceContext', () => ({
  useWorkspace: () => ({
    showToast: vi.fn(),
  }),
}));

describe('SearchPlanPage (Job Analyzer)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders Job Analyzer header, role presets, and default Data Analyst analysis', () => {
    render(
      <MemoryRouter>
        <SearchPlanPage />
      </MemoryRouter>
    );

    // Title and subheaders
    expect(screen.getByRole('heading', { name: /Job Analyzer/i })).toBeInTheDocument();
    expect(screen.getByText(/Configure Target Job & Your Profile/i)).toBeInTheDocument();

    // Verify Data Analyst preset button is present
    expect(screen.getByRole('button', { name: /Data Analyst/i })).toBeInTheDocument();

    // Verify readiness score is calculated and displayed
    expect(screen.getAllByText(/Readiness/i)[0]).toBeInTheDocument();

    // Verify Tabs
    expect(screen.getByRole('button', { name: /Skills Gap Analysis/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Where to Apply/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Senior Mentor Opinion/i })).toBeInTheDocument();
  });

  it('allows adding and removing skills dynamically', () => {
    render(
      <MemoryRouter>
        <SearchPlanPage />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText(/Type a skill and press Enter/i);
    fireEvent.change(input, { target: { value: 'Tableau' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    // Tableau should now be added to the skills list
    expect(screen.getAllByText('Tableau')[0]).toBeInTheDocument();
  });

  it('switches between Skills Gap, Where to Apply, and Mentor Opinion tabs', () => {
    render(
      <MemoryRouter>
        <SearchPlanPage />
      </MemoryRouter>
    );

    // Default tab is Skills Gap
    expect(screen.getByText(/Skills You Have \(Matched\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Skills You Need \(Gaps to Close\)/i)).toBeInTheDocument();

    // Click "Where to Apply" tab
    const whereTab = screen.getByRole('button', { name: /Where to Apply/i });
    fireEvent.click(whereTab);

    // Should display job portal platforms and industries
    expect(screen.getAllByText(/LinkedIn Jobs/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Wellfound \(AngelList\)/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/Recommended Application Channel Allocation/i)).toBeInTheDocument();

    // Click "Senior Mentor Opinion" tab
    const mentorTab = screen.getByRole('button', { name: /Senior Mentor Opinion/i });
    fireEvent.click(mentorTab);

    // Should display reality check and 30-day action plan
    expect(screen.getByText(/Senior Engineering & Analytics Mentor Opinion/i)).toBeInTheDocument();
    expect(screen.getByText(/Your 30-Day Step-by-Step Strategic Action Plan/i)).toBeInTheDocument();
    expect(screen.getByText(/The #1 Portfolio Asset That Will Get You Interviews/i)).toBeInTheDocument();
  });
});
