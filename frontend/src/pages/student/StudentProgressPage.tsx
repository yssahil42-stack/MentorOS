import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
  Target,
  BarChart3,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  Flame,
} from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { fetchDashboardSummary } from '../../services/dashboardService';
import { fetchTasks } from '../../services/taskService';
import { fetchProjects } from '../../services/projectService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';

export default function StudentProgressPage() {
  const { openAIDrawer, openCaptureModal } = useWorkspace();

  const [targetGpa, setTargetGpa] = useState(3.85);

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['dashboard', 'student'],
    queryFn: () => fetchDashboardSummary('student'),
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', 'student'],
    queryFn: () => fetchTasks({ role: 'student' }),
  });

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['projects', 'student'],
    queryFn: () => fetchProjects('student'),
  });

  if (summaryLoading || tasksLoading || projectsLoading) {
    return <LoadingSkeleton count={4} />;
  }

  const roleSummary = summary?.role_summary as any;
  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const taskCompletionRate = tasks.length
    ? Math.round((completedTasks.length / tasks.length) * 100)
    : 85;

  const currentGpa = 3.88;
  const totalCredits = 120;
  const earnedCredits = 96;
  const studyHoursWeekly = roleSummary?.study_hours_this_week || 18.5;

  const courses = [
    {
      code: 'CS-480',
      title: 'Distributed Systems & Cloud Computing',
      credits: 4,
      currentGrade: 'A',
      percentage: 94,
      status: 'On track',
    },
    {
      code: 'CS-401',
      title: 'Senior Capstone Engineering',
      credits: 4,
      currentGrade: 'A',
      percentage: 96,
      status: 'High performance',
    },
    {
      code: 'MATH-320',
      title: 'Advanced Linear Algebra & Optimization',
      credits: 3,
      currentGrade: 'A-',
      percentage: 91,
      status: 'Needs midterm focus',
    },
    {
      code: 'PHYS-210',
      title: 'Quantum Physics & Semiconductor Devices',
      credits: 3,
      currentGrade: 'B+',
      percentage: 88,
      status: 'Recommended study block',
    },
  ];

  const daysOfWeek = [
    { day: 'Mon', hours: 3.5 },
    { day: 'Tue', hours: 4.0 },
    { day: 'Wed', hours: 2.5 },
    { day: 'Thu', hours: 4.5 },
    { day: 'Fri', hours: 3.0 },
    { day: 'Sat', hours: 5.0 },
    { day: 'Sun', hours: 2.0 },
  ];
  const maxDayHours = Math.max(...daysOfWeek.map((d) => d.hours));

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-bg-surface via-bg-elevated to-bg-surface border border-border-base p-6 md:p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-student-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-student-500/15 border border-student-500/25 text-student-400">
                <TrendingUp className="w-5 h-5" />
              </span>
              <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-student-500/10 text-student-300 border border-student-500/20">
                SEMESTER ANALYTICS &amp; GPA
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary tracking-tight">
              Academic Progress &amp; Standing
            </h1>
            <p className="text-sm text-text-secondary max-w-2xl">
              Track course weighted scores, graduation degree credits, study workload pacing, and AI
              recommendations to maximize GPA.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                openAIDrawer(
                  `My current GPA is ${currentGpa} with target ${targetGpa}. I am taking CS-480, CS-401, MATH-320, and PHYS-210. Suggest an optimized revision schedule for final exams to maintain Dean's List standing.`
                )
              }
              icon={<Sparkles className="w-4 h-4 text-student-400" />}
              className="border-student-500/30 text-student-300 hover:text-white"
            >
              AI Grade Optimizer
            </Button>
            <Link to="/app/student/study-plan">
              <Button
                variant="primary"
                size="sm"
                className="!bg-student-500 hover:!bg-student-600 shadow-glow-solar"
                icon={<BookOpen className="w-4 h-4" />}
              >
                View Study Plan
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Stat Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-student-500">
          <div className="flex items-center justify-between text-xs text-text-muted font-semibold uppercase">
            <span>Cumulative GPA</span>
            <Award className="w-4 h-4 text-student-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-text-primary">{currentGpa}</span>
            <span className="text-xs text-text-muted">/ 4.00</span>
          </div>
          <div className="mt-2 text-2xs text-student-400 font-semibold flex items-center gap-1">
            <Target className="w-3 h-3" /> Target: {targetGpa} (Dean's Honor List)
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between text-xs text-text-muted font-semibold uppercase">
            <span>Degree Credits</span>
            <GraduationCap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-text-primary">{earnedCredits}</span>
            <span className="text-xs text-text-muted">/ {totalCredits} credits</span>
          </div>
          <div className="mt-2 text-2xs text-amber-400 font-semibold">
            {Math.round((earnedCredits / totalCredits) * 100)}% completed (Senior Year)
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-xs text-text-muted font-semibold uppercase">
            <span>Weekly Study Hours</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-text-primary">{studyHoursWeekly}h</span>
            <span className="text-xs text-text-muted">this week</span>
          </div>
          <div className="mt-2 text-2xs text-emerald-400 font-semibold flex items-center gap-1">
            <Flame className="w-3 h-3" /> +3.5h ahead of weekly quota
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between text-xs text-text-muted font-semibold uppercase">
            <span>Assignment Submission</span>
            <CheckCircle2 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-text-primary">{taskCompletionRate}%</span>
            <span className="text-xs text-text-muted">on-time</span>
          </div>
          <div className="mt-2 text-2xs text-indigo-400 font-semibold">
            {completedTasks.length} assignments submitted
          </div>
        </Card>
      </div>

      {/* Main Grid: Course Performance Table + Weekly Hours Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Active Course Grade Breakdown */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="p-5">
            <div className="flex items-center justify-between pb-3 border-b border-border-base">
              <div>
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-student-400" />
                  Active Course Performance &amp; Standing
                </h3>
                <p className="text-2xs text-text-muted mt-0.5">
                  Real-time predicted grades based on completed coursework
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-student-500/10 text-student-300">
                14 Credits
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {courses.map((c) => (
                <div
                  key={c.code}
                  className="p-3.5 rounded-xl bg-bg-surface border border-border-base space-y-2 hover:border-student-500/40 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xs font-mono font-bold px-2 py-0.5 rounded bg-bg-base text-student-400 border border-border-base">
                          {c.code}
                        </span>
                        <h4 className="text-xs font-bold text-text-primary">{c.title}</h4>
                      </div>
                      <span className="text-2xs text-text-muted mt-0.5 block">
                        {c.credits} Credits • Status: {c.status}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-extrabold text-student-400">
                        {c.currentGrade}
                      </span>
                      <span className="text-2xs text-text-faint block font-mono">
                        {c.percentage}%
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-bg-base h-2 rounded-full overflow-hidden border border-border-base">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        c.percentage >= 93
                          ? 'bg-student-500'
                          : c.percentage >= 90
                            ? 'bg-amber-400'
                            : 'bg-indigo-400'
                      }`}
                      style={{ width: `${c.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column (5 cols): Study Workload & Badges */}
        <div className="lg:col-span-5 space-y-4">
          {/* Weekly Workload Distribution */}
          <Card className="p-5">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2 pb-3 border-b border-border-base">
              <BarChart3 className="w-4 h-4 text-student-400" />
              Weekly Study Pacing (Hours)
            </h3>

            <div className="mt-5 flex items-end justify-between gap-2 h-36 pt-4 px-2">
              {daysOfWeek.map((d) => {
                const heightPercent = Math.round((d.hours / maxDayHours) * 100);
                return (
                  <div
                    key={d.day}
                    className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end"
                  >
                    <span className="text-[10px] font-mono text-text-muted">{d.hours}h</span>
                    <div className="w-full max-w-[28px] bg-bg-base rounded-t-lg overflow-hidden h-full flex items-end border border-border-base">
                      <div
                        className="w-full bg-gradient-to-t from-student-500 to-amber-400 rounded-t-md transition-all duration-500"
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                    <span className="text-2xs font-semibold text-text-secondary">{d.day}</span>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-border-base flex items-center justify-between text-2xs text-text-muted">
              <span>Weekly Target: 20 Hours</span>
              <span className="text-student-400 font-semibold">92% Met</span>
            </div>
          </Card>

          {/* Academic Honors & Badges */}
          <Card className="p-5">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2 pb-3 border-b border-border-base">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              Academic Honors &amp; Milestones
            </h3>

            <div className="mt-3 space-y-2.5">
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-student-500/10 border border-student-500/20">
                <span className="p-2 rounded-lg bg-student-500/20 text-student-400 shrink-0">
                  <Award className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-student-300">Dean's List Candidate</h4>
                  <p className="text-[11px] text-text-muted">
                    Maintained 3.88 GPA over the last two terms
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-bg-surface border border-border-base">
                <span className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400 shrink-0">
                  <Flame className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-text-primary">100h Study Club</h4>
                  <p className="text-[11px] text-text-muted">
                    Logged 182 total Pomodoro focus hours
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-bg-surface border border-border-base">
                <span className="p-2 rounded-lg bg-indigo-500/15 text-indigo-400 shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-text-primary">Early Submitter</h4>
                  <p className="text-[11px] text-text-muted">
                    Submitted all CS-480 lab milestones 48h prior to deadline
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
