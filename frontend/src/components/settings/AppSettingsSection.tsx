import React, { useState, useEffect } from 'react';
import {
  Palette,
  Sun,
  Moon,
  CheckCircle2,
  Clock,
  Calendar,
  Volume2,
  Sparkles,
  Download,
  Trash2,
  Database,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useTheme } from '../../contexts/ThemeContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { cn } from '../../utils/cn';

export interface AppSettingsData {
  timeFormat: '12h' | '24h';
  startOfWeek: 'monday' | 'sunday';
  soundEffects: boolean;
  celebrations: boolean;
  compactMode: boolean;
}

const DEFAULT_APP_SETTINGS: AppSettingsData = {
  timeFormat: '12h',
  startOfWeek: 'monday',
  soundEffects: true,
  celebrations: true,
  compactMode: false,
};

export function AppSettingsSection({
  onSettingsChange,
}: {
  onSettingsChange?: (settings: AppSettingsData) => void;
}) {
  const { theme, setTheme } = useTheme();
  const { showToast } = useWorkspace();
  const { user } = useAuth();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword.length > 72) {
      setPasswordError('Password must be at most 72 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await api.post('/auth/set-password', { new_password: newPassword });
      setPasswordSuccess('Password saved! You can now log in using your email and password.');
      showToast('Account password updated successfully!', 'success');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Failed to update password.';
      setPasswordError(msg);
      showToast(msg, 'error');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const [settings, setSettings] = useState<AppSettingsData>(() => {
    try {
      const saved = localStorage.getItem('mentoros_app_settings');
      return saved ? { ...DEFAULT_APP_SETTINGS, ...JSON.parse(saved) } : DEFAULT_APP_SETTINGS;
    } catch {
      return DEFAULT_APP_SETTINGS;
    }
  });

  useEffect(() => {
    localStorage.setItem('mentoros_app_settings', JSON.stringify(settings));
    onSettingsChange?.(settings);
  }, [settings, onSettingsChange]);

  const updateSetting = <K extends keyof AppSettingsData>(key: K, val: AppSettingsData[K]) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
  };

  const handleExportData = () => {
    try {
      const exportObject: Record<string, unknown> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('mentor') || key.startsWith('offline_'))) {
          exportObject[key] = localStorage.getItem(key);
        }
      }
      const dataStr =
        'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportObject, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute(
        'download',
        `mentoros_backup_${new Date().toISOString().slice(0, 10)}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('Workspace data exported successfully!', 'success');
    } catch {
      showToast('Unable to export workspace data', 'error');
    }
  };

  const handleClearCache = () => {
    try {
      // Clear offline keys only, preserve login token
      const token = localStorage.getItem('mentor_token');
      const user = localStorage.getItem('mentor_user');
      localStorage.clear();
      if (token) localStorage.setItem('mentor_token', token);
      if (user) localStorage.setItem('mentor_user', user);
      showToast('Offline cache cleared successfully', 'info');
    } catch {
      showToast('Failed to clear cache', 'error');
    }
  };

  return (
    <div className="space-y-4">
      {/* ─── Appearance & Theme Mode ─────────────────────────────── */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-border-base">
          <Palette className="w-5 h-5 text-orange-500" />
          <div>
            <h3 className="text-sm font-bold text-text-primary">Appearance &amp; Theme Mode</h3>
            <p className="text-xs text-text-muted">
              Select between light studio and dark obsidian mode
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Light Mode */}
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={cn(
              'flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer',
              theme === 'light'
                ? 'border-orange-500 bg-orange-500/10 shadow-sm ring-1 ring-orange-500'
                : 'border-border-base bg-bg-surface hover:border-orange-500/30 hover:bg-bg-elevated'
            )}
          >
            <div className="w-9 h-9 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-500 shadow-2xs">
              <Sun className="w-4 h-4 text-orange-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text-primary">Light Mode</span>
                {theme === 'light' && <CheckCircle2 className="w-4 h-4 text-orange-500" />}
              </div>
              <p className="text-2xs text-text-muted mt-0.5">
                Warm studio white with orange accents
              </p>
            </div>
          </button>

          {/* Dark Mode */}
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={cn(
              'flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer',
              theme === 'dark'
                ? 'border-orange-500 bg-orange-500/10 shadow-sm ring-1 ring-orange-500'
                : 'border-border-base bg-bg-surface hover:border-orange-500/30 hover:bg-bg-elevated'
            )}
          >
            <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-orange-400 shadow-2xs">
              <Moon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text-primary">Dark Mode</span>
                {theme === 'dark' && <CheckCircle2 className="w-4 h-4 text-orange-500" />}
              </div>
              <p className="text-2xs text-text-muted mt-0.5">
                Obsidian charcoal with glowing orange accents
              </p>
            </div>
          </button>
        </div>
      </Card>

      {/* ─── System & Workspace Preferences ──────────────────────── */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-border-base">
          <Clock className="w-5 h-5 text-orange-500" />
          <div>
            <h3 className="text-sm font-bold text-text-primary">
              Application &amp; Schedule Behavior
            </h3>
            <p className="text-xs text-text-muted">
              Configure system time formats, calendar week structure, and interaction feedback
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary block">Time Format</label>
            <select
              value={settings.timeFormat}
              onChange={(e) => updateSetting('timeFormat', e.target.value as '12h' | '24h')}
              className="w-full bg-bg-surface border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
            >
              <option value="12h">12-Hour (1:30 PM)</option>
              <option value="24h">24-Hour (13:30)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary block">
              First Day of the Week
            </label>
            <select
              value={settings.startOfWeek}
              onChange={(e) => updateSetting('startOfWeek', e.target.value as 'monday' | 'sunday')}
              className="w-full bg-bg-surface border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
            >
              <option value="monday">Monday (Standard Workweek)</option>
              <option value="sunday">Sunday</option>
            </select>
          </div>
        </div>

        <div className="pt-2 border-t border-border-base space-y-2.5">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.soundEffects}
              onChange={(e) => updateSetting('soundEffects', e.target.checked)}
              className="rounded text-orange-500 bg-bg-surface border-border-base focus:ring-orange-500"
            />
            <div className="text-xs">
              <span className="font-medium text-text-primary flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-orange-500" />
                Audio Completion Chimes
              </span>
              <p className="text-3xs text-text-muted">
                Play a subtle audio feedback cue when checking off tasks and deliverables
              </p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.celebrations}
              onChange={(e) => updateSetting('celebrations', e.target.checked)}
              className="rounded text-orange-500 bg-bg-surface border-border-base focus:ring-orange-500"
            />
            <div className="text-xs">
              <span className="font-medium text-text-primary flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                Milestone Celebration Confetti
              </span>
              <p className="text-3xs text-text-muted">
                Display a rewarding particle animation upon reaching milestone targets
              </p>
            </div>
          </label>
        </div>
      </Card>

      {/* ─── Data Management & Backups ────────────────────────────── */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-border-base">
          <Database className="w-5 h-5 text-orange-500" />
          <div>
            <h3 className="text-sm font-bold text-text-primary">Data Management &amp; Cache</h3>
            <p className="text-xs text-text-muted">
              Backup your workspace state or reset offline cached sessions
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-text-primary">Workspace Export &amp; Backup</p>
            <p className="text-3xs text-text-muted">
              Download complete workspace JSON archive for offline storage
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="xs"
            onClick={handleExportData}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export JSON Archive
          </Button>
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap pt-2 border-t border-border-base">
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-text-primary">Clear Local Cache</p>
            <p className="text-3xs text-text-muted">
              Clears cached temporary offline artifacts while preserving login session
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={handleClearCache}
            className="text-danger hover:text-danger hover:bg-danger/10"
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
          >
            Clear Cache
          </Button>
        </div>
      </Card>

      {/* ─── Account & Password Security ─────────────────────────── */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-border-base">
          <Lock className="w-5 h-5 text-accent-primary" />
          <div>
            <h3 className="text-sm font-bold text-text-primary">Account &amp; Password Security</h3>
            <p className="text-xs text-text-muted">
              Set or change a manual password to enable Email &amp; Password login
            </p>
          </div>
        </div>

        <div className="bg-bg-subtle/50 p-3 rounded-lg border border-border-base text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-text-muted">Account Email:</span>
            <span className="font-semibold text-text-primary">{user?.email || 'Current Account'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-muted">Google Sign-In:</span>
            <span className="text-emerald-500 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Active &amp; Linked
            </span>
          </div>
          <p className="text-3xs text-text-muted pt-1 border-t border-border-base">
            Setting a password allows you to sign in manually or via Google anytime.
          </p>
        </div>

        <form onSubmit={handleSetPassword} className="space-y-3 pt-1">
          {passwordSuccess && (
            <div className="p-2.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div className="p-2.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs">
              {passwordError}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-primary">
              New Password <span className="text-text-muted text-3xs">(min. 8 characters)</span>
            </label>
            <div className="relative">
              <input
                type={showNewPass ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full text-xs px-3 py-2 pr-9 rounded-md bg-bg-surface border border-border-base focus:outline-none focus:border-accent-primary text-text-primary placeholder:text-text-muted"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPass(!showNewPass)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                aria-label={showNewPass ? 'Hide password' : 'Show password'}
              >
                {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-primary">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPass ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full text-xs px-3 py-2 pr-9 rounded-md bg-bg-surface border border-border-base focus:outline-none focus:border-accent-primary text-text-primary placeholder:text-text-muted"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPass(!showConfirmPass)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                aria-label={showConfirmPass ? 'Hide password' : 'Show password'}
              >
                {showConfirmPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isUpdatingPassword || !newPassword || !confirmPassword}
              loading={isUpdatingPassword}
              leftIcon={<Lock className="w-3.5 h-3.5" />}
            >
              {isUpdatingPassword ? 'Saving Password...' : 'Save Password'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
