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
        { title: 'Paxos vs Raft Comparison & Election Safety', status: 'completed' },
        { title: 'Log Replication & Committed Entry Rules', status: 'in_progress' },
        { title: 'Network Partition Scenarios & Byzantine Tolerance', status: 'pending' },
        { title: 'Practice Midterm Paper 2025', status: 'pending' },
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
        { title: 'Double & Triple Integrals over General Regions', status: 'completed' },
        { title: 'Green’s Theorem Problem Set Mastery', status: 'in_progress' },
        { title: 'Surface Integrals & Flux Computations', status: 'pending' },
        { title: 'Stokes’ & Divergence Theorem Review', status: 'pending' },
      ],
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* ─── Header Banner ────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-bg-surface via-bg-elevated to-bg-surface border border-border-base p-6 md:p-8">
        <div className="absolute top-0 right-0 w-80 h-80 bg-solar-500/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-solar-500/15 border border-solar-500/30 text-solar-500 shadow-glow-solar">
                <BookOpen className="w-5 h-5" />
              </span>
              <span className="text-2xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-solar-500/10 text-solar-500 border border-solar-500/25">
                SYLLABUS &amp; EXAM PREPARATION
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary tracking-tight">
              Study Plans &amp; Revision Sprints
            </h1>
            <p className="text-xs md:text-sm text-text-secondary max-w-2xl">
              Break down semester syllabi, organize daily focus sessions, and maintain mastery
              checkpoints with AI-assisted pacing.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => openCaptureModal('manual')}
              className="border-border-base hover:border-solar-500/50"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Study Plan
            </Button>
          </div>
        </div>
      </div>

      {/* ─── Top Grid: Pomodoro Focus Timer & Quick AI Assist ──────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Active Study Timer */}
        <Card className="p-5 border-border-base relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-solar-500" />
              <span className="text-xs font-bold text-text-primary">Start Study Timer</span>
            </div>
            <Badge variant="warning" size="sm">
              Pomodoro
            </Badge>
          </div>

          <div className="text-center my-4">
            <p className="text-4xl sm:text-5xl font-extrabold font-mono text-solar-500 tracking-wider">
              {formatTimer(timerSeconds)}
            </p>
            <p className="text-xs text-text-muted mt-2 truncate font-medium">
              Current Focus:{' '}
              <span className="text-text-primary font-semibold">{activeSessionTopic}</span>
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 pt-2 border-t border-border-base">
            <Button
              size="sm"
              onClick={toggleTimer}
              className={cn(
                'px-5',
                isTimerRunning
                  ? 'bg-danger hover:bg-danger/90 text-white'
                  : 'bg-solar-500 hover:bg-solar-600 text-white shadow-glow-solar'
              )}
            >
              {isTimerRunning ? 'Pause' : 'Start Session'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => resetTimer(25)} title="Reset to 25m">
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => resetTimer(50)} className="text-2xs">
              50m Sprint
            </Button>
          </div>
        </Card>

        {/* Exam Readiness & Syllabus Pacing */}
        <Card className="p-5 border-border-base lg:col-span-2 flex flex-col justify-between bg-gradient-to-br from-bg-surface to-bg-elevated/40">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-solar-500" />
                <span className="text-xs font-bold text-text-primary">
                  Syllabus Readiness &amp; Pacing Evaluator
                </span>
              </div>
              <span className="text-2xs text-emerald-500 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Pacing: On Track
              </span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Based on your completed study tasks, you have mastered <strong>68%</strong> of the
              Distributed Systems syllabus and <strong>42%</strong> of Calculus. Recommended schedule:
              allocating <strong>2 hours this weekend</strong> to Vector Calculus to guarantee exam
              readiness.
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-border-base flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-4 text-2xs text-text-muted font-medium">
              <span>🎯 Weekly Target: 20h Study</span>
              <span>⚡ Completed: 14.5h</span>
              <span>🔥 Study Streak: 6 Days</span>
            </div>
            <button
              onClick={() => openCaptureModal('manual')}
              className="text-xs font-bold text-solar-500 hover:text-solar-400 flex items-center gap-1.5 transition-colors"
            >
              <span>Edit Plan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </Card>
      </div>

      {/* ─── Active Study Roadmaps ─────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
            <Target className="w-4 h-4 text-solar-500" />
            <span>Active Course Study Plans</span>
          </h2>
          <span className="text-xs text-text-muted">{studyPlans.length} active syllabus plans</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {studyPlans.map((plan) => (
            <Card
              key={plan.id}
              className="p-5 border-border-base space-y-4 hover:border-solar-500/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-2xs font-mono font-bold text-solar-500 uppercase tracking-wider">
                    {plan.course}
                  </span>
                  <h3 className="text-sm font-bold text-text-primary mt-0.5">{plan.examTitle}</h3>
                  <p className="text-2xs text-text-muted flex items-center gap-1.5 mt-1">
                    <Calendar className="w-3.5 h-3.5 text-solar-500" />
                    <span>Target Date: {plan.examDate}</span>
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-lg font-extrabold text-solar-500 font-mono">
                    {plan.progress}%
                  </span>
                  <p className="text-3xs text-text-muted uppercase">Ready</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="w-full h-2 rounded-full bg-bg-elevated overflow-hidden border border-border-base">
                  <div
                    className="h-full bg-solar-500 rounded-full transition-all duration-500 shadow-glow-solar"
                    style={{ width: `${plan.progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-3xs text-text-faint font-mono">
                  <span>{plan.hoursCompleted}h Logged</span>
                  <span>Goal: {plan.totalHoursTarget}h</span>
                </div>
              </div>

              {/* Milestone Checkpoints */}
              <div className="space-y-2 pt-2 border-t border-border-base">
                <p className="text-2xs font-bold uppercase tracking-wider text-text-muted">
                  Syllabus Checkpoints
                </p>
                <div className="space-y-1.5">
                  {plan.milestones.map((m, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        'p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 transition-all',
                        m.status === 'completed'
                          ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400'
                          : m.status === 'in_progress'
                            ? 'bg-solar-500/10 border-solar-500/30 text-solar-500 font-medium'
                            : 'bg-bg-elevated/40 border-border-base text-text-secondary'
                      )}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <CheckCircle2
                          className={cn(
                            'w-4 h-4 shrink-0',
                            m.status === 'completed'
                              ? 'text-emerald-500'
                              : 'text-text-muted opacity-40'
                          )}
                        />
                        <span className="truncate">{m.title}</span>
                      </div>
                      <span className="text-3xs font-mono uppercase px-2 py-0.5 rounded-md border shrink-0">
                        {m.status.replace('_', ' ')}
                      </span>
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
                  className="text-xs font-bold text-solar-500 hover:text-solar-400 flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start Session</span>
                </button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openCaptureModal('manual')}
                  className="text-2xs text-text-muted hover:text-text-primary"
                >
                  + Add Checkpoint
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
