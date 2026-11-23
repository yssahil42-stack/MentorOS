import React from 'react';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';

export default function FreelancerCalendarPage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in pb-16 px-1 sm:px-4">
      <div className="bg-white dark:bg-[#161922] rounded-3xl border border-[#eee7e0] dark:border-stone-800/80 p-5 sm:p-8 space-y-6 shadow-xs">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
            Work calendar &amp; deadlines
          </h1>
          <p className="text-xs text-text-secondary mt-1 font-medium">
            Track client project deliverables, milestone dates, and billing schedules.
          </p>
        </div>

        <div className="rounded-3xl border-2 border-dashed border-[#eee7e0] dark:border-stone-800 p-8 sm:p-12 text-center bg-white/50 dark:bg-bg-surface/50">
          <div className="w-14 h-14 rounded-2xl bg-amber-100/80 dark:bg-amber-950/50 text-[#c04b1e] flex items-center justify-center mx-auto mb-4 border border-amber-200/60">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-text-primary">Deliverable Calendar</h3>
          <p className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
            Calendar synchronization for client milestones and invoices is being scheduled.
          </p>
        </div>
      </div>
    </div>
  );
}
