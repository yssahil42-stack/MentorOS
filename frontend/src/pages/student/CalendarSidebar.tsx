import React from 'react';
import { SmallCalendar } from '../../components/ui/SmallCalendar';

interface CalendarSidebarProps {
  className?: string;
}

export const CalendarSidebar: React.FC<CalendarSidebarProps> = ({
  className = 'lg:col-span-5',
}) => {
  return (
    <aside role="complementary" aria-label="Student Academic Calendar" className={className}>
      <SmallCalendar role="student" />
    </aside>
  );
};
