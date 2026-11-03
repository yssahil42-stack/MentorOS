import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { QuickCaptureModal } from '../components/quickCapture/QuickCaptureModal';
import { useAuth } from '../contexts/AuthContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { PageLoader } from '../components/ui/PageLoader';
import type { CaptureType, CaptureSource } from '../lib/quickCaptureDB';
import { cn } from '../utils/cn';

export default function CapturePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const { openCaptureModal } = useWorkspace();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(true);
  const [prefill, setPrefill] = useState<{
    title?: string;
    content?: string;
    type?: CaptureType;
    tags?: string[];
    source?: CaptureSource;
  } | null>(null);

  // ─── Handle Share Target Parameters ────────────────────────────────────────

  useEffect(() => {
    const title = searchParams.get('title');
    const text = searchParams.get('text');
    const url = searchParams.get('url');

    if (title || text || url) {
      let content = '';
      if (text) content += text;
      if (url) content += (content ? '\n\n' : '') + url;

      setPrefill({
        title: title || 'Shared content',
        content,
        type: 'link',
        tags: ['shared'],
        source: 'share',
      });
    }
  }, [searchParams]);

  // ─── Handle Modal Close ────────────────────────────────────────────────────

  const handleClose = () => {
    setShowModal(false);
    // Navigate back or to inbox
    if (isAuthenticated) {
      navigate('/app/inbox', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  };

  // ─── Loading State ──────────────────────────────────────────────────────────

  if (isLoading) {
    return <PageLoader />;
  }

  // If not authenticated and no prefill, redirect to login
  if (!isAuthenticated && !prefill) {
    // Still show the capture modal for quick capture before login
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-base">
        <QuickCaptureModal
          isOpen={showModal}
          onClose={handleClose}
          prefill={prefill || undefined}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen fixed inset-0 z-50">
      <QuickCaptureModal isOpen={showModal} onClose={handleClose} prefill={prefill || undefined} />
    </div>
  );
}
