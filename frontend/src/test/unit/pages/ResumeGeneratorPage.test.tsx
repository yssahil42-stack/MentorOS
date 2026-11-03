import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ResumeGeneratorPage from '../../../pages/job_seeker/ResumeGeneratorPage';

// Mock WorkspaceContext
vi.mock('../../../contexts/WorkspaceContext', () => ({
  useWorkspace: () => ({
    showToast: vi.fn(),
  }),
}));

describe('ResumeGeneratorPage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders page header, input forms, and ATS preview controls', () => {
    render(
      <MemoryRouter>
        <ResumeGeneratorPage />
      </MemoryRouter>
    );

    expect(
      screen.getByRole('heading', { name: /AI Resume Tailor & Keyword Optimizer/i })
    ).toBeInTheDocument();
    expect(screen.getByText('Target Job Specification')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tailor Resume with AI/i })).toBeInTheDocument();

    // Verify Tab buttons
    expect(screen.getByRole('button', { name: /Formatted ATS Resume/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Markdown/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Plain Text/i })).toBeInTheDocument();

    // Verify Export buttons
    expect(screen.getByRole('button', { name: /^MD$/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^TXT$/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^PDF$/ })).toBeInTheDocument();
  });

  it('switches between Formatted, Markdown, and Plain Text tabs', () => {
    render(
      <MemoryRouter>
        <ResumeGeneratorPage />
      </MemoryRouter>
    );

    // Default formatted preview
    const formatted = screen.getByTestId('formatted-resume-preview');
    expect(formatted).toBeInTheDocument();
    expect(formatted).toHaveTextContent(/Alex Morgan/i);

    // Switch to Markdown tab
    const mdTab = screen.getByRole('button', { name: /Markdown/i });
    fireEvent.click(mdTab);
    const mdTextarea = screen.getByTestId('raw-resume-textarea') as HTMLTextAreaElement;
    expect(mdTextarea).toBeInTheDocument();
    expect(mdTextarea.value).toContain('# Alex Morgan');

    // Switch to Plain Text tab
    const txtTab = screen.getByRole('button', { name: /Plain Text/i });
    fireEvent.click(txtTab);
    const txtTextarea = screen.getByTestId('plaintext-resume-textarea') as HTMLTextAreaElement;
    expect(txtTextarea).toBeInTheDocument();
    expect(txtTextarea.value).toContain('ALEX MORGAN');
  });

  it('toggles project inclusion in the resume preview', () => {
    render(
      <MemoryRouter>
        <ResumeGeneratorPage />
      </MemoryRouter>
    );

    const formatted = screen.getByTestId('formatted-resume-preview');
    expect(formatted).toHaveTextContent(/MentorOS Productivity Engine/i);

    // Uncheck/toggle MentorOS project
    const projectToggle = screen.getByText('MentorOS Productivity Engine');
    fireEvent.click(projectToggle);

    // The project should now be removed from the featured projects list in the preview
    expect(screen.getByTestId('formatted-resume-preview')).not.toHaveTextContent(
      /MentorOS Productivity Engine/i
    );
  });

  it('allows loading preset frontend profile', () => {
    render(
      <MemoryRouter>
        <ResumeGeneratorPage />
      </MemoryRouter>
    );

    const loadFrontendBtn = screen.getByRole('button', { name: /Load Frontend Sample/i });
    fireEvent.click(loadFrontendBtn);

    expect(
      screen.getByDisplayValue('Senior Frontend Engineer (UI/UX & Design Systems)')
    ).toBeInTheDocument();
    expect(screen.getByTestId('formatted-resume-preview')).toHaveTextContent(/Jordan Lee/i);
  });
});
