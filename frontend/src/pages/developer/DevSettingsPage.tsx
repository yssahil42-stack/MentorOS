import React, { useState } from 'react';
import {
  Settings,
  Save,
  GitBranch,
  Bot,
  Bell,
  Cpu,
  Shield,
  CheckCircle2,
  Sun,
  Moon,
  Laptop,
  Palette,
} from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { cn } from '../../utils/cn';

export default function DevSettingsPage() {
  const { showToast } = useWorkspace();
  const { theme, setTheme } = useTheme();

  const [repoUrl, setRepoUrl] = useState('https://github.com/developer/mentoros');
  const [aiEndpoint, setAiEndpoint] = useState('http://localhost:11434');
  const [aiModel, setAiModel] = useState('smollm2:1.7b');
  const [notifyMilestones, setNotifyMilestones] = useState(true);
  const [notifyTasks, setNotifyTasks] = useState(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Developer workspace settings saved!', 'success');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-developer-500/20 text-developer-400">
            <Settings className="w-5 h-5" />
          </span>
          <span className="text-xs font-mono font-semibold text-developer-400">
            WORKSPACE CONFIGURATION
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary mt-1">
          Developer Settings
        </h1>
        <p className="text-xs md:text-sm text-text-muted">
          Configure Appearance, Git integration, Local AI engine endpoint, sprint alerts, and
          environment preferences.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Appearance & Theme Setting */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-border-base">
            <Palette className="w-5 h-5 text-developer-400" />
            <div>
              <h3 className="text-sm font-bold text-text-primary">Appearance &amp; Theme Mode</h3>
              <p className="text-xs text-text-muted">
                Choose between dark obsidian neon or clean modern studio light mode
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {/* Dark Mode Card */}
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={cn(
                'flex items-center gap-3 p-4 rounded-xl border text-left transition-all',
                theme === 'dark'
                  ? 'border-developer-500 bg-developer-500/10 shadow-sm ring-1 ring-developer-500'
                  : 'border-border-base bg-bg-surface hover:border-border-hover hover:bg-bg-elevated'
              )}
            >
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-indigo-400 shadow-sm">
                <Moon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-primary">Dark Mode</span>
                  {theme === 'dark' && <CheckCircle2 className="w-4 h-4 text-developer-400" />}
                </div>
                <p className="text-2xs text-text-muted mt-0.5">
                  Obsidian glass &amp; radiant role accents
                </p>
              </div>
            </button>

            {/* Light Mode Card */}
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={cn(
                'flex items-center gap-3 p-4 rounded-xl border text-left transition-all',
                theme === 'light'
                  ? 'border-developer-500 bg-developer-500/10 shadow-sm ring-1 ring-developer-500'
                  : 'border-border-base bg-bg-surface hover:border-border-hover hover:bg-bg-elevated'
              )}
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-300 flex items-center justify-center text-amber-500 shadow-sm">
                <Sun className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-primary">Light Mode</span>
                  {theme === 'light' && <CheckCircle2 className="w-4 h-4 text-developer-400" />}
                </div>
                <p className="text-2xs text-text-muted mt-0.5">
                  Pristine studio slate &amp; clean contrast
                </p>
              </div>
            </button>

            {/* System Preference Card */}
            <button
              type="button"
              onClick={() => setTheme('system')}
              className={cn(
                'flex items-center gap-3 p-4 rounded-xl border text-left transition-all',
                theme === 'system'
                  ? 'border-developer-500 bg-developer-500/10 shadow-sm ring-1 ring-developer-500'
                  : 'border-border-base bg-bg-surface hover:border-border-hover hover:bg-bg-elevated'
              )}
            >
              <div className="w-10 h-10 rounded-xl bg-bg-elevated border border-border-base flex items-center justify-center text-cyan-400 shadow-sm">
                <Laptop className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-primary">System</span>
                  {theme === 'system' && <CheckCircle2 className="w-4 h-4 text-developer-400" />}
                </div>
                <p className="text-2xs text-text-muted mt-0.5">Syncs with OS dark/light setting</p>
              </div>
            </button>
          </div>
        </Card>
        {/* Git / Repo settings */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-border-base">
            <GitBranch className="w-5 h-5 text-text-primary" />
            <div>
              <h3 className="text-sm font-bold text-text-primary">
                Repository &amp; VCS Integration
              </h3>
              <p className="text-xs text-text-muted">
                Link repository for milestone tracking and commit association
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-secondary block">
              Default Repository URL
            </label>
            <input
              type="url"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              className="w-full bg-bg-base border border-border-base rounded-xl px-3.5 py-2 text-xs text-text-primary focus:outline-none"
            />
          </div>
        </Card>

        {/* Local AI Engine */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-border-base">
            <Bot className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-text-primary">
                Local AI Model &amp; Engine Configuration
              </h3>
              <p className="text-xs text-text-muted">
                Settings for structured proposal generation and architectural code assistance
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-secondary block">
                Local AI Endpoint
              </label>
              <input
                type="text"
                value={aiEndpoint}
                onChange={(e) => setAiEndpoint(e.target.value)}
                className="w-full bg-bg-base border border-border-base rounded-xl px-3.5 py-2 text-xs text-text-primary focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-secondary block">Model Name</label>
              <select
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value)}
                className="w-full bg-bg-base border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none"
              >
                <option value="smollm2:1.7b">SmolLM2-1.7B-Instruct (Recommended - Fast)</option>
                <option value="smollm2">SmolLM2:latest</option>
                <option value="hf.co/HuggingFaceTB/SmolLM2-1.7B-Instruct-GGUF">
                  SmolLM2-1.7B-Instruct (HF GGUF)
                </option>
                <option value="llama3.2:1b">Llama3.2:1B</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Notifications */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-border-base">
            <Bell className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-text-primary">
                Sprint Alerts &amp; Notifications
              </h3>
              <p className="text-xs text-text-muted">
                Control reminders for upcoming milestones and overdue tasks
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyMilestones}
                onChange={(e) => setNotifyMilestones(e.target.checked)}
                className="rounded text-developer-500 bg-bg-base border-border-base"
              />
              <span className="text-xs text-text-secondary">
                Alert 24 hours before milestone delivery deadline
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyTasks}
                onChange={(e) => setNotifyTasks(e.target.checked)}
                className="rounded text-developer-500 bg-bg-base border-border-base"
              />
              <span className="text-xs text-text-secondary">
                Notify when tasks in current sprint are marked overdue
              </span>
            </label>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            className="!bg-developer-500 hover:!bg-developer-600 shadow-glow-emerald"
            icon={<Save className="w-4 h-4" />}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
