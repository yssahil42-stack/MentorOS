import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  Search,
  Briefcase,
  Target,
  FileText,
  Calendar,
  DollarSign,
  Bell,
} from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { AppSettingsSection } from '../../components/settings/AppSettingsSection';
import { api } from '../../services/api';

export default function JobSettingsPage() {
  const { showToast } = useWorkspace();
  const { user, refreshUser } = useAuth();

  const [targetRole, setTargetRole] = useState('Senior Full Stack Engineer');
  const [targetIndustries, setTargetIndustries] = useState('SaaS, AI Tools, FinTech');
  const [preferredLocation, setPreferredLocation] = useState('Remote Only');
  const [targetSalary, setTargetSalary] = useState('140,000');
  const [currency, setCurrency] = useState('USD');

  const [weeklyApplicationGoal, setWeeklyApplicationGoal] = useState('5');
  const [followupDays, setFollowupDays] = useState('7');
  const [staleTimeoutDays, setStaleTimeoutDays] = useState('14');

  const [resumeVersion, setResumeVersion] = useState('Alex_Senior_Engineer_2026_v3.pdf');
  const [autoTailorCoverLetters, setAutoTailorCoverLetters] = useState(true);
  const [notifyInterviews, setNotifyInterviews] = useState(true);
  const [notifyFollowups, setNotifyFollowups] = useState(true);

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`mentoros_settings_jobseeker_${user?.id ?? 'guest'}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.targetRole) setTargetRole(parsed.targetRole);
        if (parsed.targetIndustries) setTargetIndustries(parsed.targetIndustries);
        if (parsed.preferredLocation) setPreferredLocation(parsed.preferredLocation);
        if (parsed.targetSalary) setTargetSalary(parsed.targetSalary);
        if (parsed.currency) setCurrency(parsed.currency);
        if (parsed.weeklyApplicationGoal) setWeeklyApplicationGoal(parsed.weeklyApplicationGoal);
        if (parsed.followupDays) setFollowupDays(parsed.followupDays);
        if (parsed.staleTimeoutDays) setStaleTimeoutDays(parsed.staleTimeoutDays);
        if (parsed.resumeVersion) setResumeVersion(parsed.resumeVersion);
        if (parsed.autoTailorCoverLetters !== undefined)
          setAutoTailorCoverLetters(parsed.autoTailorCoverLetters);
        if (parsed.notifyInterviews !== undefined) setNotifyInterviews(parsed.notifyInterviews);
        if (parsed.notifyFollowups !== undefined) setNotifyFollowups(parsed.notifyFollowups);
      }
    } catch {
      // ignore
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const payload = {
      targetRole,
      targetIndustries,
      preferredLocation,
      targetSalary,
      currency,
      weeklyApplicationGoal,
      followupDays,
      staleTimeoutDays,
      resumeVersion,
      autoTailorCoverLetters,
      notifyInterviews,
      notifyFollowups,
    };

    try {
      localStorage.setItem(
        `mentoros_settings_jobseeker_${user?.id ?? 'guest'}`,
        JSON.stringify(payload)
      );
      try {
        await api.patch('/auth/me/onboarding', {
          profile_data: {
            ...((user?.profile_data as Record<string, unknown>) || {}),
            job_seeker_settings: payload,
          },
        });
        if (refreshUser) await refreshUser();
      } catch {
        // offline fallback
      }
      showToast('Career search settings saved successfully!', 'success');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in pb-16 px-1 sm:px-4">
      {/* ─── Main White Container Card Matching Notes & Dashboard ─── */}
      <div className="bg-white dark:bg-[#161922] rounded-3xl border border-[#eee7e0] dark:border-stone-800/80 p-5 sm:p-8 space-y-6 shadow-xs">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
              Career search settings
            </h1>
            <p className="text-xs text-text-secondary mt-1 font-medium">
              Configure target roles, weekly application quotas, follow-up cadences, and interview preparation preferences.
            </p>
          </div>
          <button
            type="submit"
            form="job-settings-form"
            disabled={isSaving}
            className="h-10 px-5 rounded-xl bg-[#c04b1e] hover:bg-[#a33d16] text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-all active:translate-y-[1px] cursor-pointer self-start sm:self-auto"
          >
            <Save className="w-4 h-4 stroke-[2.5]" />
            <span>{isSaving ? 'Saving...' : 'Save settings'}</span>
          </button>
        </div>

        <form id="job-settings-form" onSubmit={handleSave} className="space-y-6">
        {/* Target Roles & Search Scope */}
        <div className="p-5 sm:p-6 rounded-2xl border border-border-base/90 bg-[#faf8f5]/60 dark:bg-stone-900/40 space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-border-base">
            <Target className="w-5 h-5 text-[#c04b1e]" />
            <div>
              <h3 className="text-sm font-bold text-text-primary">
                Target Roles &amp; Compensation Range
              </h3>
              <p className="text-xs text-text-muted">
                Drives pipeline matching, company scoping, and negotiation readiness
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary block">
                Target Job Title(s)
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Senior Full Stack Engineer"
                className="w-full bg-bg-surface border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-[#c04b1e] focus:ring-2 focus:ring-[#c04b1e]/20 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary block">
                Target Industry Verticals
              </label>
              <input
                type="text"
                value={targetIndustries}
                onChange={(e) => setTargetIndustries(e.target.value)}
                placeholder="e.g. SaaS, AI Tools, FinTech"
                className="w-full bg-bg-surface border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-[#c04b1e] focus:ring-2 focus:ring-[#c04b1e]/20 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary block">
                Workplace Arrangement
              </label>
              <select
                value={preferredLocation}
                onChange={(e) => setPreferredLocation(e.target.value)}
                className="w-full bg-bg-surface border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-[#c04b1e] focus:ring-2 focus:ring-[#c04b1e]/20 transition-all"
              >
                <option value="Remote Only">Remote Only</option>
                <option value="Hybrid">Hybrid</option>
                <option value="On-Site">On-Site</option>
                <option value="Open to Relocation">Open to Relocation</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary block">
                Target Annual Base Compensation ({currency})
              </label>
              <div className="flex gap-2">
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-24 bg-bg-surface border border-border-base rounded-xl px-2 py-2 text-xs text-text-primary focus:outline-none focus:border-[#c04b1e] focus:ring-2 focus:ring-[#c04b1e]/20 transition-all"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="CAD">CAD</option>
                  <option value="INR">INR</option>
                </select>
                <input
                  type="text"
                  value={targetSalary}
                  onChange={(e) => setTargetSalary(e.target.value)}
                  placeholder="140,000"
                  className="flex-1 bg-bg-surface border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-[#c04b1e] focus:ring-2 focus:ring-[#c04b1e]/20 transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Pipeline & Application Tracking Cadence */}
        <div className="p-5 sm:p-6 rounded-2xl border border-border-base/90 bg-[#faf8f5]/60 dark:bg-stone-900/40 space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-border-base">
            <Briefcase className="w-5 h-5 text-[#c04b1e]" />
            <div>
              <h3 className="text-sm font-bold text-text-primary">
                Application Pipeline &amp; Outreach Quotas
              </h3>
              <p className="text-xs text-text-muted">
                Maintain steady application velocity, recruiter follow-up intervals, and interview
                prep
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary block">
                Weekly Target Applications
              </label>
              <input
                type="number"
                value={weeklyApplicationGoal}
                onChange={(e) => setWeeklyApplicationGoal(e.target.value)}
                placeholder="5"
                className="w-full bg-bg-surface border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-[#c04b1e] focus:ring-2 focus:ring-[#c04b1e]/20 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary block">
                Recruiter Follow-up Cadence
              </label>
              <select
                value={followupDays}
                onChange={(e) => setFollowupDays(e.target.value)}
                className="w-full bg-bg-surface border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-[#c04b1e] focus:ring-2 focus:ring-[#c04b1e]/20 transition-all"
              >
                <option value="5">5 Business Days</option>
                <option value="7">7 Days (Standard)</option>
                <option value="10">10 Days</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary block">
                Ghosting / Stale Timeout
              </label>
              <select
                value={staleTimeoutDays}
                onChange={(e) => setStaleTimeoutDays(e.target.value)}
                className="w-full bg-bg-surface border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-[#c04b1e] focus:ring-2 focus:ring-[#c04b1e]/20 transition-all"
              >
                <option value="10">10 Days Inactive</option>
                <option value="14">14 Days Inactive</option>
                <option value="21">21 Days Inactive</option>
              </select>
            </div>
          </div>

          <div className="pt-2 border-t border-border-base space-y-2.5">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyInterviews}
                onChange={(e) => setNotifyInterviews(e.target.checked)}
                className="rounded text-[#c04b1e] bg-bg-surface border-border-base focus:ring-[#c04b1e]"
              />
              <div className="text-xs">
                <span className="font-medium text-text-primary">
                  Interview Reminders &amp; Prep Prompts
                </span>
                <p className="text-3xs text-text-muted">
                  Sends preparation briefings 24 hours prior to scheduled recruiter and technical
                  rounds
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyFollowups}
                onChange={(e) => setNotifyFollowups(e.target.checked)}
                className="rounded text-[#c04b1e] bg-bg-surface border-border-base focus:ring-[#c04b1e]"
              />
              <div className="text-xs">
                <span className="font-medium text-text-primary">Outreach Follow-up Reminders</span>
                <p className="text-3xs text-text-muted">
                  Alerts when pending applications pass the follow-up threshold without response
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Resume & Portfolio Artifacts */}
        <div className="p-5 sm:p-6 rounded-2xl border border-border-base/90 bg-[#faf8f5]/60 dark:bg-stone-900/40 space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-border-base">
            <FileText className="w-5 h-5 text-[#c04b1e]" />
            <div>
              <h3 className="text-sm font-bold text-text-primary">
                Resume &amp; Portfolio Versioning
              </h3>
              <p className="text-xs text-text-muted">
                Default resume tracking and AI cover letter drafting assistants
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary block">
                Primary Master Resume Version Label
              </label>
              <input
                type="text"
                value={resumeVersion}
                onChange={(e) => setResumeVersion(e.target.value)}
                placeholder="e.g. Alex_Senior_Engineer_2026_v3.pdf"
                className="w-full bg-bg-surface border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-[#c04b1e] focus:ring-2 focus:ring-[#c04b1e]/20 transition-all font-mono"
              />
            </div>

            <div className="pt-2 border-t border-border-base">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoTailorCoverLetters}
                  onChange={(e) => setAutoTailorCoverLetters(e.target.checked)}
                  className="rounded text-[#c04b1e] bg-bg-surface border-border-base focus:ring-[#c04b1e]"
                />
                <div className="text-xs">
                  <span className="font-medium text-text-primary">
                    AI Tailored Cover Letter Talking Points
                  </span>
                  <p className="text-3xs text-text-muted">
                    Automatically generates tailored matching bullet points when saving new job
                    listings
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Global Application & System Settings */}
        <AppSettingsSection />

        {/* Save Bar */}
        <div className="flex justify-end pt-4 border-t border-border-base/60">
          <button
            type="submit"
            disabled={isSaving}
            className="h-10 px-5 rounded-xl bg-[#c04b1e] hover:bg-[#a33d16] text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-all active:translate-y-[1px] cursor-pointer"
          >
            <Save className="w-4 h-4 stroke-[2.5]" />
            <span>{isSaving ? 'Saving...' : 'Save settings'}</span>
          </button>
        </div>
      </form>
      </div>
    </div>
  );
}
