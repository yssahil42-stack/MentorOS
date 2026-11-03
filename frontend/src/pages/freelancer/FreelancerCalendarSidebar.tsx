import React from 'react';
import { SmallCalendar } from '../../components/ui/SmallCalendar';

interface FreelancerCalendarSidebarProps {
  className?: string;
}

export const FreelancerCalendarSidebar: React.FC<FreelancerCalendarSidebarProps> = ({
  className = 'lg:col-span-5',
}) => {
  return (
    <aside role="complementary" aria-label="Freelancer Client Calendar" className={className}>
      <SmallCalendar role="freelancer" />
    </aside>
  );
};
