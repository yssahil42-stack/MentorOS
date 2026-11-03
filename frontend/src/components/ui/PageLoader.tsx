import React from 'react';
import { Layers } from 'lucide-react';

export function PageLoader() {
  return (
    <div
      className="min-h-screen bg-bg-base flex items-center justify-center"
      role="status"
      aria-label="Loading MentorOS"
    >
      <div className="flex flex-col items-center gap-4">
        {/* Pulsing logo mark */}
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-bg-surface border border-border-subtle flex items-center justify-center">
            <Layers className="h-7 w-7 text-student-400" aria-hidden="true" />
          </div>
          <div className="absolute inset-0 rounded-2xl border border-student-500/30 animate-ping opacity-60" aria-hidden="true" />
        </div>
        <p className="text-sm text-text-muted animate-pulse">Loading MentorOS…</p>
      </div>
    </div>
  );
}
