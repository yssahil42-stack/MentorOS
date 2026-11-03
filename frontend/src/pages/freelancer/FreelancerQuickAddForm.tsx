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
    <form onSubmit={onSubmit} className="mt-3.5 flex items-center gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-bg-base/80 border border-border-base rounded-xl px-3.5 py-2 text-xs text-text-primary placeholder:text-text-faint focus:outline-none focus:border-orange-500/50 transition-colors shadow-2xs"
      />
      <Button
        type="submit"
        size="sm"
        variant="secondary"
        disabled={!value.trim() || isPending}
        icon={<Plus className="w-3.5 h-3.5" />}
        className="active:translate-y-[1px]"
      >
        Add
      </Button>
    </form>
  );
};
