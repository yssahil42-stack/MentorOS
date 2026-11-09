import React, { useState, useEffect, useContext } from 'react';
import {
  Download,
  Copy,
  Printer,
  FileText,
  Check,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Target,
  Layers,
  Briefcase,
  GraduationCap,
  User,
  Edit3,
  Sparkles,
  BookOpen,
  Eye,
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
  ResumeExperienceItem,
  ResumeEducationItem,
  SchoolEducationItem,
  ResumeTemplateId,
  SummaryStyle,
} from '../../types/resume';
import {
  SAMPLE_RESUME_INPUTS,
  synthesizeTailoredResume,
  tailorResume,
  isEducationPursuing,
  exportResumePdf,
  exportResumeMarkdown,
  exportResumePlainText,
  saveResumeDraft,
  loadResumeDraft,
} from '../../services/resumeService';

const TEMPLATE_OPTIONS: {
  id: ResumeTemplateId;
  name: string;
  icon: string;
  description: string;
  badge: string;
}[] = [
  {
    id: 'modern',
    name: 'Modern ATS',
    icon: '🌿',
    description: 'Emerald accents, clean sans-serif typography, high ATS scan rate',
    badge: 'Popular',
  },
  {
    id: 'classic',
    name: 'Classic Corporate',
    icon: '🏛️',
    description: 'Deep navy styling, formal serif headers, traditional corporate look',
    badge: 'Standard',
  },
  {
    id: 'minimal',
    name: 'Tech Minimalist',
    icon: '⚡',
    description: 'Monochrome, compact layout, clean developer-first aesthetic',
    badge: 'Clean',
  },
  {
    id: 'academic',
    name: 'Academic / Fresher',
    icon: '🎓',
    description: 'Education & coursework prioritized, structured project highlights',
    badge: 'Entry-Level',
  },
];

export default function ResumeGeneratorPage() {
  const { showToast } = useWorkspace();

  // Retrieve current user from localStorage if logged in
  const user = (() => {
    try {
      const raw = localStorage.getItem('mentor_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  const [form, setForm] = useState<ResumeTailorInput>(() => {
    const saved = loadResumeDraft();
    return saved ?? SAMPLE_RESUME_INPUTS.fullstack;
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<TailoredResumeResult | null>(null);
  const [activeTab, setActiveTab] = useState<'formatted' | 'markdown' | 'plaintext'>('formatted');
  const [activeInputTab, setActiveInputTab] = useState<'target' | 'experience' | 'projects' | 'education'>('target');
  const [selectedTemplate, setSelectedTemplate] = useState<ResumeTemplateId>(form.templateId || 'modern');
  const [selectedSummaryStyle, setSelectedSummaryStyle] = useState<SummaryStyle>(form.summaryStyle || 'metrics');
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [summaryEditText, setSummaryEditText] = useState('');
  const [copied, setCopied] = useState(false);

  // Quick Skill input
  const [newSkill, setNewSkill] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState<
    'languages' | 'frameworks' | 'tools' | 'cloud'
  >('languages');

  // Quick Project input
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectRole, setNewProjectRole] = useState('');
  const [newProjectTech, setNewProjectTech] = useState('');
  const [newProjectBullet, setNewProjectBullet] = useState('');
  const [isAddingProject, setIsAddingProject] = useState(false);

  // Quick Experience input
  const [isAddingExperience, setIsAddingExperience] = useState(false);
  const [newExpRole, setNewExpRole] = useState('');
  const [newExpCompany, setNewExpCompany] = useState('');
  const [newExpLocation, setNewExpLocation] = useState('');
  const [newExpStartDate, setNewExpStartDate] = useState('');
  const [newExpEndDate, setNewExpEndDate] = useState('');
  const [newExpCurrent, setNewExpCurrent] = useState(false);
  const [newExpBullets, setNewExpBullets] = useState('');

  // Quick Education input
  const [isAddingEducation, setIsAddingEducation] = useState(false);
  const [newEduDegree, setNewEduDegree] = useState('');
  const [newEduInstitution, setNewEduInstitution] = useState('');
  const [newEduYear, setNewEduYear] = useState('');
  const [newEduPercentage, setNewEduPercentage] = useState('');
  const [newEduPursuing, setNewEduPursuing] = useState(false);
  const [newEduDetails, setNewEduDetails] = useState('');

  // Initialize with synthesized resume
  useEffect(() => {
    const initial = synthesizeTailoredResume(form);
    setResult(initial);
    setSummaryEditText(initial.summary);
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
      setSummaryEditText(tailored.summary);
      showToast('Resume tailored with keyword optimization!', 'success');
    } catch {
      showToast('Tailoring fallback applied', 'info');
    } finally {
      setIsGenerating(false);
    }
  };

  // Toggle Fresher vs Experienced
  const handleToggleFresherMode = (isFresher: boolean) => {
    setForm((prev) => {
      const updated: ResumeTailorInput = {
        ...prev,
        isFresher,
        seniority: isFresher ? 'junior' : prev.seniority === 'intern' ? 'mid' : prev.seniority,
        omitExperience: isFresher ? prev.experiences.length === 0 : false,
        summaryStyle: isFresher ? 'growth' : 'metrics',
        templateId: isFresher && prev.templateId === 'modern' ? 'academic' : prev.templateId,
      };
      setSelectedSummaryStyle(updated.summaryStyle || 'metrics');
      if (updated.templateId) setSelectedTemplate(updated.templateId);
      const tailored = synthesizeTailoredResume(updated);
      setResult(tailored);
      setSummaryEditText(tailored.summary);
      return updated;
    });
    showToast(isFresher ? 'Switched to Fresher / Entry-Level mode' : 'Switched to Professional Experience mode', 'info');
  };

  // Switch Resume Template
  const handleSelectTemplate = (templateId: ResumeTemplateId) => {
    setSelectedTemplate(templateId);
    setForm((prev) => {
      const updated = { ...prev, templateId };
      const tailored = synthesizeTailoredResume(updated);
      setResult(tailored);
      return updated;
    });
    showToast(`Applied ${TEMPLATE_OPTIONS.find((t) => t.id === templateId)?.name} template`, 'info');
  };

  // Switch Summary Style (Metrics vs Technical vs Growth)
  const handleSelectSummaryStyle = (style: SummaryStyle) => {
    setSelectedSummaryStyle(style);
    setForm((prev) => {
      const updated = { ...prev, summaryStyle: style, customSummary: undefined };
      const tailored = synthesizeTailoredResume(updated);
      setResult(tailored);
      setSummaryEditText(tailored.summary);
      return updated;
    });
  };

  // Save Custom Summary Edit
  const handleSaveCustomSummary = () => {
    setForm((prev) => {
      const updated = { ...prev, customSummary: summaryEditText };
      const tailored = synthesizeTailoredResume(updated);
      setResult(tailored);
      return updated;
    });
    setIsEditingSummary(false);
    showToast('Custom summary saved to resume!', 'success');
  };

  // Autofill user details
  const handleAutofillProfile = () => {
    if (!user) return;
    setForm((prev) => {
      const updated = {
        ...prev,
        profile: {
          ...prev.profile,
          name: user.full_name || prev.profile.name,
          email: user.email || prev.profile.email,
        },
      };
      setResult(synthesizeTailoredResume(updated));
      return updated;
    });
    showToast('Autofilled name and email from profile', 'success');
  };

  // Project Handlers
  const handleToggleProject = (id: string) => {
    setForm((prev) => {
      const updatedProjects = prev.projects.map((p) =>
        p.id === id ? { ...p, selected: !p.selected } : p
      );
      const updated = { ...prev, projects: updatedProjects };
      setResult(synthesizeTailoredResume(updated));
      return updated;
    });
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

  const handleDeleteProject = (id: string) => {
    setForm((prev) => {
      const updated = { ...prev, projects: prev.projects.filter((p) => p.id !== id) };
      setResult(synthesizeTailoredResume(updated));
      return updated;
    });
    showToast('Project removed', 'info');
  };

  // Experience Handlers
  const handleCreateExperience = () => {
    if (!newExpRole.trim() || !newExpCompany.trim()) {
      showToast('Role and company are required', 'error');
      return;
    }

    const bulletsList = newExpBullets
      .split('\n')
      .map((b) => b.trim())
      .filter(Boolean);

    const created: ResumeExperienceItem = {
      id: `exp-${Date.now()}`,
      role: newExpRole.trim(),
      company: newExpCompany.trim(),
      location: newExpLocation.trim() || 'Remote',
      startDate: newExpStartDate.trim() || '2023',
      endDate: newExpCurrent ? 'Present' : newExpEndDate.trim() || '2024',
      current: newExpCurrent,
      bullets:
        bulletsList.length > 0
          ? bulletsList
          : ['Developed mission-critical web applications with end-to-end reliability.'],
    };

    setForm((prev) => {
      const updated = { ...prev, experiences: [created, ...prev.experiences] };
      setResult(synthesizeTailoredResume(updated));
      return updated;
    });

    setNewExpRole('');
    setNewExpCompany('');
    setNewExpLocation('');
    setNewExpStartDate('');
    setNewExpEndDate('');
    setNewExpCurrent(false);
    setNewExpBullets('');
    setIsAddingExperience(false);
    showToast('Experience added to resume!', 'success');
  };

  const handleDeleteExperience = (id: string) => {
    setForm((prev) => {
      const updated = { ...prev, experiences: prev.experiences.filter((e) => e.id !== id) };
      setResult(synthesizeTailoredResume(updated));
      return updated;
    });
    showToast('Experience removed', 'info');
  };

  const handleUpdateExperienceBullet = (expId: string, bulletIndex: number, newText: string) => {
    setForm((prev) => {
      const updatedExperiences = prev.experiences.map((exp) => {
        if (exp.id !== expId) return exp;
        const nextBullets = [...exp.bullets];
        nextBullets[bulletIndex] = newText;
        return { ...exp, bullets: nextBullets };
      });
      const updated = { ...prev, experiences: updatedExperiences };
      setResult(synthesizeTailoredResume(updated));
      return updated;
    });
  };

  const handleAddExperienceBullet = (expId: string) => {
    setForm((prev) => {
      const updatedExperiences = prev.experiences.map((exp) => {
        if (exp.id !== expId) return exp;
        return {
          ...exp,
          bullets: [...exp.bullets, 'Delivered key feature enhancements driving measurable system velocity.'],
        };
      });
      const updated = { ...prev, experiences: updatedExperiences };
      setResult(synthesizeTailoredResume(updated));
      return updated;
    });
  };

  const handleDeleteExperienceBullet = (expId: string, bulletIndex: number) => {
    setForm((prev) => {
      const updatedExperiences = prev.experiences.map((exp) => {
        if (exp.id !== expId) return exp;
        return {
          ...exp,
          bullets: exp.bullets.filter((_, idx) => idx !== bulletIndex),
        };
      });
      const updated = { ...prev, experiences: updatedExperiences };
      setResult(synthesizeTailoredResume(updated));
      return updated;
    });
  };

  // Education Handlers
  const handleUpdateTenth = (field: keyof SchoolEducationItem, val: string) => {
    setForm((prev) => {
      const updatedTenth: SchoolEducationItem = {
        board: prev.tenthEducation?.board || '',
        percentage: prev.tenthEducation?.percentage || '',
        school: prev.tenthEducation?.school || '',
        year: prev.tenthEducation?.year || '',
        ...prev.tenthEducation,
        [field]: val,
      };
      const updated = { ...prev, tenthEducation: updatedTenth };
      setResult(synthesizeTailoredResume(updated));
      return updated;
    });
  };

  const handleUpdateTwelfth = (field: keyof SchoolEducationItem, val: string) => {
    setForm((prev) => {
      const updatedTwelfth: SchoolEducationItem = {
        board: prev.twelfthEducation?.board || '',
        percentage: prev.twelfthEducation?.percentage || '',
        school: prev.twelfthEducation?.school || '',
        year: prev.twelfthEducation?.year || '',
        stream: prev.twelfthEducation?.stream || '',
        ...prev.twelfthEducation,
        [field]: val,
      };
      const updated = { ...prev, twelfthEducation: updatedTwelfth };
      setResult(synthesizeTailoredResume(updated));
      return updated;
    });
  };

  const handleCreateEducation = () => {
    if (!newEduDegree.trim() || !newEduInstitution.trim()) {
      showToast('Degree and institution are required', 'error');
      return;
    }
    const yearStr = newEduYear.trim() || new Date().getFullYear().toString();
    const isPursuingComputed = isEducationPursuing(yearStr, newEduPursuing);

    const created: ResumeEducationItem = {
      id: `edu-${Date.now()}`,
      degree: newEduDegree.trim(),
      institution: newEduInstitution.trim(),
      graduationYear: yearStr,
      percentage: newEduPercentage.trim() || undefined,
      isPursuing: isPursuingComputed,
      details: newEduDetails.trim() || undefined,
      educationLevel: 'degree',
    };

    setForm((prev) => {
      const updated = { ...prev, education: [created, ...prev.education] };
      setResult(synthesizeTailoredResume(updated));
      return updated;
    });

    setNewEduDegree('');
    setNewEduInstitution('');
    setNewEduYear('');
    setNewEduPercentage('');
    setNewEduPursuing(false);
    setNewEduDetails('');
    setIsAddingEducation(false);
    showToast('Education degree added!', 'success');
  };

  const handleDeleteEducation = (id: string) => {
    setForm((prev) => {
      const updated = { ...prev, education: prev.education.filter((e) => e.id !== id) };
      setResult(synthesizeTailoredResume(updated));
      return updated;
    });
    showToast('Education entry removed', 'info');
  };

  // Skill Handlers
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

  // Export actions
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
    exportResumePdf(result, form.profile, selectedTemplate);
    showToast(`Opening printable ${selectedTemplate.toUpperCase()} PDF...`, 'info');
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

  // Template-specific classes for live preview
  const previewTemplateStyles = {
    modern: {
      font: 'font-sans',
      headerBorder: 'border-b-2 border-emerald-500',
      accentColor: 'text-emerald-700 dark:text-emerald-400',
      accentBg: 'bg-emerald-500/10',
      sectionTitle: 'border-b border-gray-300 uppercase tracking-wider text-gray-900',
    },
    classic: {
      font: 'font-serif',
      headerBorder: 'border-b-2 border-blue-900',
      accentColor: 'text-blue-900 dark:text-blue-400',
      accentBg: 'bg-blue-500/10',
      sectionTitle: 'border-b border-blue-300 uppercase tracking-wide text-blue-950 font-bold',
    },
    minimal: {
      font: 'font-sans',
      headerBorder: 'border-b border-gray-900',
      accentColor: 'text-gray-900 font-mono',
      accentBg: 'bg-gray-100',
      sectionTitle: 'border-b border-gray-200 lowercase tracking-tight text-gray-800 font-semibold',
    },
    academic: {
      font: 'font-serif',
      headerBorder: 'border-b-2 border-slate-700',
      accentColor: 'text-slate-800 dark:text-slate-300',
      accentBg: 'bg-slate-500/10',
      sectionTitle: 'border-b border-slate-300 uppercase tracking-widest text-slate-900 font-semibold',
    },
  }[selectedTemplate];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* ─── PAGE HEADER ────────────────────────────────────────────────────────── */}
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
            Customize personal data, edit work descriptions, select templates, or tailor for Freshers &amp; Students.
          </p>
        </div>

        {/* Experience Level Mode Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-bg-surface border border-border-base">
          <button
            type="button"
            onClick={() => handleToggleFresherMode(false)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              !form.isFresher
                ? 'bg-emerald-500 text-white shadow-xs'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Experienced Pro</span>
          </button>
          <button
            type="button"
            onClick={() => handleToggleFresherMode(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              form.isFresher
                ? 'bg-emerald-500 text-white shadow-xs'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Fresher / Student</span>
          </button>
        </div>
      </div>

      {/* ─── MAIN GRID: CUSTOMIZER (LEFT 5 COLS) VS PREVIEW (RIGHT 7 COLS) ─ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Comprehensive Data & Customization Form */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
              <Edit3 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Resume Editor &amp; Customizer</span>
            </span>
            <span className="text-2xs text-text-muted">Left Panel • Form Controls</span>
          </div>
          <Card3D
            variant="secondary"
            className="p-5 border border-border-base shadow-card backdrop-blur-md space-y-4"
          >
            {/* Form Section Navigation Tabs */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-bg-base rounded-xl border border-border-base text-center">
              <button
                type="button"
                onClick={() => setActiveInputTab('target')}
                className={`py-1.5 px-1 rounded-lg text-2xs font-bold transition-all flex flex-col items-center gap-1 ${
                  activeInputTab === 'target'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                <Target className="w-3.5 h-3.5" />
                <span>Target &amp; Info</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveInputTab('experience')}
                className={`py-1.5 px-1 rounded-lg text-2xs font-bold transition-all flex flex-col items-center gap-1 ${
                  activeInputTab === 'experience'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Experience</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveInputTab('projects')}
                className={`py-1.5 px-1 rounded-lg text-2xs font-bold transition-all flex flex-col items-center gap-1 ${
                  activeInputTab === 'projects'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Projects</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveInputTab('education')}
                className={`py-1.5 px-1 rounded-lg text-2xs font-bold transition-all flex flex-col items-center gap-1 ${
                  activeInputTab === 'education'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Education</span>
              </button>
            </div>

            {/* TAB 1: TARGET JOB SPECIFICATION & PERSONAL CONTACT */}
            {activeInputTab === 'target' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-border-base pb-2">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-emerald-500" />
                    <h2 className="text-sm font-bold text-text-primary">Target Job Specification</h2>
                  </div>
                  <Badge variant="outline" className="text-2xs font-mono">
                    {form.seniority.toUpperCase()}
                  </Badge>
                </div>

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
                        <option value="intern">Intern / Student</option>
                        <option value="junior">Junior / Fresher</option>
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
                        Paste Job Description / Requirements
                      </label>
                      <span className="text-2xs text-text-faint">
                        {form.jobDescription.length} chars
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      value={form.jobDescription}
                      onChange={(e) => setForm({ ...form, jobDescription: e.target.value })}
                      placeholder="Paste the job requirements or keywords to optimize ATS matching..."
                      className="w-full rounded-xl text-xs bg-bg-surface border border-border-base p-2.5 text-text-primary placeholder:text-text-faint focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Candidate Personal Data Sub-section */}
                <div className="pt-3 border-t border-border-base space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-emerald-500" />
                      <h3 className="text-xs font-bold text-text-primary">Personal &amp; Contact Data</h3>
                    </div>
                    {user && (
                      <button
                        type="button"
                        onClick={handleAutofillProfile}
                        className="text-2xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
                      >
                        Sync with Profile
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <label className="block text-2xs font-semibold text-text-muted mb-0.5">
                        Your Full Name *
                      </label>
                      <Input
                        value={form.profile.name}
                        onChange={(e) =>
                          setForm({ ...form, profile: { ...form.profile, name: e.target.value } })
                        }
                        placeholder="e.g. Alex Morgan"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-2xs font-semibold text-text-muted mb-0.5">
                          Email Address *
                        </label>
                        <Input
                          value={form.profile.email}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              profile: { ...form.profile, email: e.target.value },
                            })
                          }
                          placeholder="alex@example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-2xs font-semibold text-text-muted mb-0.5">
                          Phone Number
                        </label>
                        <Input
                          value={form.profile.phone}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              profile: { ...form.profile, phone: e.target.value },
                            })
                          }
                          placeholder="+1 (555) 012-3456"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-2xs font-semibold text-text-muted mb-0.5">
                          Location
                        </label>
                        <Input
                          value={form.profile.location}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              profile: { ...form.profile, location: e.target.value },
                            })
                          }
                          placeholder="City, State / Remote"
                        />
                      </div>
                      <div>
                        <label className="block text-2xs font-semibold text-text-muted mb-0.5">
                          LinkedIn
                        </label>
                        <Input
                          value={form.profile.linkedin}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              profile: { ...form.profile, linkedin: e.target.value },
                            })
                          }
                          placeholder="linkedin.com/in/user"
                        />
                      </div>
                      <div>
                        <label className="block text-2xs font-semibold text-text-muted mb-0.5">
                          GitHub / Portfolio
                        </label>
                        <Input
                          value={form.profile.github}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              profile: { ...form.profile, github: e.target.value },
                            })
                          }
                          placeholder="github.com/user"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PROFESSIONAL EXPERIENCE & BULLETS CUSTOMIZER */}
            {activeInputTab === 'experience' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-border-base pb-2">
                  <div>
                    <h2 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-emerald-500" />
                      <span>Work Experience &amp; Descriptions</span>
                    </h2>
                    <p className="text-2xs text-text-muted">
                      Add positions, edit achievements, or omit for Freshers.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddingExperience(!isAddingExperience)}
                    className="text-2xs h-7"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Job
                  </Button>
                </div>

                {/* Fresher Option: Omit Work History */}
                <div className="p-3 rounded-xl bg-bg-surface/80 border border-border-base flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-text-primary">Fresher / No Corporate Experience?</span>
                    <p className="text-2xs text-text-muted">
                      Omit work history and prioritize Education &amp; Projects.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(form.omitExperience)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setForm((prev) => {
                          const updated = { ...prev, omitExperience: checked };
                          setResult(synthesizeTailoredResume(updated));
                          return updated;
                        });
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-bg-elevated peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                {/* Add Experience Modal Form */}
                {isAddingExperience && (
                  <div className="p-3.5 rounded-xl bg-bg-surface border border-emerald-500/40 space-y-2.5 text-xs">
                    <div className="font-bold text-text-primary text-xs">Add New Work Experience</div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={newExpRole}
                        onChange={(e) => setNewExpRole(e.target.value)}
                        placeholder="Job Title (e.g. Frontend Engineer)"
                      />
                      <Input
                        value={newExpCompany}
                        onChange={(e) => setNewExpCompany(e.target.value)}
                        placeholder="Company (e.g. Acme Tech)"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        value={newExpLocation}
                        onChange={(e) => setNewExpLocation(e.target.value)}
                        placeholder="Location (e.g. Remote)"
                      />
                      <Input
                        value={newExpStartDate}
                        onChange={(e) => setNewExpStartDate(e.target.value)}
                        placeholder="Start Date (e.g. Jan 2023)"
                      />
                      <Input
                        value={newExpEndDate}
                        onChange={(e) => setNewExpEndDate(e.target.value)}
                        placeholder="End Date (e.g. Present)"
                        disabled={newExpCurrent}
                      />
                    </div>
                    <label className="flex items-center gap-2 text-2xs text-text-muted cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newExpCurrent}
                        onChange={(e) => setNewExpCurrent(e.target.checked)}
                        className="rounded text-emerald-500"
                      />
                      <span>I currently work here</span>
                    </label>
                    <div>
                      <label className="block text-2xs font-semibold text-text-muted mb-1">
                        Impact Bullets (One per line)
                      </label>
                      <textarea
                        rows={3}
                        value={newExpBullets}
                        onChange={(e) => setNewExpBullets(e.target.value)}
                        placeholder="Engineered high-throughput API endpoints...&#10;Reduced load times by 35% using caching..."
                        className="w-full rounded-xl text-xs bg-bg-base border border-border-base p-2 text-text-primary focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <Button variant="ghost" size="sm" onClick={() => setIsAddingExperience(false)}>
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleCreateExperience}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white"
                      >
                        Save Experience
                      </Button>
                    </div>
                  </div>
                )}

                {/* Experience Items List with In-place Bullet Editing */}
                {!form.omitExperience && (
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {form.experiences.length === 0 ? (
                      <div className="p-4 rounded-xl border border-dashed border-border-base text-center text-text-muted text-xs">
                        No work experience logged. Click &quot;Add Job&quot; above or toggle Fresher Mode.
                      </div>
                    ) : (
                      form.experiences.map((exp) => (
                        <div
                          key={exp.id}
                          className="p-3 rounded-xl bg-bg-surface border border-border-base space-y-2 text-xs"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="font-bold text-text-primary">{exp.role}</span>
                              <span className="text-emerald-600 dark:text-emerald-400 font-semibold ml-1.5">
                                @ {exp.company}
                              </span>
                              <div className="text-2xs text-text-muted mt-0.5">
                                {exp.location} • {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteExperience(exp.id)}
                              className="text-text-muted hover:text-red-500 p-1 transition-colors"
                              title="Delete position"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Editable Bullet Points */}
                          <div className="space-y-1.5 pt-1 border-t border-border-base">
                            <div className="flex items-center justify-between text-2xs text-text-muted">
                              <span className="font-semibold">Bullet Points ({exp.bullets.length})</span>
                              <button
                                type="button"
                                onClick={() => handleAddExperienceBullet(exp.id)}
                                className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
                              >
                                + Add Bullet
                              </button>
                            </div>
                            {exp.bullets.map((bullet, bIdx) => (
                              <div key={bIdx} className="flex items-start gap-1.5">
                                <span className="text-text-faint text-2xs mt-1.5">•</span>
                                <input
                                  type="text"
                                  value={bullet}
                                  onChange={(e) =>
                                    handleUpdateExperienceBullet(exp.id, bIdx, e.target.value)
                                  }
                                  className="w-full text-xs p-1.5 rounded-lg bg-bg-base border border-border-base text-text-primary focus:outline-none focus:border-emerald-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleDeleteExperienceBullet(exp.id, bIdx)}
                                  className="text-text-faint hover:text-red-500 p-1 text-2xs"
                                  title="Remove bullet"
                                >
                                  &times;
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: FEATURED PROJECTS & TECHNICAL SKILLS */}
            {activeInputTab === 'projects' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-border-base pb-2">
                  <div>
                    <h2 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-emerald-500" />
                      <span>Select Projects to Feature</span>
                    </h2>
                    <p className="text-2xs text-text-muted">
                      Check which projects appear on your tailored resume.
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

                {/* Projects List with Selection Toggles & Delete */}
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {form.projects.map((proj) => (
                    <div
                      key={proj.id}
                      onClick={() => handleToggleProject(proj.id)}
                      className={`p-2.5 rounded-xl border text-xs transition-all flex items-start gap-2.5 cursor-pointer ${
                        proj.selected
                          ? 'bg-emerald-500/5 border-emerald-500/30 text-text-primary'
                          : 'bg-bg-surface/50 border-border-base text-text-muted opacity-60'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={proj.selected}
                        onChange={() => handleToggleProject(proj.id)}
                        className="mt-0.5 rounded text-emerald-500 focus:ring-emerald-500/30 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold truncate">{proj.title}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-2xs font-mono text-text-muted">{proj.role}</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteProject(proj.id)}
                              className="text-text-muted hover:text-red-500 transition"
                              title="Delete project"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
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

                {/* Technical Skills Tuning */}
                <div className="space-y-2 pt-3 border-t border-border-base">
                  <label className="block text-2xs font-semibold text-text-muted">
                    Technical Skills &amp; Stack
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

                  {/* Skills Chips */}
                  <div className="flex flex-wrap gap-1 pt-1 max-h-24 overflow-y-auto">
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
              </div>
            )}

            {/* TAB 4: EDUCATION & ACADEMIC CREDENTIALS */}
            {activeInputTab === 'education' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-border-base pb-2">
                  <div>
                    <h2 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-emerald-500" />
                      <span>Academic Qualifications</span>
                    </h2>
                    <p className="text-2xs text-text-muted">
                      Degree, 12th / Diploma, and 10th School details.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddingEducation(!isAddingEducation)}
                    className="text-2xs h-7"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Degree
                  </Button>
                </div>

                {/* ─── SECTION 1: DEGREE / HIGHER EDUCATION ────────────────────────── */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Degree / Higher Education</span>
                    </span>
                    <span className="text-2xs text-text-muted">B.Tech, B.S., M.S., etc.</span>
                  </div>

                  {isAddingEducation && (
                    <div className="p-3.5 rounded-xl bg-bg-surface border border-emerald-500/40 space-y-2.5 text-xs">
                      <div className="font-bold text-text-primary text-xs flex items-center justify-between">
                        <span>Add Degree / College Education</span>
                        {isEducationPursuing(newEduYear, newEduPursuing) && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            🟢 Pursuing
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          value={newEduDegree}
                          onChange={(e) => setNewEduDegree(e.target.value)}
                          placeholder="Degree (e.g. B.Tech in Computer Science)"
                        />
                        <Input
                          value={newEduInstitution}
                          onChange={(e) => setNewEduInstitution(e.target.value)}
                          placeholder="College / University"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Input
                            value={newEduYear}
                            onChange={(e) => setNewEduYear(e.target.value)}
                            placeholder="Passing Year (e.g. 2027)"
                          />
                          {isEducationPursuing(newEduYear, newEduPursuing) && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-1">
                              Future Year: Automatically tagged as Pursuing
                            </span>
                          )}
                        </div>
                        <Input
                          value={newEduPercentage}
                          onChange={(e) => setNewEduPercentage(e.target.value)}
                          placeholder="CGPA / Percentage (e.g. 8.8 CGPA)"
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-0.5">
                        <input
                          type="checkbox"
                          id="pursuing-checkbox"
                          checked={newEduPursuing}
                          onChange={(e) => setNewEduPursuing(e.target.checked)}
                          className="rounded text-emerald-500 focus:ring-emerald-500/30 cursor-pointer"
                        />
                        <label
                          htmlFor="pursuing-checkbox"
                          className="text-2xs font-medium text-text-primary cursor-pointer"
                        >
                          Mark as Currently Pursuing / Enrolled
                        </label>
                      </div>

                      <Input
                        value={newEduDetails}
                        onChange={(e) => setNewEduDetails(e.target.value)}
                        placeholder="Honors / Coursework (e.g. Specialization in AI & Systems)"
                      />
                      <div className="flex justify-end gap-2 pt-1">
                        <Button variant="ghost" size="sm" onClick={() => setIsAddingEducation(false)}>
                          Cancel
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={handleCreateEducation}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white"
                        >
                          Save Degree
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Existing Degrees List */}
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {form.education.map((edu) => {
                      const isPursuing = isEducationPursuing(edu.graduationYear, edu.isPursuing);
                      return (
                        <div
                          key={edu.id}
                          className="p-3 rounded-xl bg-bg-surface border border-border-base text-xs flex items-start justify-between"
                        >
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-text-primary">{edu.degree}</span>
                              {isPursuing && (
                                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase">
                                  Pursuing
                                </span>
                              )}
                            </div>
                            <div className="text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                              {edu.institution}
                              {edu.percentage && (
                                <span className="text-text-muted text-2xs font-normal">
                                  {' '}
                                  • Score: {edu.percentage}
                                </span>
                              )}
                            </div>
                            <div className="text-2xs text-text-muted mt-0.5">
                              {isPursuing ? 'Expected Passing Year:' : 'Passing Year:'}{' '}
                              <strong className="text-text-primary">{edu.graduationYear}</strong>
                            </div>
                            {edu.details && (
                              <div className="text-2xs text-text-faint mt-1 italic">{edu.details}</div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteEducation(edu.id)}
                            className="text-text-muted hover:text-red-500 transition p-1"
                            title="Delete degree"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ─── SECTION 2: 12TH STANDARD / HIGHER SECONDARY / DIPLOMA ─────── */}
                <div className="p-3.5 rounded-xl bg-bg-surface border border-border-base space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                      <span className="text-xs font-bold text-text-primary">
                        12th Standard / Higher Secondary / Diploma
                      </span>
                    </div>
                    <span className="text-2xs font-mono text-text-muted">Class XII</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-2xs font-semibold text-text-muted mb-0.5">
                        Board Name *
                      </label>
                      <Input
                        value={form.twelfthEducation?.board || ''}
                        onChange={(e) => handleUpdateTwelfth('board', e.target.value)}
                        placeholder="e.g. CBSE, ISC, State Board"
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-2xs font-semibold text-text-muted mb-0.5">
                        Percentage / CGPA *
                      </label>
                      <Input
                        value={form.twelfthEducation?.percentage || ''}
                        onChange={(e) => handleUpdateTwelfth('percentage', e.target.value)}
                        placeholder="e.g. 89.5% or 9.1 CGPA"
                        className="text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="col-span-2">
                      <label className="block text-2xs font-semibold text-text-muted mb-0.5">
                        School / Junior College Name
                      </label>
                      <Input
                        value={form.twelfthEducation?.school || ''}
                        onChange={(e) => handleUpdateTwelfth('school', e.target.value)}
                        placeholder="e.g. Delhi Public School"
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-2xs font-semibold text-text-muted mb-0.5">
                        Passing Year
                      </label>
                      <Input
                        value={form.twelfthEducation?.year || ''}
                        onChange={(e) => handleUpdateTwelfth('year', e.target.value)}
                        placeholder="e.g. 2021"
                        className="text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-2xs font-semibold text-text-muted mb-0.5">
                      Stream (Optional)
                    </label>
                    <Input
                      value={form.twelfthEducation?.stream || ''}
                      onChange={(e) => handleUpdateTwelfth('stream', e.target.value)}
                      placeholder="e.g. Science (PCM), Commerce, Arts"
                      className="text-xs"
                    />
                  </div>
                </div>

                {/* ─── SECTION 3: 10TH STANDARD / SECONDARY SCHOOL ───────────────── */}
                <div className="p-3.5 rounded-xl bg-bg-surface border border-border-base space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-xs font-bold text-text-primary">
                        10th Standard / Secondary School
                      </span>
                    </div>
                    <span className="text-2xs font-mono text-text-muted">Class X</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-2xs font-semibold text-text-muted mb-0.5">
                        Board Name *
                      </label>
                      <Input
                        value={form.tenthEducation?.board || ''}
                        onChange={(e) => handleUpdateTenth('board', e.target.value)}
                        placeholder="e.g. CBSE, ICSE, State Board"
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-2xs font-semibold text-text-muted mb-0.5">
                        Percentage / CGPA *
                      </label>
                      <Input
                        value={form.tenthEducation?.percentage || ''}
                        onChange={(e) => handleUpdateTenth('percentage', e.target.value)}
                        placeholder="e.g. 94.2% or 9.6 CGPA"
                        className="text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="col-span-2">
                      <label className="block text-2xs font-semibold text-text-muted mb-0.5">
                        School Name
                      </label>
                      <Input
                        value={form.tenthEducation?.school || ''}
                        onChange={(e) => handleUpdateTenth('school', e.target.value)}
                        placeholder="e.g. St. Xavier's High School"
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-2xs font-semibold text-text-muted mb-0.5">
                        Passing Year
                      </label>
                      <Input
                        value={form.tenthEducation?.year || ''}
                        onChange={(e) => handleUpdateTenth('year', e.target.value)}
                        placeholder="e.g. 2019"
                        className="text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Primary Action Button */}
            <div className="pt-2 border-t border-border-base">
              <Button
                variant="primary"
                size="md"
                fullWidth
                loading={isGenerating}
                onClick={handleTailor}
                keyboardShortcut="⌘G"
                tooltip="Tailor resume to target role (⌘G)"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-2xs"
                icon={<FileText className="w-4 h-4" />}
              >
                <span>{isGenerating ? 'Formatting Resume...' : 'Format & Tailor Resume'}</span>
              </Button>
            </div>
          </Card3D>
        </div>

        {/* ─── RIGHT COLUMN: TEMPLATES, SUMMARY VARIETY, ATS REPORT & DOCUMENT ── */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-emerald-500" />
              <span>Resume Preview &amp; Export</span>
            </span>
            <span className="text-2xs text-emerald-600 dark:text-emerald-400 font-semibold">
              Right Panel • Live Sync
            </span>
          </div>
          {/* Template Selection Strip */}
          <div className="card p-3.5 border-border-base bg-bg-surface shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-2xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-500" />
                <span>Choose Resume Template</span>
              </span>
              <span className="text-2xs text-emerald-600 dark:text-emerald-400 font-semibold">
                {TEMPLATE_OPTIONS.find((t) => t.id === selectedTemplate)?.name} active
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TEMPLATE_OPTIONS.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleSelectTemplate(tpl.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all relative ${
                    selectedTemplate === tpl.id
                      ? 'border-emerald-500 bg-emerald-500/10 shadow-xs'
                      : 'border-border-base bg-bg-base/70 hover:border-border-hover'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">{tpl.icon}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-bg-surface border border-border-base text-text-muted">
                      {tpl.badge}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-text-primary leading-tight">{tpl.name}</div>
                  <div className="text-[10px] text-text-muted mt-0.5 line-clamp-1">{tpl.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* AI Summary Variations & Direct Edit Strip */}
          {result?.summaryVariations && (
            <div className="card p-3.5 border-border-base bg-bg-surface shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-2xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>AI Professional Summary Variations</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditingSummary(!isEditingSummary)}
                  className="text-2xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>{isEditingSummary ? 'Close Editor' : 'Edit Summary Text'}</span>
                </button>
              </div>

              {/* 3 AI Variation Chips */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSelectSummaryStyle('metrics')}
                  className={`px-2.5 py-2 rounded-xl text-left border transition-all ${
                    selectedSummaryStyle === 'metrics' && !form.customSummary
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold'
                      : 'border-border-base bg-bg-base/60 text-text-muted hover:text-text-primary'
                  }`}
                >
                  <div className="text-2xs font-bold flex items-center gap-1">
                    <span>🚀 Metrics-Driven</span>
                  </div>
                  <div className="text-[10px] text-text-faint mt-0.5 line-clamp-1">
                    Outcomes &amp; scalability
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectSummaryStyle('technical')}
                  className={`px-2.5 py-2 rounded-xl text-left border transition-all ${
                    selectedSummaryStyle === 'technical' && !form.customSummary
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold'
                      : 'border-border-base bg-bg-base/60 text-text-muted hover:text-text-primary'
                  }`}
                >
                  <div className="text-2xs font-bold flex items-center gap-1">
                    <span>🛠️ Technical Depth</span>
                  </div>
                  <div className="text-[10px] text-text-faint mt-0.5 line-clamp-1">
                    Architecture &amp; patterns
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectSummaryStyle('growth')}
                  className={`px-2.5 py-2 rounded-xl text-left border transition-all ${
                    selectedSummaryStyle === 'growth' && !form.customSummary
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold'
                      : 'border-border-base bg-bg-base/60 text-text-muted hover:text-text-primary'
                  }`}
                >
                  <div className="text-2xs font-bold flex items-center gap-1">
                    <span>🌱 Fresher / Growth</span>
                  </div>
                  <div className="text-[10px] text-text-faint mt-0.5 line-clamp-1">
                    Core skills &amp; agility
                  </div>
                </button>
              </div>

              {/* Inline Custom Summary Editor */}
              {isEditingSummary && (
                <div className="p-3 rounded-xl bg-bg-base border border-emerald-500/30 space-y-2">
                  <textarea
                    rows={4}
                    value={summaryEditText}
                    onChange={(e) => setSummaryEditText(e.target.value)}
                    placeholder="Custom resume summary..."
                    className="w-full rounded-lg text-xs bg-bg-surface border border-border-base p-2 text-text-primary focus:outline-none focus:border-emerald-500"
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="xs" onClick={() => setIsEditingSummary(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="xs"
                      onClick={handleSaveCustomSummary}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white"
                    >
                      Apply Custom Text
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

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
                      Real-time analysis against target job description.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-2xs font-semibold text-text-muted block">ATS Match</span>
                    <span className="text-base font-black text-emerald-500">
                      {keywordReport.matchScore}%
                    </span>
                  </div>
                  <div className="text-right border-l border-border-base pl-3">
                    <span className="text-2xs font-semibold text-text-muted block">Readability</span>
                    <span className="text-base font-black text-text-primary">
                      {keywordReport.atsScore}/100
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 text-xs">
                <div>
                  <div className="flex items-center gap-1.5 text-2xs font-semibold text-text-muted mb-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Matched Keywords ({keywordReport.matchedKeywords.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                    {keywordReport.matchedKeywords.map((kw) => (
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
                  className={`p-6 sm:p-8 rounded-xl bg-white text-gray-900 border border-gray-200 shadow-xs space-y-4 max-w-3xl mx-auto transition-all ${previewTemplateStyles.font}`}
                >
                  {/* Candidate Header */}
                  <div className={`text-center pb-3 ${previewTemplateStyles.headerBorder}`}>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                      {form.profile.name}
                    </h2>
                    <div className={`text-sm font-semibold mt-0.5 ${previewTemplateStyles.accentColor}`}>
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
                          <span className={previewTemplateStyles.accentColor}>
                            {form.profile.linkedin}
                          </span>
                        </>
                      )}
                      {form.profile.github && (
                        <>
                          <span>•</span>
                          <span className={previewTemplateStyles.accentColor}>
                            {form.profile.github}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Summary */}
                  <div>
                    <h3 className={`text-xs pb-0.5 mb-1.5 ${previewTemplateStyles.sectionTitle}`}>
                      Professional Summary
                    </h3>
                    <p className="text-xs text-gray-700 leading-relaxed text-justify">
                      {result.summary}
                    </p>
                  </div>

                  {/* Technical Skills */}
                  <div>
                    <h3 className={`text-xs pb-0.5 mb-1.5 ${previewTemplateStyles.sectionTitle}`}>
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

                  {/* If Fresher: Education is presented right here above Projects */}
                  {form.isFresher && result.education.length > 0 && (
                    <div>
                      <h3 className={`text-xs pb-0.5 mb-1.5 ${previewTemplateStyles.sectionTitle}`}>
                        Education &amp; Qualifications
                      </h3>
                      <div className="space-y-1.5 text-xs">
                        {result.education.map((edu, idx) => (
                          <div
                            key={idx}
                            className="flex items-baseline justify-between border-b border-gray-100 last:border-b-0 pb-1 pt-1"
                          >
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-gray-900">{edu.degree}</span>
                                {edu.isPursuing && (
                                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    Pursuing
                                  </span>
                                )}
                              </div>
                              <div className="text-gray-700 text-2xs mt-0.5">
                                <span className={previewTemplateStyles.accentColor}>
                                  {edu.institution}
                                </span>
                                {edu.percentage && (
                                  <span>
                                    {' '}
                                    • Score: <strong className="text-gray-900">{edu.percentage}</strong>
                                  </span>
                                )}
                                {edu.board && <span> • Board: {edu.board}</span>}
                                {edu.stream && <span> • {edu.stream}</span>}
                              </div>
                              {edu.details &&
                                !edu.details.includes('Percentage:') &&
                                !edu.details.includes('Board:') && (
                                  <div className="text-2xs text-gray-500 italic mt-0.5">
                                    {edu.details}
                                  </div>
                                )}
                            </div>
                            <span className="text-[11px] text-gray-600 font-medium whitespace-nowrap pl-2">
                              {edu.year}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Selected Featured Projects */}
                  {result.tailoredProjects.length > 0 && (
                    <div>
                      <h3 className={`text-xs pb-0.5 mb-2 ${previewTemplateStyles.sectionTitle}`}>
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

                  {/* Professional Experience (omitted if Fresher without experience) */}
                  {!form.omitExperience && result.tailoredExperiences.length > 0 && (
                    <div>
                      <h3 className={`text-xs pb-0.5 mb-2 ${previewTemplateStyles.sectionTitle}`}>
                        Professional Experience
                      </h3>
                      <div className="space-y-3">
                        {result.tailoredExperiences.map((exp, idx) => (
                          <div key={idx} className="text-xs">
                            <div className="flex items-baseline justify-between">
                              <span className="font-bold text-gray-900">
                                {exp.role} |{' '}
                                <span className={previewTemplateStyles.accentColor}>
                                  {exp.company}
                                </span>
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

                  {/* Education for Experienced Pros (at the bottom) */}
                  {!form.isFresher && result.education.length > 0 && (
                    <div>
                      <h3 className={`text-xs pb-0.5 mb-1.5 ${previewTemplateStyles.sectionTitle}`}>
                        Education
                      </h3>
                      <div className="space-y-1 text-xs">
                        {result.education.map((edu, idx) => (
                          <div
                            key={idx}
                            className="flex items-baseline justify-between border-b border-gray-100 last:border-b-0 pb-1 pt-1"
                          >
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-gray-900">{edu.degree}</span>
                                {edu.isPursuing && (
                                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    Pursuing
                                  </span>
                                )}
                              </div>
                              <div className="text-gray-700 text-2xs mt-0.5">
                                <span className={previewTemplateStyles.accentColor}>
                                  {edu.institution}
                                </span>
                                {edu.percentage && (
                                  <span>
                                    {' '}
                                    • Score: <strong className="text-gray-900">{edu.percentage}</strong>
                                  </span>
                                )}
                                {edu.board && <span> • Board: {edu.board}</span>}
                                {edu.stream && <span> • {edu.stream}</span>}
                              </div>
                              {edu.details &&
                                !edu.details.includes('Percentage:') &&
                                !edu.details.includes('Board:') && (
                                  <div className="text-2xs text-gray-500 italic mt-0.5">
                                    {edu.details}
                                  </div>
                                )}
                            </div>
                            <span className="text-[11px] text-gray-600 font-medium whitespace-nowrap pl-2">
                              {edu.year}
                            </span>
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
