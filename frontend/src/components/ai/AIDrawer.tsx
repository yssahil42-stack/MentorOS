import React from 'react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { RoadmapWorkspace } from './RoadmapWorkspace';

export function AIDrawer() {
  const { isAIDrawerOpen, closeAIDrawer, aiDrawerPrompt } = useWorkspace();

  if (!isAIDrawerOpen) return null;

  return (
    <RoadmapWorkspace
      isOpen={isAIDrawerOpen}
      onClose={closeAIDrawer}
      initialPrompt={aiDrawerPrompt}
    />
  );
}
