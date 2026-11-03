import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardMetrics } from '../../../pages/student/DashboardMetrics';

describe('DashboardMetrics Responsive Viewport Tests', () => {
  const defaultProps = {
    displayName: 'Alex',
    projectCount: 4,
    avgProjectProgress: 68,
    pendingTaskCount: 7,
    completedTaskCount: 15,
    totalTaskCount: 22,
    taskCompletionRate: 68,
    nextDeadlineTitle: 'Midterm Exam',
  };

  const viewports = [
    { width: 360, name: '360px (Small Android / Galaxy S8)' },
    { width: 375, name: '375px (iPhone SE / Standard Mobile)' },
    { width: 390, name: '390px (iPhone 12/13/14/15 Pro)' },
  ];

  viewports.forEach(({ width, name }) => {
    describe(`Viewport: ${name}`, () => {
      it(`renders all metrics cards in single-column mobile grid at ${width}px`, () => {
        // Set viewport dimensions
        window.innerWidth = width;
        window.innerHeight = 800;
        window.dispatchEvent(new Event('resize'));

        const { container } = render(<DashboardMetrics {...defaultProps} />);

        // Verify welcome card
        expect(screen.getByText(/Welcome back, Alex/i)).toBeInTheDocument();

        // Verify the responsive grid class contains mobile 1-column layout
        const grid = container.querySelector('.grid');
        expect(grid).toBeInTheDocument();
        expect(grid).toHaveClass('grid-cols-1');
        expect(grid).toHaveClass('sm:grid-cols-2');
        expect(grid).toHaveClass('lg:grid-cols-4');

        // Verify all 4 metric items render properly
        expect(screen.getByText('Course Projects')).toBeInTheDocument();
        expect(screen.getByText('Assignments Due')).toBeInTheDocument();
        expect(screen.getByText('Tasks Done')).toBeInTheDocument();
        expect(screen.getByText('Target Milestone')).toBeInTheDocument();

        // Verify metric values
        expect(screen.getByText('4')).toBeInTheDocument();
        expect(screen.getByText('7')).toBeInTheDocument();
        expect(screen.getByText('15')).toBeInTheDocument();
        expect(screen.getByText('Midterm Exam')).toBeInTheDocument();

        // Verify completion labels and footers
        expect(screen.getByText(/68% avg progress/i)).toBeInTheDocument();
        expect(screen.getByText(/68% completion/i)).toBeInTheDocument();
        expect(screen.getByText(/Upcoming deadline/i)).toBeInTheDocument();
      });
    });
  });

  it('renders correctly with default deadline fallback', () => {
    render(<DashboardMetrics {...defaultProps} nextDeadlineTitle={undefined} />);
    expect(screen.getByText('Semester Review')).toBeInTheDocument();
  });
});
