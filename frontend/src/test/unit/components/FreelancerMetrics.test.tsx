import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { FreelancerMetrics } from '../../../pages/freelancer/FreelancerMetrics';

describe('FreelancerMetrics Component', () => {
  const defaultProps = {
    displayName: 'Elena',
    projectCount: 4,
    avgProjectProgress: 68,
    pendingTaskCount: 7,
    completedTaskCount: 15,
    totalTaskCount: 22,
    taskCompletionRate: 68,
    nextDeadlineTitle: 'FinTech App MVP Deliverable',
    onOpenCapture: vi.fn(),
  };

  it('renders executive welcome banner and action buttons', () => {
    render(
      <MemoryRouter>
        <FreelancerMetrics {...defaultProps} />
      </MemoryRouter>
    );

    expect(screen.getByText('Welcome back, Elena')).toBeInTheDocument();
    expect(screen.getByText('Rate Calculator')).toBeInTheDocument();
    expect(screen.getByText('Generate Invoice')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /\+ Capture Work/i })).toBeInTheDocument();
  });

  it('calls onOpenCapture when Capture Work is clicked', () => {
    render(
      <MemoryRouter>
        <FreelancerMetrics {...defaultProps} />
      </MemoryRouter>
    );

    const captureBtn = screen.getByRole('button', { name: /\+ Capture Work/i });
    fireEvent.click(captureBtn);
    expect(defaultProps.onOpenCapture).toHaveBeenCalledTimes(1);
  });

  it('renders all 4 systematic metric cards with accurate values and progress', () => {
    render(
      <MemoryRouter>
        <FreelancerMetrics {...defaultProps} />
      </MemoryRouter>
    );

    // Metric 1: Client Accounts
    expect(screen.getByText('Client Accounts')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('68% avg progress')).toBeInTheDocument();

    // Metric 2: Deliverables Due
    expect(screen.getByText('Deliverables Due')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('15 delivered')).toBeInTheDocument();

    // Metric 3: Completed Milestones
    expect(screen.getByText('Completed Milestones')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('68% completion')).toBeInTheDocument();

    // Metric 4: Target Deadline
    expect(screen.getByText('Target Deadline')).toBeInTheDocument();
    expect(screen.getByText('FinTech App MVP Deliverable')).toBeInTheDocument();
  });
});
