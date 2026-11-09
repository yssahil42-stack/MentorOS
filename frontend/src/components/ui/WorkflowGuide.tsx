import React, { useState } from 'react';
import {
  FolderGit2,
  Zap,
  CheckSquare,
  FileText,
  Calendar,
  Award,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';

interface WorkflowGuideProps {
  role?: string;
}

export function WorkflowGuide({ role = 'all' }: WorkflowGuideProps) {
  const { openCaptureModal, openAIDrawer } = useWorkspace();
  const [isExpanded, setIsExpanded] = useState(false);

  const steps = [
    {
      num: '01',
      title: '1. Create Project',
      desc: 'Set goals and deadlines; stored securely in your database.',
      icon: FolderGit2,
      action: () => openCaptureModal('manual'),
      actionLabel: 'New Project',
    },
    {
      num: '02',
      title: '2. Generate Roadmap',
      desc: 'AI builds milestone phases, focus subtasks, and study/build sessions.',
      icon: Zap,
      action: () => openAIDrawer(),
      actionLabel: 'Plan with AI',
    },
    {
      num: '03',
      title: '3. Build & Track',
      desc: 'Work through interactive checklists and track real-time progress.',
      icon: CheckSquare,
    },
    {
      num: '04',
      title: '4. Generate Content',
      desc: 'On milestone or project completion, AI drafts a case study or post.',
      icon: FileText,
    },
    {
      num: '05',
      title: '5. Schedule',
      desc: 'Review and schedule posts into the visual publishing calendar.',
      icon: Calendar,
    },
    {
      num: '06',
      title: '6. Review Dashboard',
      desc: 'Track project completion status side-by-side with upcoming stories.',
      icon: Award,
      isCurrent: true,
    },
  ];

  return (
    <div className="rounded-2xl bg-bg-surface border border-border-base p-4 sm:p-5 shadow-sm transition-all">
      <div className="flex items-center justify-between pb-2 border-b border-border-base/70">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-solar-500/15 border border-solar-500/30 flex items-center justify-center text-solar-500 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-text-primary flex items-center gap-2">
              <span>MentorOS Workflow Guide</span>
              <span className="text-3xs uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-solar-500/10 text-solar-500 border border-solar-500/25">
                Simple 6-Step Cycle
              </span>
            </h2>
            <p className="text-3xs sm:text-2xs text-text-muted mt-0.5">
              From project goal to AI-generated roadmap, execution tracking, and published case
              studies.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-3xs font-semibold text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors border border-border-base"
        >
          <span>{isExpanded ? 'Compact View' : 'Show 6 Steps'}</span>
          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {isExpanded ? (
        <div className="mt-3.5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className={`p-3 rounded-xl border transition-all flex flex-col justify-between ${
                  step.isCurrent
                    ? 'bg-solar-500/10 border-solar-500/40 shadow-sm'
                    : 'bg-bg-elevated/60 border-border-base hover:border-solar-500/30 hover:bg-bg-elevated'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-3xs font-mono font-bold px-1.5 py-0.5 rounded ${
                        step.isCurrent
                          ? 'bg-solar-500 text-white font-extrabold'
                          : 'bg-bg-surface text-text-muted border border-border-base'
                      }`}
                    >
                      {step.num}
                    </span>
                    <Icon
                      className={`w-3.5 h-3.5 ${
                        step.isCurrent ? 'text-solar-500' : 'text-text-muted'
                      }`}
                    />
                  </div>
                  <h4
                    className={`text-xs font-bold leading-tight ${
                      step.isCurrent ? 'text-solar-400 font-extrabold' : 'text-text-primary'
                    }`}
                  >
                    {step.title}
                  </h4>
                  <p className="text-3xs text-text-muted leading-relaxed line-clamp-3">
                    {step.desc}
                  </p>
                </div>

                {step.action && (
                  <button
                    type="button"
                    onClick={step.action}
                    className="mt-2.5 pt-2 border-t border-border-base/50 text-3xs font-bold text-solar-500 hover:text-solar-400 flex items-center justify-between group"
                  >
                    <span>{step.actionLabel}</span>
                    <ArrowRight className="w-2.5 h-2.5 transition-transform group-hover:translate-x-0.5" />
                  </button>
                )}

                {step.isCurrent && (
                  <div className="mt-2.5 pt-2 border-t border-solar-500/20 text-3xs font-bold text-solar-500 flex items-center justify-between">
                    <span>You are here</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-solar-500 animate-pulse" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-2.5 flex items-center gap-2 overflow-x-auto py-1 text-3xs text-text-muted">
          <span className="font-semibold text-text-secondary">Progress:</span>
          <span>1. Create Project</span>
          <span>→</span>
          <span>2. Generate Roadmap</span>
          <span>→</span>
          <span>3. Build &amp; Track</span>
          <span>→</span>
          <span>4. Draft Story</span>
          <span>→</span>
          <span>5. Schedule</span>
          <span>→</span>
          <span className="font-bold text-solar-500 bg-solar-500/10 px-2 py-0.5 rounded-full border border-solar-500/20">
            6. Review Dashboard (Active)
          </span>
        </div>
      )}
    </div>
  );
}
export default WorkflowGuide;
