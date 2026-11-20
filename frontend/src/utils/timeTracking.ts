import type { Milestone } from '../types/project';
import type { Task } from '../types/task';

/**
 * Formats duration in minutes into a friendly human-readable format.
 * e.g., 0 -> "0m", 45 -> "45m", 60 -> "1h", 90 -> "1h 30m", 125 -> "2h 5m"
 */
export function formatTimeMinutes(minutes?: number | null): string {
  if (minutes === null || minutes === undefined || isNaN(minutes) || minutes <= 0) {
    return '0m';
  }
  const total = Math.round(minutes);
  if (total < 60) {
    return `${total}m`;
  }
  const hours = Math.floor(total / 60);
  const remainingMins = total % 60;
  return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
}

/**
 * Calculates or aggregates the Expected time (estimated minutes) and Actual time (actual minutes)
 * for a milestone and its associated tasks.
 */
export function getMilestoneTimeTotals(
  milestone: Milestone | any,
  tasks?: Task[],
  allMilestones?: (Milestone | any)[]
): { expectedMinutes: number; actualMinutes: number } {
  if (!milestone) {
    return { expectedMinutes: 0, actualMinutes: 0 };
  }

  const msDirectEst = Number(milestone.estimated_minutes) || 0;
  const msDirectAct = Number(milestone.actual_minutes) || 0;

  if (!tasks || tasks.length === 0) {
    return {
      expectedMinutes: msDirectEst,
      actualMinutes: msDirectAct,
    };
  }

  // Filter tasks belonging to the milestone's project
  const projTasks = tasks.filter(
    (t) =>
      t.project_id === milestone.project_id || String(t.project_id) === String(milestone.project_id)
  );

  if (projTasks.length === 0) {
    return {
      expectedMinutes: msDirectEst,
      actualMinutes: msDirectAct,
    };
  }

  // Find milestones belonging to the same project
  const projectMilestones = (allMilestones || []).filter(
    (ms) =>
      ms.project_id === milestone.project_id ||
      String(ms.project_id) === String(milestone.project_id)
  );
  const mIdx = projectMilestones.findIndex((ms) => ms.id === milestone.id);
  const phaseNum = mIdx >= 0 ? mIdx + 1 : 1;
  const mTitle = (milestone.title || '').toLowerCase();

  const phaseTasks = projTasks.filter((t, tIdx) => {
    const desc = (t.description || '').toLowerCase();
    const title = (t.title || '').toLowerCase();
    if (desc.includes(`phase ${phaseNum}`) || title.includes(`phase ${phaseNum}`)) return true;
    if (mTitle && (desc.includes(mTitle) || title.includes(mTitle))) return true;
    if (projectMilestones.length > 0) {
      return tIdx % projectMilestones.length === (mIdx >= 0 ? mIdx : 0);
    }
    return true;
  });

  const taskEstSum = phaseTasks.reduce((sum, t) => sum + (Number(t.estimated_minutes) || 0), 0);
  const taskActSum = phaseTasks.reduce((sum, t) => sum + (Number(t.actual_minutes) || 0), 0);

  return {
    expectedMinutes: taskEstSum > 0 ? taskEstSum : msDirectEst,
    actualMinutes: taskActSum > 0 ? taskActSum : msDirectAct,
  };
}
