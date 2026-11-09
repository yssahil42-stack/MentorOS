import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../../components/ui/Button';

interface FreelancerQuickAddFormProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  placeholder?: string;
  isPending?: boolean;
}

export const FreelancerQuickAddForm: React.FC<FreelancerQuickAddFormProps> = ({
  value,
  onChange,
  onSubmit,
  placeholder = 'Add client deliverable...',
  isPending = false,
}) => {
  return (
    <form onSubmit={onSubmit} className="mt-4 flex items-center gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-slate-50 dark:bg-bg-base border border-border-base rounded-xl px-4 py-2.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 transition-all shadow-2xs"
      />
      <Button
        type="submit"
        size="sm"
        disabled={!value.trim() || isPending}
        icon={<Plus className="w-3.5 h-3.5" />}
        className="!bg-amber-500 hover:!bg-amber-600 text-stone-950 font-bold shrink-0 h-9.5 px-3.5 shadow-2xs active:translate-y-[1px]"
      >
        Add
      </Button>
    </form>
  );
};
