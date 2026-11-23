import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  Calendar,
  Sparkles,
  Plus,
  CheckCircle2,
  Clock,
  Play,
  RotateCcw,
  Target,
  ArrowRight,
  TrendingUp,
  Bookmark,
  Award,
} from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { fetchProjects } from '../../services/projectService';
import { fetchTasks } from '../../services/taskService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { TimeTrackingBadge } from '../../components/ui/TimeTrackingBadge';
import { cn } from '../../utils/cn';

export default function StudyPlanPage() {
  const { openCaptureModal, openAIDrawer, showToast } = useWorkspace();
  const queryClient = useQueryClient();

  // Timer state for Focus Study Session
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [activeSessionTopic, setActiveSessionTopic] = useState(
    'Distributed Systems — Raft Protocol'
  );

  React.useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      showToast('Focus session complete! Take a 5-minute break. 🎉', 'success');
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds, showToast]);

  const toggleTimer = () => setIsTimerRunning((v) => !v);
  const resetTimer = (minutes = 25) => {
    setIsTimerRunning(false);
    setTimerSeconds(minutes * 60);
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Query projects & tasks strictly for student role
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['projects', 'student'],
    queryFn: () => fetchProjects('student'),
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', 'student'],
    queryFn: () => fetchTasks({ role: 'student' }),
  });

  if (projectsLoading || tasksLoading) {
    return <LoadingSkeleton className="h-96 w-full rounded-2xl" />;
  }

  // Pre-configured study plans
  const studyPlans = [
    {
      id: 'sp-1',
      course: 'CS401: Distributed Systems',
      examTitle: 'Midterm Exam: Consensus & Fault Tolerance',
      examDate: 'Oct 14, 2026 (in 12 days)',
      progress: 68,
      totalHoursTarget: 24,
      hoursCompleted: 16.5,
      milestones: [
        {
          title: 'Paxos vs Raft Comparison & Election Safety',
          status: 'completed',
          estimated_minutes: 90,
          actual_minutes: 95,
        },
        {
          title: 'Log Replication & Committed Entry Rules',
          status: 'in_progress',
          estimated_minutes: 120,
          actual_minutes: 60,
        },
        {
          title: 'Network Partition Scenarios & Byzantine Tolerance',
          status: 'pending',
          estimated_minutes: 90,
          actual_minutes: 0,
        },
        {
          title: 'Practice Midterm Paper 2025',
          status: 'pending',
          estimated_minutes: 120,
          actual_minutes: 0,
        },
      ],
    },
    {
      id: 'sp-2',
      course: 'MATH302: Multivariable Calculus',
      examTitle: 'Vector Calculus & Integration Exam',
      examDate: 'Oct 22, 2026 (in 20 days)',
      progress: 42,
      totalHoursTarget: 18,
      hoursCompleted: 7.5,
      milestones: [
        {
          title: 'Double & Triple Integrals over General Regions',
          status: 'completed',
          estimated_minutes: 90,
          actual_minutes: 85,
        },
        {
          title: 'Green’s Theorem Problem Set Mastery',
          status: 'in_progress',
          estimated_minutes: 90,
          actual_minutes: 45,
        },
        {
          title: 'Surface Integrals & Flux Computations',
          status: 'pending',
          estimated_minutes: 75,
          actual_minutes: 0,
        },
        {
          title: 'Stokes’ & Divergence Theorem Review',
          status: 'pending',
          estimated_minutes: 90,
          actual_minutes: 0,
        },
      ],
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in pb-16 px-1 sm:px-4">
      {/* ─── Header Container Card Matching Notes & Dashboard ─── */}
      <div className="bg-white dark:bg-[#161922] rounded-3xl border border-[#eee7e0] dark:border-stone-800/80 p-5 sm:p-8 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
              Study plans &amp; revision sprints
            </h1>
            <p className="text-xs text-text-secondary mt-1 font-medium">
              Break down semester syllabi, organize daily focus sessions, and maintain mastery checkpoints.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => openAIDrawer()}
              className="h-10 px-4 rounded-xl border border-border-base bg-white dark:bg-bg-elevated hover:bg-slate-50 dark:hover:bg-bg-surface text-xs font-semibold text-text-primary flex items-center gap-2 shadow-2xs transition-all hover:border-[#c04b1e]/40 cursor-pointer active:translate-y-[1px]"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#c04b1e]" />
              <span>AI Study Coach</span>
            </button>

            <button
              type="button"
              onClick={() => openCaptureModal('manual')}
              className="h-10 px-4 rounded-xl bg-[#c04b1e] hover:bg-[#a33d16] text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-all active:translate-y-[1px] cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>New study plan</span>
            </button>
          </div>
        </div>

        {/* ─── Top Grid: Pomodoro Focus Timer & Syllabus Readiness ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Active Study Timer */}
          <div className="p-6 rounded-2xl border border-border-base/90 bg-[#faf8f5]/60 dark:bg-stone-900/40 relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#c04b1e]" />
                <span className="text-xs font-bold text-text-primary">Focus study timer</span>
              </div>
              <span className="bg-[#fef3c7] text-[#92400e] dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40 text-[11px] font-semibold px-2.5 py-0.5 rounded-full inline-block">
                Pomodoro
              </span>
            </div>

            <div className="text-center my-4">
              <p className="text-4xl sm:text-5xl font-extrabold font-mono text-[#c04b1e] tracking-wider">
                {formatTimer(timerSeconds)}
              </p>
              <p className="text-xs text-text-muted mt-2 truncate font-medium">
                Current Focus:{' '}
                <span className="text-text-primary font-semibold">{activeSessionTopic}</span>
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-3 border-t border-border-base/60">
              <button
                type="button"
                onClick={toggleTimer}
                className={cn(
                  'h-9 px-4 rounded-xl text-xs font-semibold text-white transition-all shadow-xs cursor-pointer',
                  isTimerRunning
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-[#c04b1e] hover:bg-[#a33d16]'
                )}
              >
                {isTimerRunning ? 'Pause' : 'Start Session'}
              </button>
              <button
                type="button"
                onClick={() => resetTimer(25)}
                title="Reset to 25m"
                className="h-9 w-9 rounded-xl border border-border-base bg-white dark:bg-stone-800 flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-[#c04b1e]/40 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => resetTimer(50)}
                className="h-9 px-3 rounded-xl border border-border-base bg-white dark:bg-stone-800 text-xs font-semibold text-text-secondary hover:text-text-primary hover:border-[#c04b1e]/40 transition-all cursor-pointer"
              >
                50m sprint
              </button>
            </div>
          </div>

          {/* Exam Readiness & Syllabus Pacing */}
          <div className="p-6 rounded-2xl border border-border-base/90 bg-[#faf8f5]/60 dark:bg-stone-900/40 lg:col-span-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#c04b1e]" />
                  <span className="text-xs font-bold text-text-primary">
                    Syllabus Readiness &amp; Pacing Evaluator
                  </span>
                </div>
                <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/40 text-[11px] font-semibold px-2.5 py-0.5 rounded-full inline-block">
                  Pacing: On Track
                </span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                Based on your completed study tasks, you have mastered <strong>68%</strong> of the
                Distributed Systems syllabus and <strong>42%</strong> of Calculus. Recommended
                schedule: allocating <strong>2 hours this weekend</strong> to Vector Calculus to
                guarantee exam readiness.
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-border-base/60 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-4 text-xs text-text-muted font-medium">
                <span>🎯 Target: 20h Study</span>
                <span>⚡ Completed: 14.5h</span>
                <span>🔥 Streak: 6 Days</span>
              </div>
              <button
                type="button"
                onClick={() => openCaptureModal('manual')}
                className="text-xs font-bold text-[#c04b1e] hover:text-[#a33d16] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Edit plan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ─── Active Study Roadmaps ─── */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <Target className="w-4 h-4 text-[#c04b1e]" />
              <span>Active Course Study Plans</span>
            </h2>
            <span className="text-xs text-text-muted font-medium">
              {studyPlans.length} active syllabus plans
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {studyPlans.map((plan) => (
              <div
                key={plan.id}
                className="p-5 rounded-2xl border border-border-base/90 bg-white dark:bg-stone-900/40 space-y-4 hover:border-[#c04b1e]/40 transition-colors shadow-2xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-bold text-[#c04b1e] uppercase tracking-wider">
                      {plan.course}
                    </span>
                    <h3 className="text-sm font-bold text-text-primary mt-0.5">{plan.examTitle}</h3>
                    <p className="text-xs text-text-muted flex items-center gap-1.5 mt-1 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-[#c04b1e]" />
                      <span>Target Date: {plan.examDate}</span>
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-lg font-extrabold text-[#c04b1e] font-mono">
                      {plan.progress}%
                    </span>
                    <p className="text-[10px] text-text-muted uppercase font-medium">Ready</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-stone-800 overflow-hidden border border-border-base/50">
                    <div
                      className="h-full bg-[#c04b1e] rounded-full transition-all duration-500"
                      style={{ width: `${plan.progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-text-muted font-mono font-medium">
                    <span>{plan.hoursCompleted}h Logged</span>
                    <span>Goal: {plan.totalHoursTarget}h</span>
                  </div>
                </div>

                {/* Milestone Checkpoints */}
                <div className="space-y-2 pt-2 border-t border-border-base/60">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                    Syllabus Checkpoints
                  </p>
                  <div className="space-y-1.5">
                    {plan.milestones.map((m, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          'p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 transition-all',
                          m.status === 'completed'
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200/60 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                            : m.status === 'in_progress'
                              ? 'bg-orange-50 dark:bg-orange-950/30 border-orange-200/60 dark:border-orange-900/40 text-[#c04b1e] font-medium'
                              : 'bg-[#faf8f5]/80 dark:bg-stone-900/40 border-border-base/60 text-text-secondary'
                        )}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <CheckCircle2
                            className={cn(
                              'w-4 h-4 shrink-0',
                              m.status === 'completed'
                                ? 'text-emerald-600'
                                : 'text-text-muted opacity-40'
                            )}
                          />
                          <span className="truncate">{m.title}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <TimeTrackingBadge
                            expectedMinutes={(m as any).estimated_minutes || 60}
                            actualMinutes={(m as any).actual_minutes || 0}
                            size="xs"
                            variant="pill"
                          />
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md border shrink-0">
                            {m.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSessionTopic(`${plan.course} Revision`);
                      resetTimer(25);
                      toggleTimer();
                    }}
                    className="text-xs font-bold text-[#c04b1e] hover:text-[#a33d16] flex items-center gap-1.5 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start Session</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openCaptureModal('manual')}
                    className="text-xs font-medium text-text-muted hover:text-text-primary cursor-pointer"
                  >
                    + Add Checkpoint
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
