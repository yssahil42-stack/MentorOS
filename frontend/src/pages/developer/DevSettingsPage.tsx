import React, { useState, useEffect } from 'react';
import { Settings, Save, GitBranch, Bot, Bell, Cpu, Layers, Terminal } from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { AppSettingsSection } from '../../components/settings/AppSettingsSection';
import { api } from '../../services/api';

export default function DevSettingsPage() {
  const { showToast } = useWorkspace();
  const { user, refreshUser } = useAuth();

  const [gitProvider, setGitProvider] = useState('GitHub');
  const [defaultBranch, setDefaultBranch] = useState('main');
  const [conventionalCommits, setConventionalCommits] = useState(true);
  const [autoBranchNaming, setAutoBranchNaming] = useState(true);

  const [aiEndpoint, setAiEndpoint] = useState('http://localhost:11434');
  const [aiModel, setAiModel] = useState('smollm2:1.7b');
  const [codeReviewDepth, setCodeReviewDepth] = useState('detailed');
  const [autoTestScaffolding, setAutoTestScaffolding] = useState(true);

  const [sprintCadence, setSprintCadence] = useState('2-weeks');
  const [estimationScale, setEstimationScale] = useState('fibonacci');
  const [wipLimit, setWipLimit] = useState('4');

  const [notifyFailedPipelines, setNotifyFailedPipelines] = useState(true);
  const [dailyStandupDigest, setDailyStandupDigest] = useState(true);

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`mentoros_settings_developer_${user?.id ?? 'guest'}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.gitProvider) setGitProvider(parsed.gitProvider);
        if (parsed.defaultBranch) setDefaultBranch(parsed.defaultBranch);
        if (parsed.conventionalCommits !== undefined)
          setConventionalCommits(parsed.conventionalCommits);
        if (parsed.autoBranchNaming !== undefined) setAutoBranchNaming(parsed.autoBranchNaming);
        if (parsed.aiEndpoint) setAiEndpoint(parsed.aiEndpoint);
        if (parsed.aiModel) setAiModel(parsed.aiModel);
        if (parsed.codeReviewDepth) setCodeReviewDepth(parsed.codeReviewDepth);
        if (parsed.autoTestScaffolding !== undefined)
          setAutoTestScaffolding(parsed.autoTestScaffolding);
        if (parsed.sprintCadence) setSprintCadence(parsed.sprintCadence);
        if (parsed.estimationScale) setEstimationScale(parsed.estimationScale);
        if (parsed.wipLimit) setWipLimit(parsed.wipLimit);
        if (parsed.notifyFailedPipelines !== undefined)
          setNotifyFailedPipelines(parsed.notifyFailedPipelines);
        if (parsed.dailyStandupDigest !== undefined)
          setDailyStandupDigest(parsed.dailyStandupDigest);
      }
    } catch {
      // ignore
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const payload = {
      gitProvider,
      defaultBranch,
      conventionalCommits,
      autoBranchNaming,
      aiEndpoint,
      aiModel,
      codeReviewDepth,
      autoTestScaffolding,
      sprintCadence,
      estimationScale,
      wipLimit,
      notifyFailedPipelines,
      dailyStandupDigest,
    };

    try {
      localStorage.setItem(
        `mentoros_settings_developer_${user?.id ?? 'guest'}`,
        JSON.stringify(payload)
      );
      try {
        await api.patch('/auth/me/onboarding', {
          profile_data: {
            ...((user?.profile_data as Record<string, unknown>) || {}),
            developer_settings: payload,
          },
        });
        if (refreshUser) await refreshUser();
      } catch {
        // offline fallback
      }
      showToast('Developer workspace settings saved successfully!', 'success');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500 border border-orange-500/20">
            <Settings className="w-5 h-5 text-orange-500" />
          </span>
          <span className="text-xs font-mono font-bold text-orange-600 dark:text-orange-400">
            DEVELOPER WORKSPACE CONFIGURATION
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary mt-1">
          Developer Settings
        </h1>
        <p className="text-xs md:text-sm text-text-muted">
          Configure Git repository defaults, local AI runtime, sprint cadences, CI/CD alerts, and
          system environment.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Version Control & Git Repositories */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-border-base">
            <GitBranch className="w-5 h-5 text-orange-500" />
            <div>
              <h3 className="text-sm font-bold text-text-primary">
                Version Control &amp; Git Integration
              </h3>
              <p className="text-xs text-text-muted">
                Branch conventions, issue linking, and commit standards for codebases
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary block">
                Primary Git Hosting Service
              </label>
              <select
                value={gitProvider}
                onChange={(e) => setGitProvider(e.target.value)}
                className="w-full bg-bg-surface border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
              >
                <option value="GitHub">GitHub</option>
                <option value="GitLab">GitLab</option>
                <option value="Bitbucket">Bitbucket</option>
                <option value="Self-Hosted">Self-Hosted Gitea / Forge</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary block">
                Default Production Branch
              </label>
              <input
                type="text"
                value={defaultBranch}
                onChange={(e) => setDefaultBranch(e.target.value)}
                placeholder="main"
                className="w-full bg-bg-surface border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-border-base space-y-2.5">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={conventionalCommits}
                onChange={(e) => setConventionalCommits(e.target.checked)}
                className="rounded text-orange-500 bg-bg-surface border-border-base focus:ring-orange-500"
              />
              <div className="text-xs">
                <span className="font-medium text-text-primary">
                  Enforce Conventional Commit Prefixes
                </span>
                <p className="text-3xs text-text-muted">
                  Requires feat:, fix:, chore:, docs:, or refactor: syntax in suggested commits
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={autoBranchNaming}
                onChange={(e) => setAutoBranchNaming(e.target.checked)}
                className="rounded text-orange-500 bg-bg-surface border-border-base focus:ring-orange-500"
              />
              <div className="text-xs">
                <span className="font-medium text-text-primary">
                  Auto-generate Git Branch Slug from Tasks
                </span>
                <p className="text-3xs text-text-muted">
                  Generates clean branch suggestions e.g. feat/usr-42-auth-guard
                </p>
              </div>
            </label>
          </div>
        </Card>

        {/* Local AI Engine & Inference */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-border-base">
            <Bot className="w-5 h-5 text-orange-500" />
            <div>
              <h3 className="text-sm font-bold text-text-primary">
                AI Copilot &amp; Local Inference Engine
              </h3>
              <p className="text-xs text-text-muted">
                Configures local Ollama / vLLM endpoints and code proposal intelligence
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary block">
                Local AI Engine Endpoint URL
              </label>
              <input
                type="text"
                value={aiEndpoint}
                onChange={(e) => setAiEndpoint(e.target.value)}
                placeholder="http://localhost:11434"
                className="w-full bg-bg-surface border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary block">
                Active Code Generation Model
              </label>
              <select
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value)}
                className="w-full bg-bg-surface border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-mono"
              >
                <option value="smollm2:1.7b">smollm2:1.7b (Lightweight Fast)</option>
                <option value="deepseek-coder:6.7b">deepseek-coder:6.7b (Precise Code)</option>
                <option value="codellama:7b">codellama:7b</option>
                <option value="llama3.2:3b">llama3.2:3b (General Reasoning)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary block">
                Code Review Suggestion Depth
              </label>
              <select
                value={codeReviewDepth}
                onChange={(e) => setCodeReviewDepth(e.target.value)}
                className="w-full bg-bg-surface border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
              >
                <option value="concise">Concise (Actionable fixes only)</option>
                <option value="detailed">
                  Detailed (Architectural &amp; Performance analysis)
                </option>
                <option value="security">Security-First (OWASP &amp; Vulnerability audit)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary block">
                Task Unit Test Suggestions
              </label>
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoTestScaffolding}
                    onChange={(e) => setAutoTestScaffolding(e.target.checked)}
                    className="rounded text-orange-500 bg-bg-surface border-border-base focus:ring-orange-500"
                  />
                  <span className="text-xs text-text-primary">
                    Auto-generate Vitest / Jest test shells
                  </span>
                </label>
              </div>
            </div>
          </div>
        </Card>

        {/* Agile Sprints & Velocity */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-border-base">
            <Layers className="w-5 h-5 text-orange-500" />
            <div>
              <h3 className="text-sm font-bold text-text-primary">
                Sprint Cycles &amp; Issue Velocity
              </h3>
              <p className="text-xs text-text-muted">
                Cadence schedules, story point estimation scales, and work-in-progress guards
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary block">
                Sprint Cadence Duration
              </label>
              <select
                value={sprintCadence}
                onChange={(e) => setSprintCadence(e.target.value)}
                className="w-full bg-bg-surface border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
              >
                <option value="1-week">1 Week Sprints</option>
                <option value="2-weeks">2 Weeks Sprints (Standard)</option>
                <option value="monthly">Monthly Milestones</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary block">
                Story Point Estimation
              </label>
              <select
                value={estimationScale}
                onChange={(e) => setEstimationScale(e.target.value)}
                className="w-full bg-bg-surface border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
              >
                <option value="fibonacci">Fibonacci (1, 2, 3, 5, 8)</option>
                <option value="linear">Linear (1, 2, 3, 4, 5)</option>
                <option value="tshirt">T-Shirt (S, M, L, XL)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary block">
                Max WIP Tasks per Engineer
              </label>
              <input
                type="number"
                value={wipLimit}
                onChange={(e) => setWipLimit(e.target.value)}
                placeholder="4"
                className="w-full bg-bg-surface border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
              />
            </div>
          </div>
        </Card>

        {/* Global Application & System Settings */}
        <AppSettingsSection />

        {/* Save Bar */}
        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            variant="primary"
            disabled={isSaving}
            className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white shadow-sm font-semibold"
            leftIcon={<Save className="w-4 h-4" />}
          >
            {isSaving ? 'Saving Settings...' : 'Save Developer Settings'}
          </Button>
        </div>
      </form>
    </div>
  );
}
