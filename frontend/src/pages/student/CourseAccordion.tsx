import React from 'react';
import { ChevronDown, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { TaskList } from './TaskList';
import type { Project } from '../../types/project';
import type { Task, TaskStatus } from '../../types/task';

interface CourseAccordionProps {
  projects: Project[];
  tasks: Task[];
  filteredTasks: Task[];
  selectedCourseFilter: number | 'all';
  expandedCourses: Record<string | number, boolean>;
  onToggleExpand: (id: string | number) => void;
  courseTaskPages: Record<string | number, number>;
  onLoadMoreCourseTasks: (id: string | number) => void;
  onToggleTask: (taskId: number, currentStatus: TaskStatus) => void;
  pageSize?: number;
  emptyStateConfig: { description: string; actionLabel?: string };
  onAiPromptClick: () => void;
}

export const CourseAccordion: React.FC<CourseAccordionProps> = ({
  projects,
  tasks,
  filteredTasks,
  selectedCourseFilter,
  expandedCourses,
  onToggleExpand,
  courseTaskPages,
  onLoadMoreCourseTasks,
  onToggleTask,
  pageSize = 25,
  emptyStateConfig,
  onAiPromptClick,
}) => {
  const displayProjects =
    selectedCourseFilter === 'all'
      ? projects
      : projects.filter((p) => p.id === selectedCourseFilter);

  if (projects.length === 0 && tasks.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-text-muted space-y-3">
        <p>{emptyStateConfig.description}</p>
        {emptyStateConfig.actionLabel && (
          <Button
            size="xs"
            variant="secondary"
            onClick={onAiPromptClick}
            className="inline-flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-solar-500" />
            {emptyStateConfig.actionLabel}
          </Button>
        )}
      </div>
    );
  }

  const generalTasks = filteredTasks.filter(
    (t) => !t.project_id && (!t.project_title || !projects.some((p) => p.title === t.project_title))
  );

  return (
    <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
      {displayProjects.map((proj) => {
        const isExpanded = expandedCourses[proj.id] ?? true;
        const allTasks = tasks.filter(
          (t) =>
            t.project_id === proj.id ||
            (t.project_title &&
              t.project_title.trim().toLowerCase() === proj.title.trim().toLowerCase())
        );
        const courseTasks = filteredTasks.filter(
          (t) =>
            t.project_id === proj.id ||
            (t.project_title &&
              t.project_title.trim().toLowerCase() === proj.title.trim().toLowerCase())
        );
        const currentPage = courseTaskPages[proj.id] || 1;
        const visibleTasks = courseTasks.slice(0, currentPage * pageSize);
        const doneCount = allTasks.filter((t) => t.status === 'completed').length;
        const dynProgress =
          allTasks.length > 0
            ? Math.round((doneCount / allTasks.length) * 100)
            : proj.progress || 0;

        return (
          <div
            key={proj.id}
            className="rounded-xl border border-border-base bg-bg-surface overflow-hidden shadow-2xs transition-all"
          >
            <div
              onClick={() => onToggleExpand(proj.id)}
              className="p-3 bg-bg-elevated/40 hover:bg-bg-elevated cursor-pointer flex items-center justify-between gap-3 transition-colors border-b border-border-base/50"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-text-muted hover:text-text-primary transition-transform">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-blue-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-text-muted" />
                  )}
                </span>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-text-primary truncate">{proj.title}</h4>
                  {proj.description && (
                    <p className="text-3xs text-text-muted truncate max-w-sm">{proj.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="hidden sm:flex items-center gap-2">
                  <div className="w-20 bg-bg-base h-1.5 rounded-full overflow-hidden border border-border-subtle">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${dynProgress}%` }}
                    />
                  </div>
                  <span className="text-3xs font-mono font-bold text-blue-600 dark:text-blue-400">
                    {dynProgress}%
                  </span>
                </div>
                <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  {doneCount}/{allTasks.length} done
                </span>
              </div>
            </div>
            {isExpanded && (
              <div className="p-2.5 bg-bg-surface/80">
                <TaskList
                  tasks={visibleTasks}
                  onToggleTask={onToggleTask}
                  accentColor="blue"
                  emptyMessage="No assignments in this course yet. Use the input above to add one."
                  onLoadMore={() => onLoadMoreCourseTasks(proj.id)}
                  remainingCount={courseTasks.length - visibleTasks.length}
                  loadMoreLabel="Load more assignments"
                />
              </div>
            )}
          </div>
        );
      })}

      {selectedCourseFilter === 'all' && generalTasks.length > 0 && (
        <div className="rounded-xl border border-border-base bg-bg-surface overflow-hidden shadow-2xs transition-all">
          <div
            onClick={() => onToggleExpand('general')}
            className="p-3 bg-bg-elevated/40 hover:bg-bg-elevated cursor-pointer flex items-center justify-between gap-3 border-b border-border-base/50"
          >
            <div className="flex items-center gap-2">
              {(expandedCourses['general'] ?? true) ? (
                <ChevronDown className="w-4 h-4 text-amber-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-text-muted" />
              )}
              <h4 className="text-xs font-bold text-text-primary">
                General Coursework &amp; Tasks
              </h4>
            </div>
            <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              {generalTasks.length} items
            </span>
          </div>
          {(expandedCourses['general'] ?? true) && (
            <div className="p-2.5 bg-bg-surface/80">
              <TaskList
                tasks={generalTasks.slice(0, (courseTaskPages['general'] || 1) * pageSize)}
                onToggleTask={onToggleTask}
                accentColor="amber"
                onLoadMore={() => onLoadMoreCourseTasks('general')}
                remainingCount={
                  generalTasks.length -
                  generalTasks.slice(0, (courseTaskPages['general'] || 1) * pageSize).length
                }
                loadMoreLabel="Load more coursework"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
