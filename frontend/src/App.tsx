import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './store/queryClient';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { WorkspaceProvider } from './contexts/WorkspaceContext';
import { QuickCaptureProvider } from './contexts/QuickCaptureContext';
import { AppRouter } from './routes/AppRouter';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { ToastContainer } from './components/ui/ToastContainer';
import { QuickCaptureFab } from './components/quickCapture/QuickCaptureFab';

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <WorkspaceProvider>
            <QuickCaptureProvider>
              <ErrorBoundary>
                <AppRouter />
              </ErrorBoundary>
              <ToastContainer />
              <QuickCaptureFab />
            </QuickCaptureProvider>
          </WorkspaceProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
