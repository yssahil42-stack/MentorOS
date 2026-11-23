import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { StudentProgressSection } from '../../../pages/student/StudentProgressSection';
import { TerracottaDashboardLayout } from '../../../components/dashboard/TerracottaDashboardLayout';
import { CourseAccordion } from '../../../pages/student/CourseAccordion';
import type { Project } from '../../../types/project';

vi.mock('../../../contexts/WorkspaceContext', () => ({
  useWorkspace: () => ({
    openAIDrawer: vi.fn(),
    showToast: vi.fn(),
  }),
}));

describe('Course Created Time Display Tests', () => {
  const mockCourse: Project = {
    id: 101,
    user_id: 1,
    role: 'student',
    title: 'Distributed Systems',
    description: 'Advanced distributed computing and consensus protocols',
    status: 'active',
    priority: 'high',
    progress: 75,
    created_at: '2026-11-20T14:30:00.000Z',
    updated_at: '2026-11-21T10:00:00.000Z',
  };

  it('renders creation time badge inside StudentProgressSection', () => {
    render(
      <MemoryRouter>
        <StudentProgressSection
          projects={[mockCourse]}
          tasks={[]}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Distributed Systems')).toBeInTheDocument();
    expect(screen.getByText(/Created Nov 20, 2026/i)).toBeInTheDocument();
  });

  it('renders creation time badge inside CourseAccordion', () => {
    render(
      <CourseAccordion
        projects={[mockCourse]}
        tasks={[]}
        filteredTasks={[]}
        selectedCourseFilter="all"
        expandedCourses={{}}
        onToggleExpand={() => {}}
        courseTaskPages={{}}
        onLoadMoreCourseTasks={() => {}}
        onToggleTask={() => {}}
        emptyStateConfig={{ description: 'No courses' }}
        onAiPromptClick={() => {}}
      />
    );

    expect(screen.getByText('Distributed Systems')).toBeInTheDocument();
    expect(screen.getByText(/Created Nov 20, 2026/i)).toBeInTheDocument();
  });

  it('renders creation time badge inside TerracottaDashboardLayout items table', () => {
    render(
      <MemoryRouter>
        <TerracottaDashboardLayout
          greeting="Welcome"
          title="Overview"
          subtitle="Dashboard"
          stats={[]}
          todayTasks={[]}
          quickAddPlaceholder="Quick add"
          onQuickAddSubmit={() => {}}
          calendarScheduleTo="/calendar"
          itemsTitle="Enrolled Courses"
          itemsSeeAllTo="/courses"
          items={[
            {
              id: 101,
              code: 'CS-401',
              title: 'Distributed Systems',
              subtitle: '4 assignments completed · 75%',
              progress: 75,
              statusBadge: 'A',
              created_at: '2026-11-20T14:30:00.000Z',
            },
          ]}
          activityTitle="Weekly Study"
          activityStat="18.5h"
          activityBars={[]}
          milestones={[]}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Distributed Systems')).toBeInTheDocument();
    expect(screen.getByText(/Created Nov 20, 2026/i)).toBeInTheDocument();
  });
});
