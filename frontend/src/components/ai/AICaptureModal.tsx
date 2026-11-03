import React from 'react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { RoadmapWorkspace } from './RoadmapWorkspace';

export function AICaptureModal() {
  const { isCaptureModalOpen, closeCaptureModal } = useWorkspace();

  if (!isCaptureModalOpen) return null;

  return <RoadmapWorkspace isOpen={isCaptureModalOpen} onClose={closeCaptureModal} />;
}
