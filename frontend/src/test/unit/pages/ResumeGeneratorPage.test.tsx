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
    expect(screen.getByRole('button', { name: /Format & Tailor Resume/i })).toBeInTheDocument();

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

    // Switch to Projects input tab
    const projectsTab = screen.getByRole('button', { name: /Projects/i });
    fireEvent.click(projectsTab);

    // Uncheck/toggle MentorOS project
    const projectToggle = screen.getByText('MentorOS Productivity Engine');
    fireEvent.click(projectToggle);

    // The project should now be removed from the featured projects list in the preview
    expect(screen.getByTestId('formatted-resume-preview')).not.toHaveTextContent(
      /MentorOS Productivity Engine/i
    );
  });

  it('allows updating target role and regenerating preview', () => {
    render(
      <MemoryRouter>
        <ResumeGeneratorPage />
      </MemoryRouter>
    );

    const targetRoleInput = screen.getByPlaceholderText('e.g. Senior Full-Stack Engineer');
    fireEvent.change(targetRoleInput, { target: { value: 'Staff Platform Engineer' } });
    expect(targetRoleInput).toHaveValue('Staff Platform Engineer');
  });

  it('allows switching to Fresher / Student mode and selecting templates', () => {
    render(
      <MemoryRouter>
        <ResumeGeneratorPage />
      </MemoryRouter>
    );

    // Switch to Fresher mode
    const fresherBtn = screen.getByRole('button', { name: /Fresher \/ Student/i });
    fireEvent.click(fresherBtn);

    // Verify preview reflects entry-level summary
    const formatted = screen.getByTestId('formatted-resume-preview');
    expect(formatted).toHaveTextContent(/graduate and aspiring/i);

    // Switch to Classic Corporate template
    const classicTemplateBtn = screen.getByRole('button', { name: /Classic Corporate/i });
    fireEvent.click(classicTemplateBtn);

    // Verify template active indicator
    expect(screen.getByText(/Classic Corporate active/i)).toBeInTheDocument();
  });

  it('renders customizer on left and resume preview on right with clear structure', () => {
    render(
      <MemoryRouter>
        <ResumeGeneratorPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Resume Editor & Customizer/i)).toBeInTheDocument();
    expect(screen.getByText(/Resume Preview & Export/i)).toBeInTheDocument();
  });

  it('manages 10th and 12th board, percentage, and renders them in resume preview', () => {
    render(
      <MemoryRouter>
        <ResumeGeneratorPage />
      </MemoryRouter>
    );

    // Switch to Education tab in Customizer
    const educationTab = screen.getByRole('button', { name: /^Education$/i });
    fireEvent.click(educationTab);

    expect(screen.getByText(/12th Standard \/ Higher Secondary \/ Diploma/i)).toBeInTheDocument();
    expect(screen.getByText(/10th Standard \/ Secondary School/i)).toBeInTheDocument();

    // Verify board and percentage inputs are present
    const boardInputs = screen.getAllByPlaceholderText(/e.g. CBSE, ISC, State Board|e.g. CBSE, ICSE, State Board/i);
    expect(boardInputs.length).toBeGreaterThanOrEqual(2);

    // Update 12th Board
    fireEvent.change(boardInputs[0], { target: { value: 'ICSE Council' } });
    expect(boardInputs[0]).toHaveValue('ICSE Council');

    // Verify live preview shows updated board/percentage
    const preview = screen.getByTestId('formatted-resume-preview');
    expect(preview).toHaveTextContent(/ICSE Council/i);
  });

  it('automatically tags degree as pursuing when passing year is in the future', () => {
    render(
      <MemoryRouter>
        <ResumeGeneratorPage />
      </MemoryRouter>
    );

    // Switch to Education tab
    const educationTab = screen.getByRole('button', { name: /^Education$/i });
    fireEvent.click(educationTab);

    // Open Add Degree
    const addDegreeBtn = screen.getByRole('button', { name: /Add Degree/i });
    fireEvent.click(addDegreeBtn);

    const degreeInput = screen.getByPlaceholderText(/e.g. B.Tech in Computer Science/i);
    const instInput = screen.getByPlaceholderText(/College \/ University/i);
    const yearInput = screen.getByPlaceholderText(/Passing Year \(e.g. 2027\)/i);

    fireEvent.change(degreeInput, { target: { value: 'B.Tech in Artificial Intelligence' } });
    fireEvent.change(instInput, { target: { value: 'IIT Delhi' } });
    // Enter future year
    fireEvent.change(yearInput, { target: { value: '2028' } });

    // Should detect future year and show pursuing indicator
    expect(screen.getByText(/Future Year: Automatically tagged as Pursuing/i)).toBeInTheDocument();

    // Save Degree
    const saveBtn = screen.getByRole('button', { name: /Save Degree/i });
    fireEvent.click(saveBtn);

    // Verify Pursuing badge appears in education list and formatted preview
    const preview = screen.getByTestId('formatted-resume-preview');
    expect(preview).toHaveTextContent(/B.Tech in Artificial Intelligence/i);
    expect(preview).toHaveTextContent(/Pursuing/i);
  });
});
