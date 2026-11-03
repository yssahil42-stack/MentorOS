import React, { useState } from 'react';
import {
  Settings,
  Save,
  Briefcase,
  Bell,
  Sun,
  Moon,
  Palette,
  CheckCircle2,
  DollarSign,
} from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { cn } from '../../utils/cn';

export default function FreelancerSettingsPage() {
  const { showToast } = useWorkspace();
  const { theme, setTheme } = useTheme();

  const [hourlyRate, setHourlyRate] = useState('85');
  const [currency, setCurrency] = useState('USD');
  const [notifyMilestones, setNotifyMilestones] = useState(true);
  const [notifyInvoices, setNotifyInvoices] = useState(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Freelancer workspace settings saved!', 'success');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-freelancer-500/20 text-freelancer-500">
            <Settings className="w-5 h-5" />
          </span>
          <span className="text-xs font-mono font-semibold text-freelancer-500">
            FREELANCER CONFIGURATION
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary mt-1">
          Freelance Settings
        </h1>
        <p className="text-xs md:text-sm text-text-muted">
          Configure Appearance, hourly rates, client milestone notifications, and invoice tracking.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Appearance & Theme Setting */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-border-base">
            <Palette className="w-5 h-5 text-freelancer-500" />
            <div>
              <h3 className="text-sm font-bold text-text-primary">Appearance &amp; Theme Mode</h3>
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
                  ? 'border-freelancer-500 bg-freelancer-500/10 shadow-sm ring-1 ring-freelancer-500'
                  : 'border-border-base bg-bg-surface hover:border-border-hover hover:bg-bg-elevated'
              )}
            >
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-indigo-400 shadow-sm">
                <Moon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-primary">Dark Mode</span>
                  {theme === 'dark' && <CheckCircle2 className="w-4 h-4 text-freelancer-500" />}
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
                  ? 'border-freelancer-500 bg-freelancer-500/10 shadow-sm ring-1 ring-freelancer-500'
                  : 'border-border-base bg-bg-surface hover:border-border-hover hover:bg-bg-elevated'
              )}
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-300 flex items-center justify-center text-amber-500 shadow-sm">
                <Sun className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-primary">Light Mode</span>
                  {theme === 'light' && <CheckCircle2 className="w-4 h-4 text-freelancer-500" />}
                </div>
                <p className="text-2xs text-text-muted mt-0.5">
                  Pristine studio slate &amp; clean contrast
                </p>
              </div>
            </button>
          </div>
        </Card>

        {/* Rate & Currency */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-border-base">
            <DollarSign className="w-5 h-5 text-freelancer-500" />
            <div>
              <h3 className="text-sm font-bold text-text-primary">Billing &amp; Target Rates</h3>
              <p className="text-xs text-text-muted">
                Used for time scoping estimates and project revenue forecasts
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-secondary block">
                Standard Hourly Rate
              </label>
              <input
                type="number"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                className="w-full bg-bg-surface border border-border-base rounded-xl px-3.5 py-2 text-xs text-text-primary focus:outline-none focus:border-freelancer-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-secondary block">
                Primary Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-bg-surface border border-border-base rounded-xl px-3.5 py-2 text-xs text-text-primary focus:outline-none focus:border-freelancer-500"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="INR">INR (₹)</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Alerts & Notifications */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-border-base">
            <Bell className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="text-sm font-bold text-text-primary">Client &amp; Milestone Alerts</h3>
              <p className="text-xs text-text-muted">
                Keep client deliveries on track and get notified of pending reviews
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyMilestones}
                onChange={(e) => setNotifyMilestones(e.target.checked)}
                className="rounded text-freelancer-500 bg-bg-surface border-border-base"
              />
              <span className="text-xs text-text-secondary">
                Alert 24 hours before milestone delivery deadline
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyInvoices}
                onChange={(e) => setNotifyInvoices(e.target.checked)}
                className="rounded text-freelancer-500 bg-bg-surface border-border-base"
              />
              <span className="text-xs text-text-secondary">
                Notify when client review comments or deliverables require sign-off
              </span>
            </label>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            className="!bg-freelancer-500 hover:!bg-freelancer-600 shadow-glow-violet"
            icon={<Save className="w-4 h-4" />}
          >
            Save Freelancer Settings
          </Button>
        </div>
      </form>
    </div>
  );
}
