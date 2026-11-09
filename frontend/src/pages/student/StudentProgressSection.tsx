import React, { useState } from 'react';
import {
  TrendingUp,
  Award,
  GraduationCap,
  Clock,
  CheckCircle2,
  Target,
  Flame,
  BookOpen,
  BarChart3,
  ShieldCheck,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import type { Project } from '../../types/project';
import type { Task } from '../../types/task';

interface StudentProgressSectionProps {
  projects: Project[];
  tasks: Task[];
  roleSummary?: any;
}

export const StudentProgressSection: React.FC<StudentProgressSectionProps> = ({
  projects,
  tasks,
  roleSummary,
}) => {
  const { openAIDrawer } = useWorkspace();
  const [targetGpa] = useState(3.85);

  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const taskCompletionRate = tasks.length
    ? Math.round((completedTasks.length / tasks.length) * 100)
    : 85;

  const currentGpa = 3.88;
  const totalCredits = 120;
  const earnedCredits = 96;
  const studyHoursWeekly = roleSummary?.study_hours_this_week || 18.5;

  // Dynamically map enrolled courses from projects or fallback to curriculum defaults
  const courses =
    projects.length > 0
      ? projects.map((p, idx) => {
          const pTasks = tasks.filter(
            (t) =>
              t.project_id === p.id ||
              (t.project_title &&
                t.project_title.trim().toLowerCase() === p.title.trim().toLowerCase())
          );
          const pCompleted = pTasks.filter((t) => t.status === 'completed').length;
          const pPct =
            pTasks.length > 0
              ? Math.round((pCompleted / pTasks.length) * 100)
              : p.progress || 88;
          const grade =
            pPct >= 93 ? 'A' : pPct >= 90 ? 'A-' : pPct >= 85 ? 'B+' : pPct >= 80 ? 'B' : 'B-';
          const defaultCodes = ['CS-480', 'CS-401', 'MATH-320', 'PHYS-210', 'ENG-301'];
          return {
            code: defaultCodes[idx % defaultCodes.length],
            title: p.title,
            credits: 4,
            currentGrade: grade,
            percentage: pPct,
            status: pPct >= 90 ? 'High performance' : 'On track',
          };
        })
      : [
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

  const totalCourseCredits = courses.reduce((sum, c) => sum + c.credits, 0);

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
    <section
      id="progress"
      aria-label="Academic Standing & Semester Analytics"
      className="space-y-4 pt-2"
    >
      {/* Systematic Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-base">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-text-primary flex items-center gap-2">
            <span className="p-1 rounded-lg bg-student-500/15 text-student-500 dark:text-student-400 border border-student-500/25">
              <TrendingUp className="w-4 h-4" />
            </span>
            <span>Academic Progress &amp; Semester Standing</span>
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Real-time GPA projections, degree credit standing, and weekly study pacing metrics
          </p>
        </div>

      </div>

      {/* 4 Systematic Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-student-500 shadow-2xs hover:border-student-500/40 transition-all">
          <div className="flex items-center justify-between text-xs text-text-muted font-semibold uppercase">
            <span>Cumulative GPA</span>
            <Award className="w-4 h-4 text-student-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-text-primary">{currentGpa}</span>
            <span className="text-xs text-text-muted">/ 4.00</span>
          </div>
          <div className="mt-2 text-2xs text-student-400 font-semibold flex items-center gap-1">
            <Target className="w-3 h-3" /> Target: {targetGpa} (Dean's Honor List)
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-amber-500 shadow-2xs hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between text-xs text-text-muted font-semibold uppercase">
            <span>Degree Credits</span>
            <GraduationCap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-text-primary">{earnedCredits}</span>
            <span className="text-xs text-text-muted">/ {totalCredits} credits</span>
          </div>
          <div className="mt-2 text-2xs text-amber-400 font-semibold">
            {Math.round((earnedCredits / totalCredits) * 100)}% completed (Senior Year)
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-500 shadow-2xs hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between text-xs text-text-muted font-semibold uppercase">
            <span>Weekly Study Hours</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-text-primary">{studyHoursWeekly}h</span>
            <span className="text-xs text-text-muted">logged</span>
          </div>
          <div className="mt-2 text-2xs text-emerald-400 font-semibold flex items-center gap-1">
            <Flame className="w-3 h-3" /> +3.5h ahead of weekly quota
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-orange-500 shadow-2xs hover:border-orange-500/40 transition-all">
          <div className="flex items-center justify-between text-xs text-text-muted font-semibold uppercase">
            <span>Submission Rate</span>
            <CheckCircle2 className="w-4 h-4 text-orange-500 dark:text-orange-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-text-primary">{taskCompletionRate}%</span>
            <span className="text-xs text-text-muted">on-time</span>
          </div>
          <div className="mt-2 text-2xs text-orange-500 dark:text-orange-400 font-semibold">
            {completedTasks.length} assignments submitted
          </div>
        </Card>
      </div>

      {/* Main Two-Column Progress Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Active Course Performance Table */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="p-5 border border-border-base shadow-card backdrop-blur-md">
            <div className="flex items-center justify-between pb-3.5 border-b border-border-base">
              <div>
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-student-400" />
                  <span>Active Course Performance &amp; Standing</span>
                </h3>
                <p className="text-2xs text-text-muted mt-0.5">
                  Real-time predicted grades based on completed coursework and deliverables
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-student-500/10 text-student-400 border border-student-500/20">
                {totalCourseCredits} Credits
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {courses.map((c) => (
                <div
                  key={c.code}
                  className="p-3.5 rounded-xl bg-bg-surface border border-border-base space-y-2 hover:border-student-500/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-2xs font-mono font-bold px-2 py-0.5 rounded bg-bg-base text-student-400 border border-border-base">
                          {c.code}
                        </span>
                        <h4 className="text-xs font-bold text-text-primary truncate">{c.title}</h4>
                      </div>
                      <span className="text-2xs text-text-muted mt-0.5 block">
                        {c.credits} Credits • Standing: {c.status}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-base font-extrabold text-student-400">
                        {c.currentGrade}
                      </span>
                      <span className="text-2xs text-text-faint block font-mono">
                        {c.percentage}%
                      </span>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full bg-bg-base h-2 rounded-full overflow-hidden border border-border-base">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        c.percentage >= 93
                          ? 'bg-gradient-to-r from-student-500 to-emerald-400'
                          : c.percentage >= 90
                            ? 'bg-gradient-to-r from-student-500 to-amber-400'
                            : 'bg-gradient-to-r from-amber-500 to-orange-400'
                      }`}
                      style={{ width: `${c.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column (5 cols): Weekly Study Workload & Honors */}
        <div className="lg:col-span-5 space-y-4">
          {/* Weekly Workload Pacing Distribution */}
          <Card className="p-5 border border-border-base shadow-card backdrop-blur-md">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2 pb-3.5 border-b border-border-base">
              <BarChart3 className="w-4 h-4 text-student-400" />
              <span>Weekly Study Pacing (Hours)</span>
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
          <Card className="p-5 border border-border-base shadow-card backdrop-blur-md">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2 pb-3.5 border-b border-border-base">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Academic Standing &amp; Honors</span>
            </h3>

            <div className="mt-3 space-y-2.5">
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-student-500/10 border border-student-500/20">
                <span className="p-2 rounded-lg bg-student-500/20 text-student-400 shrink-0">
                  <Award className="w-4 h-4" />
                </span>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-student-300">Dean's List Candidate</h4>
                  <p className="text-[11px] text-text-muted truncate">
                    Maintained 3.88 GPA over the last two terms
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-bg-surface border border-border-base">
                <span className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400 shrink-0">
                  <Flame className="w-4 h-4" />
                </span>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-text-primary">100h Study Club</h4>
                  <p className="text-[11px] text-text-muted truncate">
                    Logged 182 total Pomodoro focus hours
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-bg-surface border border-border-base">
                <span className="p-2 rounded-lg bg-orange-500/15 text-orange-600 dark:text-orange-400 shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-text-primary">Early Submitter</h4>
                  <p className="text-[11px] text-text-muted truncate">
                    Submitted all coursework deliverables 48h early
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};
