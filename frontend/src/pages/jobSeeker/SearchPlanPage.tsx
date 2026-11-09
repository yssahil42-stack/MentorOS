import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Target,
  Briefcase,
  Code2,
  ArrowRight,
  Clock,
  Plus,
  X,
  Zap,
  Copy,
  Check,
  BookOpen,
  Filter,
} from 'lucide-react';
import {
  POPULAR_ROLE_PRESETS,
  analyzeJobRole,
} from '../../services/jobAnalyzerService';
import type {
  SeniorityLevel,
  JobAnalysisResult,
  RolePreset,
} from '../../types/jobAnalyzer';
import { useWorkspace } from '../../contexts/WorkspaceContext';

export default function SearchPlanPage() {
  const navigate = useNavigate();
  const { showToast } = useWorkspace();

  // State
  const [selectedPresetId, setSelectedPresetId] = useState<string>('data-analyst');
  const [targetRole, setTargetRole] = useState<string>('Data Analyst');
  const [seniority, setSeniority] = useState<SeniorityLevel>('fresher');
  const [locationPreference, setLocationPreference] = useState<string>('Remote');
  const [userSkills, setUserSkills] = useState<string[]>([
    'Python',
    'Excel',
    'Pandas',
    'Basic Statistics',
  ]);
  const [newSkillInput, setNewSkillInput] = useState<string>('');
  const [jobDescription, setJobDescription] = useState<string>('');
  const [showJdInput, setShowJdInput] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'skills' | 'where_to_apply' | 'mentor_opinion'>('skills');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Load user skills from localStorage / profile on initial mount
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('mentor_user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        const roleData = parsed.profile_data?.job_seeker;
        if (roleData?.target_role && !targetRole) {
          setTargetRole(roleData.target_role);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Handle Preset Selection
  const handleSelectPreset = (preset: RolePreset) => {
    setSelectedPresetId(preset.id);
    setTargetRole(preset.role);
    // Provide a realistic starting skill set if user hasn't heavily customized
    if (preset.id === 'data-analyst') {
      setUserSkills(['Python', 'Excel', 'Pandas', 'Basic Statistics']);
    } else if (preset.id === 'frontend-dev') {
      setUserSkills(['JavaScript', 'HTML5', 'CSS', 'React Basics']);
    } else if (preset.id === 'fullstack-eng') {
      setUserSkills(['JavaScript', 'Node.js', 'React', 'Git']);
    } else {
      setUserSkills(preset.suggestedSkills.slice(0, 3));
    }
  };

  // Add a skill
  const handleAddSkill = (skillToAdd?: string) => {
    const raw = skillToAdd !== undefined ? skillToAdd : newSkillInput;
    const clean = raw.trim();
    if (!clean) return;

    if (!userSkills.some((s) => s.toLowerCase() === clean.toLowerCase())) {
      setUserSkills((prev) => [...prev, clean]);
      showToast(`Added skill "${clean}"`, 'success');
    } else {
      showToast(`"${clean}" is already in your skills`, 'info');
    }
    if (skillToAdd === undefined) {
      setNewSkillInput('');
    }
  };

  // Remove a skill
  const handleRemoveSkill = (skillToRemove: string) => {
    setUserSkills((prev) => prev.filter((s) => s !== skillToRemove));
  };

  // 1-Click Sync from Profile / Resume
  const handleSyncProfile = () => {
    try {
      const storedUser = localStorage.getItem('mentor_user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        const devSkills = parsed.profile_data?.developer?.tech_stack;
        if (devSkills && typeof devSkills === 'string') {
          const split = devSkills.split(',').map((s: string) => s.trim()).filter(Boolean);
          setUserSkills((prev) => Array.from(new Set([...prev, ...split])));
          showToast(`Synced ${split.length} skills from your profile`, 'success');
          return;
        }
      }
      showToast('Loaded standard role baseline skills', 'info');
    } catch {
      showToast('Unable to load profile data', 'error');
    }
  };

  // Run analysis calculation
  const analysisResult: JobAnalysisResult = useMemo(() => {
    return analyzeJobRole({
      targetRole,
      seniority,
      userSkills,
      jobDescription: jobDescription.trim() || undefined,
      locationPreference,
    });
  }, [targetRole, seniority, userSkills, jobDescription, locationPreference]);

  // Current preset's suggested skills that user hasn't added yet
  const unaddedSuggestedSkills = useMemo(() => {
    const preset = POPULAR_ROLE_PRESETS.find((p) => p.id === selectedPresetId);
    if (!preset) return [];
    return preset.suggestedSkills.filter(
      (s) => !userSkills.some((u) => u.toLowerCase() === s.toLowerCase())
    );
  }, [selectedPresetId, userSkills]);

  // Copy Mentor Strategy to clipboard
  const handleCopyStrategy = () => {
    const content = `### MentorOS Job Analysis & Strategy for ${analysisResult.targetRole} (${analysisResult.seniority.toUpperCase()})
Readiness Score: ${analysisResult.readinessScore}% - ${analysisResult.mentorOpinion.overallVerdict}

#### Executive Mentor Verdict:
${analysisResult.mentorOpinion.executiveSummary}

#### Strengths to Pitch:
${analysisResult.mentorOpinion.strengthsSummary}

#### Biggest Blocker to Overcome:
${analysisResult.mentorOpinion.biggestBlocker}

#### Top Recommended Portfolio Deliverable:
${analysisResult.mentorOpinion.portfolioAdvice}

#### 30-Day Strategic Action Plan:
${analysisResult.mentorOpinion.strategicActionPlan
  .map(
    (phase) =>
      `* **${phase.phase} (${phase.timeline}): ${phase.title}**\n${phase.tasks
        .map((t) => `  - ${t}`)
        .join('\n')}`
  )
  .join('\n\n')}
`;
    navigator.clipboard.writeText(content);
    setIsCopied(true);
    showToast('Mentor strategy copied to clipboard!', 'success');
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">Job Analyzer</h1>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              AI Market Intelligence
            </span>
          </div>
          <p className="text-sm text-text-muted mt-1 max-w-3xl">
            Target any role (e.g. <strong>Data Analyst</strong>) to pinpoint your exact skill match, uncover critical gaps, discover where to apply, and receive personalized senior mentor strategic advice.
          </p>
        </div>

        {/* Action Shortcuts */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/app/job-seeker/resume-generator')}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-surface border border-border-subtle text-text-primary hover:bg-surface-elevated transition-colors shadow-sm flex items-center gap-1.5"
            title="Open Resume Tailor with this role"
          >
            <Briefcase className="w-3.5 h-3.5 text-emerald-500" />
            Resume Tailor
          </button>
          <button
            onClick={() => navigate('/app/job-seeker/applications')}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-surface border border-border-subtle text-text-primary hover:bg-surface-elevated transition-colors shadow-sm flex items-center gap-1.5"
            title="Open Application Tracker"
          >
            <Target className="w-3.5 h-3.5 text-blue-500" />
            Applications Tracker
          </button>
        </div>
      </div>

      {/* Target Role & Skills Configuration Card */}
      <div className="card p-5 bg-surface border border-border-subtle shadow-sm rounded-xl space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
            <Filter className="w-4 h-4 text-emerald-500" />
            Configure Target Job & Your Profile
          </h2>
          <button
            onClick={handleSyncProfile}
            className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            <Zap className="w-3.5 h-3.5" />
            Sync From Profile
          </button>
        </div>

        {/* Popular Presets Bar */}
        <div>
          <label className="text-xs font-medium text-text-muted block mb-2">
            Quick Select Target Career:
          </label>
          <div className="flex flex-wrap gap-2">
            {POPULAR_ROLE_PRESETS.map((preset) => {
              const isSelected = selectedPresetId === preset.id;
              const isDataAnalyst = preset.id === 'data-analyst';
              return (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/30'
                      : 'bg-surface-elevated hover:bg-border-subtle text-text-primary border border-border-subtle'
                  }`}
                >
                  {preset.label}
                  {isDataAnalyst && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                      isSelected ? 'bg-emerald-800 text-emerald-100' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                    }`}>
                      Featured
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Role, Seniority, and Location Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div>
            <label className="text-xs font-medium text-text-muted block mb-1">
              Target Job Title
            </label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Data Analyst, Frontend Engineer..."
              className="w-full px-3 py-2 text-sm rounded-lg bg-surface-elevated border border-border-subtle text-text-primary focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-text-muted block mb-1">
              Experience Level
            </label>
            <select
              value={seniority}
              onChange={(e) => setSeniority(e.target.value as SeniorityLevel)}
              className="w-full px-3 py-2 text-sm rounded-lg bg-surface-elevated border border-border-subtle text-text-primary focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="fresher">Fresher / Student (0-1 yrs)</option>
              <option value="junior">Junior Analyst / Dev (1-2 yrs)</option>
              <option value="mid">Mid-Level (2-4 yrs)</option>
              <option value="senior">Senior (5+ yrs)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-text-muted block mb-1">
              Location / Mode
            </label>
            <select
              value={locationPreference}
              onChange={(e) => setLocationPreference(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg bg-surface-elevated border border-border-subtle text-text-primary focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Remote">Remote Only</option>
              <option value="Hybrid">Hybrid</option>
              <option value="On-site">On-site</option>
              <option value="Global">Worldwide / Any</option>
            </select>
          </div>
        </div>

        {/* User Skills Management */}
        <div className="space-y-2 pt-2 border-t border-border-subtle">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-text-muted">
              Your Current Skills ({userSkills.length})
            </label>
            <span className="text-[11px] text-text-faint">
              Add skills you know to calculate real-time gaps
            </span>
          </div>

          {/* Current Skills Chips */}
          <div className="flex flex-wrap gap-1.5 min-h-[38px] p-2.5 rounded-lg bg-surface-elevated border border-border-subtle">
            {userSkills.length === 0 ? (
              <span className="text-xs text-text-faint italic py-1">No skills added yet. Type below or select suggested skills.</span>
            ) : (
              userSkills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                >
                  {skill}
                  <button
                    onClick={() => handleRemoveSkill(skill)}
                    className="hover:text-red-500 p-0.5 rounded transition-colors"
                    title={`Remove ${skill}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))
            )}
          </div>

          {/* Add Skill Input & Suggested Chips */}
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                placeholder="Type a skill and press Enter (e.g. SQL, Power BI, Python, Excel)..."
                className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-surface-elevated border border-border-subtle text-text-primary focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                onClick={() => handleAddSkill()}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Skill
              </button>
            </div>
          </div>

          {/* Suggested Skills for Role */}
          {unaddedSuggestedSkills.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px] text-text-muted">
              <span>Suggested for {targetRole}:</span>
              {unaddedSuggestedSkills.map((suggested) => (
                <button
                  key={suggested}
                  onClick={() => handleAddSkill(suggested)}
                  className="px-2 py-0.5 rounded text-[11px] font-medium bg-surface hover:bg-emerald-500/10 hover:text-emerald-600 border border-border-subtle text-text-secondary transition-colors flex items-center gap-1"
                >
                  <Plus className="w-2.5 h-2.5 text-emerald-500" />
                  {suggested}
                </button>
              ))}
            </div>
          )}

          {/* Optional Job Description Toggle */}
          <div className="pt-2">
            <button
              onClick={() => setShowJdInput(!showJdInput)}
              className="text-xs text-text-muted hover:text-text-primary flex items-center gap-1 underline"
            >
              {showJdInput ? '− Hide Job Description' : '+ Paste Target Job Description (Optional for custom matching)'}
            </button>
            {showJdInput && (
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={3}
                placeholder="Paste the job description from LinkedIn, Indeed, or company site to benchmark against exact employer requirements..."
                className="w-full mt-2 p-2.5 text-xs rounded-lg bg-surface-elevated border border-border-subtle text-text-primary focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            )}
          </div>
        </div>
      </div>

      {/* Analysis Results Summary Banner */}
      <div className="card p-6 bg-gradient-to-br from-surface via-surface to-surface-elevated border border-border-subtle shadow-sm rounded-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Readiness Score Radial/Meter */}
          <div className="flex items-center gap-5">
            <div className="relative flex items-center justify-center w-20 h-20 rounded-full border-4 border-emerald-500/20 bg-emerald-500/5">
              <div className="text-center">
                <span className="text-2xl font-black text-text-primary tracking-tight">
                  {analysisResult.readinessScore}%
                </span>
                <span className="block text-[9px] uppercase font-bold text-emerald-600 dark:text-emerald-400">
                  Readiness
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    analysisResult.mentorOpinion.verdictTone === 'ready'
                      ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300'
                      : analysisResult.mentorOpinion.verdictTone === 'competitive_gap'
                      ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300'
                      : 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-300'
                  }`}
                >
                  {analysisResult.mentorOpinion.verdictTone === 'ready'
                    ? '🚀 Ready to Apply'
                    : analysisResult.mentorOpinion.verdictTone === 'competitive_gap'
                    ? '⚡ Competitive with Gaps'
                    : '🌱 Foundational Stage'}
                </span>
                <span className="text-xs text-text-faint">
                  Role: <strong>{analysisResult.targetRole}</strong> ({analysisResult.seniority})
                </span>
              </div>
              <h3 className="text-base font-bold text-text-primary mt-1">
                {analysisResult.mentorOpinion.overallVerdict}
              </h3>
              <p className="text-xs text-text-muted mt-0.5 max-w-2xl">
                {analysisResult.mentorOpinion.executiveSummary}
              </p>
            </div>
          </div>

          {/* Metric Stats Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:border-l lg:border-border-subtle lg:pl-6">
            <div className="p-2.5 rounded-lg bg-surface-elevated border border-border-subtle text-center">
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {analysisResult.matchedSkills.length}
              </span>
              <p className="text-[10px] uppercase font-semibold text-text-muted">Skills You Have</p>
            </div>
            <div className="p-2.5 rounded-lg bg-surface-elevated border border-border-subtle text-center">
              <span className="text-lg font-bold text-rose-600 dark:text-rose-400">
                {analysisResult.missingSkills.filter((s) => s.priority === 'critical').length}
              </span>
              <p className="text-[10px] uppercase font-semibold text-text-muted">Critical Gaps</p>
            </div>
            <div className="p-2.5 rounded-lg bg-surface-elevated border border-border-subtle text-center">
              <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                {analysisResult.missingSkills.filter((s) => s.priority === 'high').length}
              </span>
              <p className="text-[10px] uppercase font-semibold text-text-muted">High-Value Gaps</p>
            </div>
            <div className="p-2.5 rounded-lg bg-surface-elevated border border-border-subtle text-center">
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {analysisResult.whereToApply.targetIndustries.length}
              </span>
              <p className="text-[10px] uppercase font-semibold text-text-muted">Target Sectors</p>
            </div>
          </div>
        </div>

        {/* Copy Strategy Button Bar */}
        <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between flex-wrap gap-2">
          <p className="text-xs text-text-muted">
            💡 <strong>Mentor Take:</strong> {analysisResult.mentorOpinion.biggestBlocker}
          </p>
          <button
            onClick={handleCopyStrategy}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface hover:bg-surface-elevated border border-border-subtle text-text-primary transition-colors flex items-center gap-1.5 shadow-sm"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            {isCopied ? 'Copied Strategy!' : 'Copy Mentor Strategy'}
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-border-subtle gap-2">
        <button
          onClick={() => setActiveTab('skills')}
          className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'skills'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          <Code2 className="w-4 h-4" />
          Skills Gap Analysis
          <span className="text-xs px-2 py-0.2 rounded-full bg-surface-elevated border border-border-subtle">
            {analysisResult.matchedSkills.length} Matched / {analysisResult.missingSkills.length} Gaps
          </span>
        </button>

        <button
          onClick={() => setActiveTab('where_to_apply')}
          className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'where_to_apply'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          Where to Apply
          <span className="text-xs px-2 py-0.2 rounded-full bg-surface-elevated border border-border-subtle">
            6 Platforms & Sectors
          </span>
        </button>

        <button
          onClick={() => setActiveTab('mentor_opinion')}
          className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'mentor_opinion'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          <Sparkles className="w-4 h-4 text-emerald-500" />
          Senior Mentor Opinion & Roadmap
        </button>
      </div>

      {/* TAB 1: SKILLS GAP ANALYSIS (What skills you have vs what you lack) */}
      {activeTab === 'skills' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Skills You Have */}
          <div className="space-y-4">
            <div className="card p-5 bg-surface border border-emerald-500/20 shadow-sm rounded-xl">
              <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-md bg-emerald-500/10 text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-text-primary">Skills You Have (Matched)</h3>
                    <p className="text-xs text-text-muted">Skills you command that qualify you for {targetRole}</p>
                  </div>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  {analysisResult.matchedSkills.length} Qualified
                </span>
              </div>

              {analysisResult.matchedSkills.length === 0 ? (
                <div className="py-8 text-center text-xs text-text-muted">
                  No matched skills found yet. Add your current skills in the configuration card above.
                </div>
              ) : (
                <div className="space-y-3 mt-4">
                  {analysisResult.matchedSkills.map((skill, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-surface-elevated border border-border-subtle hover:border-emerald-500/30 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          <h4 className="text-xs font-bold text-text-primary">{skill.name}</h4>
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${
                            skill.category === 'core'
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                              : 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20'
                          }`}
                        >
                          {skill.category === 'core' ? 'Core Must-Have' : 'Competitive Edge'}
                        </span>
                      </div>
                      <p className="text-[11px] text-text-muted mt-1 pl-6">
                        {skill.relevanceExplanation}
                      </p>
                      {skill.matchedWith.toLowerCase() !== skill.name.toLowerCase() && (
                        <p className="text-[10px] text-text-faint mt-1 pl-6">
                          Matched via your input: <em>"{skill.matchedWith}"</em>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Strengths Pitch Box */}
            <div className="card p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
              <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-600" />
                How to Pitch Your Existing Skills
              </h4>
              <p className="text-xs text-text-secondary mt-1">
                {analysisResult.mentorOpinion.strengthsSummary}
              </p>
            </div>
          </div>

          {/* Right Column: Skills You Lack / Need */}
          <div className="space-y-4">
            <div className="card p-5 bg-surface border border-rose-500/20 shadow-sm rounded-xl">
              <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-md bg-rose-500/10 text-rose-600">
                    <AlertCircle className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-text-primary">Skills You Need (Gaps to Close)</h3>
                    <p className="text-xs text-text-muted">Targeted skills required by employers hiring for {targetRole}</p>
                  </div>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300">
                  {analysisResult.missingSkills.length} Actionable Gaps
                </span>
              </div>

              {analysisResult.missingSkills.length === 0 ? (
                <div className="py-8 text-center text-xs text-emerald-600 font-medium">
                  🎉 Outstanding! You cover all standard core and differentiator benchmarks for this role.
                </div>
              ) : (
                <div className="space-y-3 mt-4">
                  {analysisResult.missingSkills.map((gap, idx) => (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-lg border transition-all ${
                        gap.priority === 'critical'
                          ? 'bg-rose-500/5 border-rose-500/30'
                          : gap.priority === 'high'
                          ? 'bg-amber-500/5 border-amber-500/30'
                          : 'bg-surface-elevated border-border-subtle'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <AlertCircle
                            className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                              gap.priority === 'critical'
                                ? 'text-rose-500'
                                : gap.priority === 'high'
                                ? 'text-amber-500'
                                : 'text-blue-500'
                            }`}
                          />
                          <div>
                            <h4 className="text-xs font-bold text-text-primary">{gap.name}</h4>
                            <span
                              className={`inline-block text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase mt-0.5 ${
                                gap.priority === 'critical'
                                  ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                                  : gap.priority === 'high'
                                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                                  : 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                              }`}
                            >
                              {gap.priority === 'critical'
                                ? '🔴 Critical Blocker'
                                : gap.priority === 'high'
                                ? '🟡 High-Value Advantage'
                                : '🟢 Bonus Differentiator'}
                            </span>
                          </div>
                        </div>

                        {/* 1-Click "I already know this" Button */}
                        <button
                          onClick={() => handleAddSkill(gap.name.split('(')[0].trim())}
                          className="text-[10px] font-semibold px-2 py-1 rounded bg-surface hover:bg-emerald-500/10 hover:text-emerald-600 border border-border-subtle text-text-secondary transition-colors whitespace-nowrap flex items-center gap-1"
                          title="Add to your skills if you already know this"
                        >
                          <Plus className="w-2.5 h-2.5 text-emerald-500" />
                          I know this
                        </button>
                      </div>

                      <p className="text-[11px] text-text-secondary mt-2 pl-6">
                        <strong>Why employers demand it:</strong> {gap.whyItMatters}
                      </p>

                      <div className="mt-2.5 pl-6 pt-2 border-t border-border-subtle/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px]">
                        <span className="flex items-center gap-1 text-text-muted">
                          <Clock className="w-3 h-3 text-text-faint" />
                          Est. Study Time: <strong>{gap.estimatedTimeToLearn}</strong>
                        </span>
                        <span className="text-text-muted">
                          Project: <em>{gap.suggestedProject}</em>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: WHERE TO APPLY (Job Portals & Target Industries) */}
      {activeTab === 'where_to_apply' && (
        <div className="space-y-6">
          {/* Section: Direct 1-Click Search Portals */}
          <div className="card p-5 bg-surface border border-border-subtle shadow-sm rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-emerald-500" />
                  Direct 1-Click Job Portals for {analysisResult.targetRole}
                </h3>
                <p className="text-xs text-text-muted">
                  Pre-configured search queries pre-filtered for <strong>{analysisResult.targetRole}</strong> in <strong>{locationPreference}</strong>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {analysisResult.whereToApply.portalLinks.map((portal) => (
                <a
                  key={portal.platform}
                  href={portal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 rounded-lg bg-surface-elevated border border-border-subtle hover:border-emerald-500 hover:shadow-sm transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-xs font-bold text-text-primary group-hover:text-emerald-600 transition-colors flex items-center gap-1.5">
                        {portal.platform}
                        <ExternalLink className="w-3 h-3 text-text-faint group-hover:text-emerald-500 transition-colors" />
                      </h4>
                      {portal.badge && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                          {portal.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-text-muted leading-relaxed">
                      {portal.description}
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-border-subtle flex items-center justify-between text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <span>Search Open Roles</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Section: Target Industries & Company Archetypes */}
          <div className="card p-5 bg-surface border border-border-subtle shadow-sm rounded-xl space-y-4">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-500" />
              High-Hiring Industries & Target Companies for {analysisResult.targetRole}
            </h3>
            <p className="text-xs text-text-muted">
              Sectors with active hiring pipelines and specific candidate expectations for this role.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysisResult.whereToApply.targetIndustries.map((ind, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-lg bg-surface-elevated border border-border-subtle space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-text-primary">{ind.name}</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-300 font-medium">
                      Active Hiring
                    </span>
                  </div>
                  <p className="text-xs text-text-muted">
                    {ind.description}
                  </p>
                  <div className="text-[11px] space-y-1 pt-1">
                    <p className="text-text-secondary">
                      <strong>Sample Employers:</strong> {ind.exampleCompanies.join(', ')}
                    </p>
                    <p className="text-text-secondary">
                      <strong>Typical Roles:</strong> {ind.typicalRoles.join(' • ')}
                    </p>
                    <p className="text-emerald-700 dark:text-emerald-400 font-medium pt-1">
                      🎯 <strong>Hiring Focus:</strong> {ind.hiringFocus}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Application Channel Strategy */}
          <div className="card p-5 bg-surface border border-border-subtle shadow-sm rounded-xl space-y-4">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-500" />
              Recommended Application Channel Allocation
            </h3>
            <p className="text-xs text-text-muted">
              How to distribute your weekly job search efforts for maximum response rate.
            </p>

            <div className="space-y-3">
              {analysisResult.whereToApply.recommendedChannels.map((channel, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-surface-elevated border border-border-subtle">
                  <div className="flex items-center justify-between text-xs font-bold text-text-primary mb-1">
                    <span>{channel.channel}</span>
                    <span className="text-emerald-600 dark:text-emerald-400">{channel.allocation}% of effort</span>
                  </div>
                  <div className="w-full bg-border-subtle rounded-full h-1.5 mb-2 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-1.5 rounded-full"
                      style={{ width: `${channel.allocation}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-text-muted">
                    {channel.advice}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SENIOR MENTOR OPINION & ROADMAP */}
      {activeTab === 'mentor_opinion' && (
        <div className="space-y-6">
          {/* Executive Verdict Card */}
          <div className="card p-6 bg-surface border border-emerald-500/20 shadow-sm rounded-xl space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                <Sparkles className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-text-primary">
                  Senior Engineering & Analytics Mentor Opinion
                </h3>
                <p className="text-xs text-text-muted">
                  Candid evaluation based on current market hiring bars for <strong>{analysisResult.targetRole}</strong>.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-surface-elevated border border-border-subtle text-xs text-text-secondary leading-relaxed space-y-2">
              <p>
                <strong>The Reality Check:</strong> {analysisResult.mentorOpinion.executiveSummary}
              </p>
              <p>
                <strong>The Biggest Blocker to Fix:</strong> <span className="text-rose-600 dark:text-rose-400 font-semibold">{analysisResult.mentorOpinion.biggestBlocker}</span>
              </p>
            </div>

            {/* Single Best Portfolio Deliverable */}
            <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20 space-y-1.5">
              <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                The #1 Portfolio Asset That Will Get You Interviews
              </h4>
              <p className="text-xs text-text-secondary">
                {analysisResult.mentorOpinion.portfolioAdvice}
              </p>
            </div>
          </div>

          {/* 30-Day Step-by-Step Strategic Roadmap */}
          <div className="card p-6 bg-surface border border-border-subtle shadow-sm rounded-xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                Your 30-Day Step-by-Step Strategic Action Plan
              </h3>
              <span className="text-xs text-text-muted">Timeline: 1 Month</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {analysisResult.mentorOpinion.strategicActionPlan.map((phase, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-surface-elevated border border-border-subtle hover:border-emerald-500/30 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                        {phase.phase}
                      </span>
                      <span className="text-[10px] text-text-faint">{phase.timeline}</span>
                    </div>
                    <h4 className="text-xs font-bold text-text-primary pt-1">{phase.title}</h4>
                    <ul className="space-y-1.5 pt-1 text-[11px] text-text-muted">
                      {phase.tasks.map((task, tIdx) => (
                        <li key={tIdx} className="flex items-start gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <span>{task}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="card p-5 bg-surface border border-border-subtle rounded-xl flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-text-primary">Tailor Resume for {analysisResult.targetRole}</h4>
                <p className="text-[11px] text-text-muted mt-0.5">
                  Generate an ATS-optimized resume emphasizing your qualified skills and chosen template.
                </p>
              </div>
              <button
                onClick={() => navigate('/app/job-seeker/resume-generator')}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1.5 shadow-sm whitespace-nowrap ml-3"
              >
                Tailor Resume
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="card p-5 bg-surface border border-border-subtle rounded-xl flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-text-primary">Track Applications</h4>
                <p className="text-[11px] text-text-muted mt-0.5">
                  Log your target job applications, schedule 7d/14d follow-ups, and track recruiter responses.
                </p>
              </div>
              <button
                onClick={() => navigate('/app/job-seeker/applications')}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-surface-elevated hover:bg-border-subtle border border-border-subtle text-text-primary transition-colors flex items-center gap-1.5 shadow-sm whitespace-nowrap ml-3"
              >
                Open Tracker
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
