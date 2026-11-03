import React, { useState } from 'react';
import {
  Settings,
  Save,
  Search,
  Bell,
  Sun,
  Moon,
  Palette,
  CheckCircle2,
  Briefcase,
} from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { cn } from '../../utils/cn';

export default function JobSettingsPage() {
  const { showToast } = useWorkspace();
  const { theme, setTheme } = useTheme();

  const [targetRole, setTargetRole] = useState('Senior Full Stack Engineer');
  const [preferredLocation, setPreferredLocation] = useState('Remote / Hybrid');
  const [notifyInterviews, setNotifyInterviews] = useState(true);
  const [notifyFollowups, setNotifyFollowups] = useState(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Job Seeker workspace settings saved!', 'success');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-job-500/20 text-job-500">
            <Settings className="w-5 h-5" />
          </span>
          <span className="text-xs font-mono font-semibold text-job-500">
            JOB SEEKER CONFIGURATION
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary mt-1">
          Career Search Settings
        </h1>
        <p className="text-xs md:text-sm text-text-muted">
          Configure Appearance, target positions, interview reminders, and pipeline follow-ups.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Appearance & Theme Setting */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-border-base">
            <Palette className="w-5 h-5 text-job-500" />
            <div>
              <h3 className="text-sm font-bold text-text-primary">
                Appearance &amp; Theme Mode
              </h3>
              <p className="text-xs text-text-muted">
                Choose between dark obsidian neon or clean modern studio light mode
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Dark Mode Card */}
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={cn(
                'flex items-center gap-3 p-4 rounded-xl border text-left transition-all',
                theme === 'dark'
                  ? 'border-job-500 bg-job-500/10 shadow-sm ring-1 ring-job-500'
                  : 'border-border-base bg-bg-surface hover:border-border-hover hover:bg-bg-elevated',
              )}
            >
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-indigo-400 shadow-sm">
                <Moon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-primary">Dark Mode</span>
                  {theme === 'dark' && <CheckCircle2 className="w-4 h-4 text-job-500" />}
                </div>
                <p className="text-2xs text-text-muted mt-0.5">Obsidian glass &amp; radiant role accents</p>
              </div>
            </button>

            {/* Light Mode Card */}
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={cn(
                'flex items-center gap-3 p-4 rounded-xl border text-left transition-all',
                theme === 'light'
                  ? 'border-job-500 bg-job-500/10 shadow-sm ring-1 ring-job-500'
                  : 'border-border-base bg-bg-surface hover:border-border-hover hover:bg-bg-elevated',
              )}
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-300 flex items-center justify-center text-amber-500 shadow-sm">
                <Sun className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-primary">Light Mode</span>
                  {theme === 'light' && <CheckCircle2 className="w-4 h-4 text-job-500" />}
                </div>
                <p className="text-2xs text-text-muted mt-0.5">Pristine studio slate &amp; clean contrast</p>
              </div>
            </button>
          </div>
        </Card>

        {/* Target Position */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-border-base">
            <Briefcase className="w-5 h-5 text-job-500" />
            <div>
              <h3 className="text-sm font-bold text-text-primary">
                Search Target Criteria
              </h3>
              <p className="text-xs text-text-muted">
                Used to tailor AI resume matching and interview questions
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-secondary block">
                Target Job Title
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full bg-bg-surface border border-border-base rounded-xl px-3.5 py-2 text-xs text-text-primary focus:outline-none focus:border-job-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-secondary block">
                Preferred Work Arrangement
              </label>
              <input
                type="text"
                value={preferredLocation}
                onChange={(e) => setPreferredLocation(e.target.value)}
                className="w-full bg-bg-surface border border-border-base rounded-xl px-3.5 py-2 text-xs text-text-primary focus:outline-none focus:border-job-500"
              />
            </div>
          </div>
        </Card>

        {/* Alerts & Notifications */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-border-base">
            <Bell className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="text-sm font-bold text-text-primary">
                Interview &amp; Application Alerts
              </h3>
              <p className="text-xs text-text-muted">
                Stay punctual and proactive throughout your hiring cycles
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyInterviews}
                onChange={(e) => setNotifyInterviews(e.target.checked)}
                className="rounded text-job-500 bg-bg-surface border-border-base"
              />
              <span className="text-xs text-text-secondary">
                Alert 1 hour before scheduled technical screens and interviews
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyFollowups}
                onChange={(e) => setNotifyFollowups(e.target.checked)}
                className="rounded text-job-500 bg-bg-surface border-border-base"
              />
              <span className="text-xs text-text-secondary">
                Remind to send follow-up note 3 days after submitting application
              </span>
            </label>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            className="!bg-job-500 hover:!bg-job-600 shadow-glow-mint"
            icon={<Save className="w-4 h-4" />}
          >
            Save Career Settings
          </Button>
        </div>
      </form>
    </div>
  );
}
