import React, { Component, type ReactNode, type ErrorInfo } from 'react';
import ServerErrorPage from '../../pages/ServerErrorPage';
import { captureException } from '../../config/sentry';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  reported: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      reported: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled Application Error:', error, errorInfo);
    captureException(error, {
      componentStack: errorInfo.componentStack ?? undefined,
    });
  }

  handleReport = () => {
    if (this.state.error) {
      captureException(this.state.error, { manualReport: true });
      window.dispatchEvent(new CustomEvent('mentor:error', { detail: this.state.error }));
      this.setState({ reported: true });
    }
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, reported: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ServerErrorPage
          error={this.state.error}
          onReport={this.handleReport}
          onRetry={this.handleReset}
          reported={this.state.reported}
        />
      );
    }

    return this.props.children;
  }
}
