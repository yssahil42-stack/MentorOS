import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '../../../components/ui/ErrorBoundary';
import * as sentryConfig from '../../../config/sentry';

// Problematic component that throws an error
function ProblemChild({ shouldThrow = false }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error('Test exploding error');
  }
  return <div>Normal Content</div>;
}

describe('components/ErrorBoundary', () => {
  let captureSpy: any;
  const originalConsoleError = console.error;

  beforeEach(() => {
    // Suppress console.error in test output for intentional errors
    console.error = vi.fn();
    captureSpy = vi.spyOn(sentryConfig, 'captureException').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error = originalConsoleError;
    vi.restoreAllMocks();
  });

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <ProblemChild shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Normal Content')).toBeInTheDocument();
    expect(captureSpy).not.toHaveBeenCalled();
  });

  it('catches render errors and renders fallback UI', () => {
    render(
      <ErrorBoundary fallback={<div>Custom Error Fallback</div>}>
        <ProblemChild shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom Error Fallback')).toBeInTheDocument();
    expect(screen.queryByText('Normal Content')).not.toBeInTheDocument();
    expect(captureSpy).toHaveBeenCalledTimes(1);
    expect(captureSpy).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Test exploding error' }),
      expect.any(Object)
    );
  });

  it('renders ServerErrorPage by default when no custom fallback is provided', () => {
    render(
      <ErrorBoundary>
        <ProblemChild shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(
      screen.getByText(/something went wrong|server error|unexpected error/i)
    ).toBeInTheDocument();
    expect(captureSpy).toHaveBeenCalled();
  });
});
