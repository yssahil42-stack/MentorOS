import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import JobProgressPage from '../../../pages/jobSeeker/JobProgressPage';

// Mock TanStack Query data
const mockProjects = [
  {
    id: 1,
    title: 'Recommendation System Development Roadmap',
    description: 'A structured plan to design a recommendation system',
    progress: 30,
    role: 'job_seeker',
  },
  {
    id: 2,
    title: 'Distributed Systems & Cloud Computing Track',
    description: 'Other project that should be hidden when filtered',
    progress: 75,
    role: 'job_seeker',
  },
];

const mockMilestones = [
  {
    id: 101,
    project_id: 1,
    title: 'Complete Phase 1: Data Preprocessing',
    status: 'completed',
  },
  {
    id: 102,
    project_id: 1,
    title: 'Complete Phase 2: Collaborative Filtering Model',
    status: 'pending',
  },
  {
    id: 201,
    project_id: 2,
    title: 'Cloud AWS Setup',
    status: 'completed',
  },
];

const mockTasks = [
  {
    id: 1001,
    project_id: 1,
    title: 'Implement matrix factorization with SVD',
    status: 'completed',
    estimated_minutes: 60,
  },
  {
    id: 1002,
    project_id: 1,
    title: 'Evaluate RMSE and Precision@K on MovieLens',
    status: 'todo',
    estimated_minutes: 45,
  },
  {
    id: 2001,
    project_id: 2,
    title: 'Deploy Kubernetes cluster',
    status: 'todo',
    estimated_minutes: 90,
  },
];

vi.mock('../../../services/projectService', () => ({
  fetchProjects: vi.fn(() => Promise.resolve(mockProjects)),
  fetchProject: vi.fn((id: number) => {
    const p = mockProjects.find((x) => x.id === id);
    return Promise.resolve(
      p
        ? {
            ...p,
            milestones: mockMilestones.filter((m) => m.project_id === id),
            tasks: mockTasks.filter((t) => t.project_id === id),
          }
        : null
    );
  }),
  fetchMilestones: vi.fn((projectId?: number) =>
    Promise.resolve(
      projectId ? mockMilestones.filter((m) => m.project_id === projectId) : mockMilestones
    )
  ),
}));

vi.mock('../../../services/taskService', () => ({
  fetchTasks: vi.fn((params?: { project_id?: number }) =>
    Promise.resolve(
      params?.project_id
        ? mockTasks.filter((t) => t.project_id === params.project_id)
        : mockTasks
    )
  ),
  updateTask: vi.fn(() => Promise.resolve({})),
}));

vi.mock('../../../contexts/WorkspaceContext', () => ({
  useWorkspace: () => ({
    showToast: vi.fn(),
  }),
}));

function renderWithClient(ui: React.ReactElement) {
  const testQueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return render(
    <QueryClientProvider client={testQueryClient}>
      {ui}
    </QueryClientProvider>
  );
}

describe('JobProgressPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders only the specific project when projectId is passed in the URL', async () => {
    renderWithClient(
      <MemoryRouter initialEntries={['/app/job-seeker/progress?projectId=1']}>
        <Routes>
          <Route path="/app/job-seeker/progress" element={<JobProgressPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for the specific project title to appear in the header
    const titleElements = await screen.findAllByText(/Recommendation System Development Roadmap Progress/i);
    expect(titleElements[0]).toBeInTheDocument();

    // Verify filter banner
    expect(
      screen.getByText(/Filtered to Track: Recommendation System Development Roadmap/i)
    ).toBeInTheDocument();

    // Verify only this project's tasks appear
    expect(screen.getByText(/Implement SVD matrix factorization baseline/i)).toBeInTheDocument();
    expect(screen.getByText(/Evaluate RMSE, NDCG and Precision@10 metrics/i)).toBeInTheDocument();

    // Ensure the other project is NOT displayed
    expect(
      screen.queryByText(/Data Analyst & Analytics Engineering Track/i)
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Deploy Kubernetes cluster/i)).not.toBeInTheDocument();

    // Verify milestones of project 1 are displayed
    expect(screen.getByText(/Phase 1: Dataset & Matrix Factorization/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Phase 2: Hybrid Filtering & Precision@K/i)
    ).toBeInTheDocument();
    expect(screen.queryByText(/Phase 1: Advanced SQL & Star Schema Modeling/i)).not.toBeInTheDocument();
  });

  it('renders all projects when no projectId query parameter is present', async () => {
    renderWithClient(
      <MemoryRouter initialEntries={['/app/job-seeker/progress']}>
        <Routes>
          <Route path="/app/job-seeker/progress" element={<JobProgressPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText(/Job Search Progress & Analytics/i)).toBeInTheDocument();

    // Both projects should be visible
    expect(
      screen.getByText('Recommendation System Development Roadmap')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Data Analyst & Analytics Engineering Track')
    ).toBeInTheDocument();
  });
});
