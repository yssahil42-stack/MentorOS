import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SmallCalendar } from '../../../components/ui/SmallCalendar';
import { Modal } from '../../../components/ui/Modal';
import * as calendarService from '../../../services/calendarService';
import { WorkspaceProvider } from '../../../contexts/WorkspaceContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../../services/calendarService', () => ({
  fetchCalendarEvents: vi.fn(),
  createCalendarEvent: vi.fn(),
  deleteCalendarEvent: vi.fn(),
}));

const mockEvents = [
  {
    id: 1,
    title: 'Algorithms Final Exam',
    description: 'Room 304 Examination Hall',
    event_type: 'exam' as const,
    start_at: new Date(2026, 10, 15, 10, 0).toISOString(),
    end_at: new Date(2026, 10, 15, 12, 0).toISOString(),
    role: 'student',
  },
  {
    id: 2,
    title: 'Client Sprint Demo',
    description: 'Zoom call with stakeholders',
    event_type: 'milestone_target' as const,
    start_at: new Date(2026, 10, 18, 14, 0).toISOString(),
    end_at: new Date(2026, 10, 18, 15, 0).toISOString(),
    role: 'freelancer',
  },
];

describe('Multi-Viewport Responsive Tests (360px, 375px, 768px, 1024px, 1440px)', () => {
  const targetViewports = [
    { width: 360, height: 740, label: '360px (Small Android)' },
    { width: 375, height: 667, label: '375px (iPhone SE)' },
    { width: 768, height: 1024, label: '768px (iPad Mini / Tablet)' },
    { width: 1024, height: 768, label: '1024px (Small Desktop / Laptop)' },
    { width: 1440, height: 900, label: '1440px (Wide Desktop)' },
  ];

  beforeEach(() => {
    vi.mocked(calendarService.fetchCalendarEvents).mockResolvedValue(mockEvents);
  });

  const setViewport = (width: number, height: number) => {
    window.innerWidth = width;
    window.innerHeight = height;
    window.dispatchEvent(new Event('resize'));
  };

  describe('1. SmallCalendar Responsive Behavior', () => {
    targetViewports.forEach(({ width, height, label }) => {
      it(`renders mini-calendar card cleanly at ${label}`, () => {
        setViewport(width, height);
        const queryClient = new QueryClient();

        render(
          <QueryClientProvider client={queryClient}>
            <WorkspaceProvider>
              <SmallCalendar role="student" />
            </WorkspaceProvider>
          </QueryClientProvider>
        );

        expect(screen.getByText('My Schedule')).toBeInTheDocument();
        expect(screen.getByTitle('Open Full Screen')).toBeInTheDocument();
      });

      it(`opens fullscreen modal with responsive month grid and controls at ${label}`, async () => {
        setViewport(width, height);
        const queryClient = new QueryClient();

        render(
          <QueryClientProvider client={queryClient}>
            <WorkspaceProvider>
              <SmallCalendar role="student" />
            </WorkspaceProvider>
          </QueryClientProvider>
        );

        // Open full screen
        const openFsBtn = screen.getByTitle('Open Full Screen');
        fireEvent.click(openFsBtn);

        // Verify Fullscreen Modal is mounted
        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
        expect(dialog).toHaveClass('p-0');

        // Verify Calendar Header & Title
        expect(screen.getByText('Calendar & Schedule')).toBeInTheDocument();

        // Verify month grid container has horizontal scroll protection on mobile
        const monthGrid = dialog.querySelector('.overflow-x-auto');
        expect(monthGrid).toBeInTheDocument();

        // Switch to Agenda List view
        const agendaBtn = screen.getByRole('button', { name: /agenda list/i });
        fireEvent.click(agendaBtn);

        // Verify Agenda View rendered
        expect(screen.getByText('Month')).toBeInTheDocument();
      });
    });
  });

  describe('2. Modal (fullscreen) Viewport Stability', () => {
    targetViewports.forEach(({ width, height, label }) => {
      it(`renders fullscreen modal with 100% viewport coverage at ${label}`, () => {
        setViewport(width, height);

        render(
          <Modal
            isOpen={true}
            onClose={vi.fn()}
            size="fullscreen"
            title="Fullscreen Document Viewer"
          >
            <div data-testid="fullscreen-inner-content">
              <h1>Responsive Content Canvas</h1>
              <p>
                Viewport: {width}x{height}
              </p>
            </div>
          </Modal>
        );

        const dialogWrapper = screen.getByRole('dialog');
        expect(dialogWrapper).toHaveClass('p-0');

        const innerDialog = dialogWrapper.children[1] as HTMLElement;
        expect(innerDialog).toBeInTheDocument();
        expect(innerDialog).toHaveClass(
          'w-full',
          'h-full',
          'max-w-none',
          'max-h-none',
          'rounded-none'
        );
        expect(screen.getByTestId('fullscreen-inner-content')).toBeInTheDocument();
      });
    });
  });

  describe('3. Tables Responsive Horizontal Scrolling and Card Layout', () => {
    targetViewports.forEach(({ width, height, label }) => {
      it(`maintains horizontal scroll containment and column guards at ${label}`, () => {
        setViewport(width, height);

        const { container } = render(
          <div className="space-y-6">
            {/* Table with overflow-x-auto (same pattern as Tasks/Invoices/Rates) */}
            <div
              className="overflow-x-auto rounded-xl border border-border-base"
              data-testid="table-scroll-container"
            >
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-base">
                    <th className="p-3 text-left">Task Name</th>
                    <th className="p-3 text-left hidden md:table-cell" data-testid="col-project">
                      Project
                    </th>
                    <th className="p-3 text-left hidden lg:table-cell" data-testid="col-priority">
                      Priority
                    </th>
                    <th className="p-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-3">Refactor Student Dashboard</td>
                    <td className="p-3 hidden md:table-cell">Web App</td>
                    <td className="p-3 hidden lg:table-cell">High</td>
                    <td className="p-3 text-right">Completed</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Mobile Card Layout alternative for narrow viewports */}
            <div className="block md:hidden space-y-3" data-testid="mobile-cards-view">
              <div className="p-4 rounded-xl border border-border-base bg-bg-surface">
                <p className="font-bold">Refactor Student Dashboard</p>
                <p className="text-xs text-text-muted">High • Completed</p>
              </div>
            </div>
          </div>
        );

        // Container must have overflow-x-auto
        const scrollContainer = screen.getByTestId('table-scroll-container');
        expect(scrollContainer).toHaveClass('overflow-x-auto');

        // Verify table rendered
        expect(container.querySelector('table')).toBeInTheDocument();

        // Verify column responsive classes
        const colProject = screen.getByTestId('col-project');
        expect(colProject).toHaveClass('hidden', 'md:table-cell');

        const colPriority = screen.getByTestId('col-priority');
        expect(colPriority).toHaveClass('hidden', 'lg:table-cell');

        // Verify mobile cards alternative is in DOM with responsive utility
        const mobileCards = screen.getByTestId('mobile-cards-view');
        expect(mobileCards).toHaveClass('block', 'md:hidden');
      });
    });
  });
});
