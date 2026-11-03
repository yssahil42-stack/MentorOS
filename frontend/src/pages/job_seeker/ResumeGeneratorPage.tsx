import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Download,
  Copy,
  Printer,
  FileText,
  Check,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  ExternalLink,
  Target,
  Layers,
  Briefcase,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { Card3D } from '../../components/ui/Card3D';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import type {
  ResumeTailorInput,
  TailoredResumeResult,
  SeniorityLevel,
  ResumeProjectItem,
} from '../../types/resume';
import {
  SAMPLE_RESUME_INPUTS,
  synthesizeTailoredResume,
  tailorResume,
  exportResumePdf,
  exportResumeMarkdown,
  exportResumePlainText,
  saveResumeDraft,
  loadResumeDraft,
} from '../../services/resumeService';

export default function ResumeGeneratorPage() {
  const { showToast } = useWorkspace();

  const [form, setForm] = useState<ResumeTailorInput>(() => {
    const saved = loadResumeDraft();
    return saved ?? SAMPLE_RESUME_INPUTS.fullstack;
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<TailoredResumeResult | null>(null);
  const [activeTab, setActiveTab] = useState<'formatted' | 'markdown' | 'plaintext'>('formatted');
  const [copied, setCopied] = useState(false);
  const [showContactDetails, setShowContactDetails] = useState(false);

  // Quick inputs
  const [newSkill, setNewSkill] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState<
    'languages' | 'frameworks' | 'tools' | 'cloud'
  >('languages');
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectRole, setNewProjectRole] = useState('');
  const [newProjectTech, setNewProjectTech] = useState('');
  const [newProjectBullet, setNewProjectBullet] = useState('');
  const [isAddingProject, setIsAddingProject] = useState(false);

  // Initialize with synthesized resume
  useEffect(() => {
    const initial = synthesizeTailoredResume(form);
    setResult(initial);
  }, []);

  // Keyboard shortcut ⌘G / Ctrl+G
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        handleTailor();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [form]);

  const handleTailor = async () => {
    if (!form.targetRole.trim()) {
      showToast('Please specify a target role title', 'error');
      return;
    }

    setIsGenerating(true);
    try {
      saveResumeDraft(form);
      const tailored = await tailorResume(form);
      setResult(tailored);
      showToast('Resume tailored with keyword optimization!', 'success');
    } catch {
      showToast('Tailoring fallback applied', 'info');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLoadSample = (sampleKey: 'fullstack' | 'frontend') => {
    const sample = SAMPLE_RESUME_INPUTS[sampleKey];
    setForm(sample);
    const tailored = synthesizeTailoredResume(sample);
    setResult(tailored);
    showToast(
      `Loaded ${sampleKey === 'fullstack' ? 'Full-Stack' : 'Frontend'} sample profile`,
      'info'
    );
  };

  const handleToggleProject = (id: string) => {
    setForm((prev) => {
      const updatedProjects = prev.projects.map((p) =>
        p.id === id ? { ...p, selected: !p.selected } : p
      );
      const updated = { ...prev, projects: updatedProjects };
      // Regenerate preview immediately
      setResult(synthesizeTailoredResume(updated));
      return updated;
    });
  };

  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    const trimmed = newSkill.trim();
    setForm((prev) => {
      const existing = prev.skills[newSkillCategory];
      if (existing.includes(trimmed)) return prev;
      const updated = {
        ...prev,
        skills: {
          ...prev.skills,
          [newSkillCategory]: [...existing, trimmed],
        },
      };
      setResult(synthesizeTailoredResume(updated));
      return updated;
    });
    setNewSkill('');
    showToast(`Added ${trimmed} to ${newSkillCategory}`, 'info');
  };

  const handleRemoveSkill = (
    category: 'languages' | 'frameworks' | 'tools' | 'cloud',
    skillName: string
  ) => {
    setForm((prev) => {
      const updated = {
        ...prev,
        skills: {
          ...prev.skills,
          [category]: prev.skills[category].filter((s) => s !== skillName),
        },
      };
      setResult(synthesizeTailoredResume(updated));
      return updated;
    });
  };

  const handleAddMissingKeyword = (kw: string) => {
    setForm((prev) => {
      const updated = {
        ...prev,
        skills: {
          ...prev.skills,
          frameworks: [...prev.skills.frameworks, kw],
        },
      };
      setResult(synthesizeTailoredResume(updated));
      return updated;
    });
    showToast(`Added ${kw} to skills`, 'success');
  };

  const handleCreateProject = () => {
    if (!newProjectTitle.trim()) {
      showToast('Project title is required', 'error');
      return;
    }
    const created: ResumeProjectItem = {
      id: `proj-${Date.now()}`,
      title: newProjectTitle.trim(),
      role: newProjectRole.trim() || 'Software Engineer',
      techStack: newProjectTech
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      bullets: newProjectBullet.trim()
        ? [newProjectBullet.trim()]
        : ['Engineered responsive web client with robust state management and automated tests.'],
      selected: true,
    };

    setForm((prev) => {
      const updated = { ...prev, projects: [created, ...prev.projects] };
      setResult(synthesizeTailoredResume(updated));
      return updated;
    });

    setNewProjectTitle('');
    setNewProjectRole('');
    setNewProjectTech('');
    setNewProjectBullet('');
    setIsAddingProject(false);
    showToast('New project added and selected!', 'success');
  };

  const handleCopy = async () => {
    if (!result) return;
    const textToCopy = activeTab === 'markdown' ? result.markdown : result.plainText;
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    showToast('Copied resume to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPdf = () => {
    if (!result) return;
    exportResumePdf(result, form.profile);
    showToast('Preparing printable resume view...', 'info');
  };

  const handleExportMd = () => {
    if (!result) return;
    const safeName = form.profile.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    exportResumeMarkdown(result.markdown, `${safeName}-tailored-resume.md`);
    showToast('Downloaded Markdown resume', 'success');
  };

  const handleExportTxt = () => {
    if (!result) return;
    const safeName = form.profile.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    exportResumePlainText(result.plainText, `${safeName}-resume.txt`);
    showToast('Downloaded ATS plain-text resume', 'success');
  };

  const keywordReport = result?.keywordReport;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border-base">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
              AI Resume Tailor &amp; Keyword Optimizer
            </h1>
            <span className="px-2 py-0.5 rounded-full text-2xs font-bold tracking-wide uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              ATS Optimized
            </span>
          </div>
          <p className="text-xs sm:text-sm text-text-muted">
            Target role + selected projects → Tailored resume PDF + keyword optimization.
          </p>
        </div>

        {/* Preset Profiles */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleLoadSample('fullstack')}
            className="text-xs"
          >
            Load Full-Stack Sample
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleLoadSample('frontend')}
            className="text-xs"
          >
            Load Frontend Sample
          </Button>
        </div>
      </div>

      {/* Main Grid: Inputs (5 Cols) vs ATS Preview & Optimization (7 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Target Role & Specifications Form */}
        <div className="lg:col-span-5 space-y-4">
          <Card3D
            variant="secondary"
            className="p-5 border border-border-base shadow-card backdrop-blur-md space-y-5"
          >
            <div className="flex items-center justify-between border-b border-border-base pb-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-500" />
                <h2 className="text-sm font-bold text-text-primary">Target Job Specification</h2>
              </div>
              <Badge variant="outline" className="text-2xs font-mono">
                {form.seniority.toUpperCase()}
              </Badge>
            </div>

            {/* Target Role & Seniority */}
            <div className="space-y-3">
              <div>
                <label className="block text-2xs font-semibold text-text-muted mb-1">
                  Target Job Title *
                </label>
                <Input
                  value={form.targetRole}
                  onChange={(e) => setForm({ ...form, targetRole: e.target.value })}
                  placeholder="e.g. Senior Full-Stack Engineer"
                  className="w-full text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-2xs font-semibold text-text-muted mb-1">
                    Seniority Level
                  </label>
                  <select
                    value={form.seniority}
                    onChange={(e) =>
                      setForm({ ...form, seniority: e.target.value as SeniorityLevel })
                    }
                    className="w-full rounded-xl text-xs bg-bg-surface border border-border-base p-2 text-text-primary focus:outline-none focus:border-emerald-500"
                  >
                    <option value="intern">Intern</option>
                    <option value="junior">Junior</option>
                    <option value="mid">Mid-Level</option>
                    <option value="senior">Senior</option>
                    <option value="lead">Lead / Staff</option>
                    <option value="principal">Principal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-2xs font-semibold text-text-muted mb-1">
                    Target Industry
                  </label>
                  <Input
                    value={form.targetIndustry}
                    onChange={(e) => setForm({ ...form, targetIndustry: e.target.value })}
                    placeholder="e.g. B2B SaaS, FinTech"
                    className="w-full text-xs"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-2xs font-semibold text-text-muted">
                    Paste Job Description / Key Requirements
                  </label>
                  <span className="text-2xs text-text-faint">
                    {form.jobDescription.length} chars
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={form.jobDescription}
                  onChange={(e) => setForm({ ...form, jobDescription: e.target.value })}
                  placeholder="Paste the job requirements, responsibilities, or keywords here to optimize keyword matching..."
                  className="w-full rounded-xl text-xs bg-bg-surface border border-border-base p-2.5 text-text-primary placeholder:text-text-faint focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Selected Projects for Resume (Prompt Requirement) */}
            <div className="space-y-3 pt-3 border-t border-border-base">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Select Projects to Feature</span>
                  </h3>
                  <p className="text-2xs text-text-muted">
                    Toggle which projects appear on your tailored resume.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddingProject(!isAddingProject)}
                  className="text-2xs h-7"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add
                </Button>
              </div>

              {/* Add Project Sub-form */}
              {isAddingProject && (
                <div className="p-3 rounded-xl bg-bg-surface border border-emerald-500/30 space-y-2 text-xs">
                  <Input
                    value={newProjectTitle}
                    onChange={(e) => setNewProjectTitle(e.target.value)}
                    placeholder="Project Title (e.g. Payment Gateway)"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={newProjectRole}
                      onChange={(e) => setNewProjectRole(e.target.value)}
                      placeholder="Your Role (e.g. Lead Dev)"
                    />
                    <Input
                      value={newProjectTech}
                      onChange={(e) => setNewProjectTech(e.target.value)}
                      placeholder="Tech Stack (comma-sep)"
                    />
                  </div>
                  <Input
                    value={newProjectBullet}
                    onChange={(e) => setNewProjectBullet(e.target.value)}
                    placeholder="Impact bullet with quantifiable outcome..."
                  />
                  <div className="flex justify-end gap-2 pt-1">
                    <Button variant="ghost" size="sm" onClick={() => setIsAddingProject(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleCreateProject}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white"
                    >
                      Save Project
                    </Button>
                  </div>
                </div>
              )}

              {/* Projects List with Selection Toggles */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {form.projects.map((proj) => (
                  <div
                    key={proj.id}
                    onClick={() => handleToggleProject(proj.id)}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-2.5 ${
                      proj.selected
                        ? 'bg-emerald-500/5 border-emerald-500/30 text-text-primary'
                        : 'bg-bg-surface/50 border-border-base text-text-muted opacity-60'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={proj.selected}
                      onChange={() => {}} // handled by parent onClick
                      className="mt-0.5 rounded text-emerald-500 focus:ring-emerald-500/30"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold truncate">{proj.title}</span>
                        <span className="text-2xs font-mono text-text-muted">{proj.role}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {proj.techStack.map((tech) => (
                          <span
                            key={tech}
                            className="px-1.5 py-0.2 rounded text-[10px] bg-bg-elevated border border-border-base text-text-muted"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Skills Tuning & Add */}
            <div className="space-y-2 pt-3 border-t border-border-base">
              <label className="block text-2xs font-semibold text-text-muted">
                Skills &amp; Technologies
              </label>
              <div className="flex gap-1.5">
                <select
                  value={newSkillCategory}
                  onChange={(e) =>
                    setNewSkillCategory(
                      e.target.value as 'languages' | 'frameworks' | 'tools' | 'cloud'
                    )
                  }
                  className="rounded-xl text-2xs bg-bg-surface border border-border-base px-2 py-1 text-text-primary"
                >
                  <option value="languages">Languages</option>
                  <option value="frameworks">Frameworks</option>
                  <option value="tools">Tools</option>
                  <option value="cloud">Cloud/Infra</option>
                </select>
                <Input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                  placeholder="e.g. Next.js, Redis, Docker"
                  className="flex-1 text-xs"
                />
                <Button variant="outline" size="sm" onClick={handleAddSkill}>
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>

              {/* Chips */}
              <div className="flex flex-wrap gap-1 pt-1 max-h-28 overflow-y-auto">
                {Object.entries(form.skills).flatMap(([cat, list]) =>
                  list.map((skill) => (
                    <span
                      key={`${cat}-${skill}`}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-2xs bg-bg-surface border border-border-base text-text-primary"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() =>
                          handleRemoveSkill(
                            cat as 'languages' | 'frameworks' | 'tools' | 'cloud',
                            skill
                          )
                        }
                        className="text-text-muted hover:text-red-500"
                      >
                        &times;
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Contact Details Accordion */}
            <div className="pt-2 border-t border-border-base">
              <button
                type="button"
                onClick={() => setShowContactDetails(!showContactDetails)}
                className="w-full flex items-center justify-between text-2xs font-semibold text-text-muted hover:text-text-primary py-1"
              >
                <span>Candidate Profile &amp; Contact Information</span>
                {showContactDetails ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              {showContactDetails && (
                <div className="space-y-2 pt-2 text-xs">
                  <Input
                    value={form.profile.name}
                    onChange={(e) =>
                      setForm({ ...form, profile: { ...form.profile, name: e.target.value } })
                    }
                    placeholder="Full Name"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={form.profile.email}
                      onChange={(e) =>
                        setForm({ ...form, profile: { ...form.profile, email: e.target.value } })
                      }
                      placeholder="Email"
                    />
                    <Input
                      value={form.profile.phone}
                      onChange={(e) =>
                        setForm({ ...form, profile: { ...form.profile, phone: e.target.value } })
                      }
                      placeholder="Phone"
                    />
                  </div>
                  <Input
                    value={form.profile.location}
                    onChange={(e) =>
                      setForm({ ...form, profile: { ...form.profile, location: e.target.value } })
                    }
                    placeholder="Location (e.g. New York, NY)"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={form.profile.linkedin}
                      onChange={(e) =>
                        setForm({ ...form, profile: { ...form.profile, linkedin: e.target.value } })
                      }
                      placeholder="LinkedIn URL"
                    />
                    <Input
                      value={form.profile.github}
                      onChange={(e) =>
                        setForm({ ...form, profile: { ...form.profile, github: e.target.value } })
                      }
                      placeholder="GitHub URL"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Primary Action Button */}
            <div className="pt-2">
              <Button
                variant="primary"
                size="md"
                fullWidth
                loading={isGenerating}
                onClick={handleTailor}
                keyboardShortcut="⌘G"
                tooltip="Tailor resume to target role (⌘G)"
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-2xs"
                icon={<Sparkles className="w-4 h-4" />}
              >
                <span>{isGenerating ? 'Optimizing with AI...' : 'Tailor Resume with AI'}</span>
              </Button>
            </div>
          </Card3D>
        </div>

        {/* Right Column: ATS Keyword Report & Resume Document (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* ATS Keyword Optimization Dashboard Card */}
          {keywordReport && (
            <Card3D
              variant="secondary"
              className="p-4 sm:p-5 border border-border-base shadow-card backdrop-blur-md"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border-base gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-bold text-xs">
                    %
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-text-primary">
                      ATS Keyword Optimization Analysis
                    </h3>
                    <p className="text-2xs text-text-muted">
                      Tailored alignment with {form.targetRole} requirements
                    </p>
                  </div>
                </div>

                {/* Score Indicators */}
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <div className="text-base sm:text-lg font-extrabold text-emerald-500">
                      {keywordReport.matchScore}%
                    </div>
                    <div className="text-[10px] text-text-muted font-semibold uppercase">
                      Job Match
                    </div>
                  </div>
                  <div className="w-px h-8 bg-border-base" />
                  <div className="text-center">
                    <div className="text-base sm:text-lg font-extrabold text-text-primary">
                      {keywordReport.atsScore}/100
                    </div>
                    <div className="text-[10px] text-text-muted font-semibold uppercase">
                      ATS Readability
                    </div>
                  </div>
                  <div className="w-px h-8 bg-border-base" />
                  <div className="text-center">
                    <div className="text-base sm:text-lg font-extrabold text-text-primary">
                      {keywordReport.actionVerbScore}%
                    </div>
                    <div className="text-[10px] text-text-muted font-semibold uppercase">
                      Action Verbs
                    </div>
                  </div>
                </div>
              </div>

              {/* Keyword Badges: Matched vs Missing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 text-xs">
                <div>
                  <div className="flex items-center gap-1.5 text-2xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Matched Keywords ({keywordReport.matchedKeywords.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {keywordReport.matchedKeywords.slice(0, 10).map((kw) => (
                      <span
                        key={kw}
                        className="px-2 py-0.5 rounded-md text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 text-2xs font-semibold text-amber-500 mb-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Recommended Keywords to Add</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {keywordReport.missingKeywords.length > 0 ? (
                      keywordReport.missingKeywords.slice(0, 6).map((kw) => (
                        <button
                          key={kw}
                          type="button"
                          onClick={() => handleAddMissingKeyword(kw)}
                          className="px-2 py-0.5 rounded-md text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 font-mono transition-colors flex items-center gap-1"
                          title="Click to add to skills"
                        >
                          <span>+ {kw}</span>
                        </button>
                      ))
                    ) : (
                      <span className="text-2xs text-text-faint">
                        All core target keywords covered!
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card3D>
          )}

          {/* Resume Document Viewer */}
          <Card3D
            variant="secondary"
            className="p-5 sm:p-6 border border-border-base shadow-card backdrop-blur-md flex flex-col h-full min-h-[580px]"
          >
            {/* Action Bar & Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border-base gap-3">
              {/* Document Tabs */}
              <div className="flex items-center gap-1.5 bg-bg-base p-1 rounded-xl border border-border-base">
                <button
                  type="button"
                  onClick={() => setActiveTab('formatted')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === 'formatted'
                      ? 'bg-emerald-500 text-white shadow-2xs'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Formatted ATS Resume</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('markdown')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === 'markdown'
                      ? 'bg-emerald-500 text-white shadow-2xs'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  <span>Markdown</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('plaintext')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === 'plaintext'
                      ? 'bg-emerald-500 text-white shadow-2xs'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  <span>Plain Text</span>
                </button>
              </div>

              {/* Export Controls */}
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  icon={
                    copied ? (
                      <Check className="w-3.5 h-3.5 text-success" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )
                  }
                >
                  {copied ? 'Copied' : 'Copy'}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportMd}
                  icon={<Download className="w-3.5 h-3.5" />}
                >
                  MD
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportTxt}
                  icon={<FileText className="w-3.5 h-3.5" />}
                >
                  TXT
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleExportPdf}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-2xs"
                  icon={<Printer className="w-3.5 h-3.5" />}
                >
                  PDF
                </Button>
              </div>
            </div>

            {/* Generated Content Body */}
            <div className="flex-1 pt-4 overflow-y-auto">
              {activeTab === 'markdown' && (
                <textarea
                  readOnly
                  data-testid="raw-resume-textarea"
                  value={result?.markdown || ''}
                  className="w-full h-full min-h-[500px] font-mono text-xs p-4 rounded-xl bg-bg-base border border-border-base text-text-primary focus:outline-none resize-none leading-relaxed"
                />
              )}

              {activeTab === 'plaintext' && (
                <textarea
                  readOnly
                  data-testid="plaintext-resume-textarea"
                  value={result?.plainText || ''}
                  className="w-full h-full min-h-[500px] font-mono text-xs p-4 rounded-xl bg-bg-base border border-border-base text-text-primary focus:outline-none resize-none leading-relaxed whitespace-pre"
                />
              )}

              {activeTab === 'formatted' && result && (
                <div
                  data-testid="formatted-resume-preview"
                  className="p-6 sm:p-8 rounded-xl bg-white text-gray-900 border border-gray-200 shadow-xs font-sans space-y-4 max-w-3xl mx-auto"
                >
                  {/* Candidate Header */}
                  <div className="text-center pb-3 border-b-2 border-emerald-500">
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                      {form.profile.name}
                    </h2>
                    <div className="text-sm font-semibold text-emerald-600 mt-0.5">
                      {form.targetRole}
                    </div>
                    <div className="text-xs text-gray-600 mt-1 flex items-center justify-center flex-wrap gap-x-2">
                      <span>{form.profile.email}</span>
                      <span>•</span>
                      <span>{form.profile.phone}</span>
                      <span>•</span>
                      <span>{form.profile.location}</span>
                      {form.profile.linkedin && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-700">{form.profile.linkedin}</span>
                        </>
                      )}
                      {form.profile.github && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-700">{form.profile.github}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Summary */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-0.5 mb-1.5">
                      Professional Summary
                    </h3>
                    <p className="text-xs text-gray-700 leading-relaxed text-justify">
                      {result.summary}
                    </p>
                  </div>

                  {/* Technical Skills */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-0.5 mb-1.5">
                      Technical Skills
                    </h3>
                    <div className="text-xs text-gray-700 space-y-1">
                      <div>
                        <strong className="text-gray-900">Languages:</strong>{' '}
                        {result.skillsCategorized.languages.join(', ')}
                      </div>
                      <div>
                        <strong className="text-gray-900">Frameworks &amp; Libraries:</strong>{' '}
                        {result.skillsCategorized.frameworks.join(', ')}
                      </div>
                      <div>
                        <strong className="text-gray-900">Tools, Cloud &amp; Platforms:</strong>{' '}
                        {result.skillsCategorized.toolsAndCloud.join(', ')}
                      </div>
                    </div>
                  </div>

                  {/* Selected Featured Projects */}
                  {result.tailoredProjects.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-0.5 mb-2">
                        Featured Projects
                      </h3>
                      <div className="space-y-3">
                        {result.tailoredProjects.map((proj) => (
                          <div key={proj.title} className="text-xs">
                            <div className="flex items-baseline justify-between">
                              <span className="font-bold text-gray-900">
                                {proj.title} —{' '}
                                <span className="font-medium text-gray-700">{proj.role}</span>
                              </span>
                            </div>
                            <div className="text-[11px] text-gray-600 italic">
                              Technologies: {proj.techStack.join(', ')}
                            </div>
                            <ul className="list-disc ml-4 mt-1 space-y-0.5 text-gray-700">
                              {proj.bullets.map((b, i) => (
                                <li key={i}>{b}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Professional Experience */}
                  {result.tailoredExperiences.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-0.5 mb-2">
                        Professional Experience
                      </h3>
                      <div className="space-y-3">
                        {result.tailoredExperiences.map((exp, idx) => (
                          <div key={idx} className="text-xs">
                            <div className="flex items-baseline justify-between">
                              <span className="font-bold text-gray-900">
                                {exp.role} | <span className="text-emerald-700">{exp.company}</span>
                              </span>
                              <span className="text-[11px] text-gray-500 font-medium">
                                {exp.location} • {exp.period}
                              </span>
                            </div>
                            <ul className="list-disc ml-4 mt-1 space-y-0.5 text-gray-700">
                              {exp.bullets.map((b, i) => (
                                <li key={i}>{b}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Education */}
                  {result.education.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-0.5 mb-1.5">
                        Education
                      </h3>
                      <div className="space-y-1 text-xs">
                        {result.education.map((edu, idx) => (
                          <div key={idx} className="flex items-baseline justify-between">
                            <span className="font-bold text-gray-900">
                              {edu.degree} —{' '}
                              <span className="text-emerald-700">{edu.institution}</span>
                            </span>
                            <span className="text-[11px] text-gray-500">{edu.year}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card3D>
        </div>
      </div>
    </div>
  );
}
