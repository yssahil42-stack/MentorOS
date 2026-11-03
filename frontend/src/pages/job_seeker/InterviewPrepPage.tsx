import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  BookOpen,
  DollarSign,
  ExternalLink,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Star,
  Sparkles,
  Building2,
  TrendingUp,
  Filter,
  Plus,
  Trash2,
  Award,
  Layers,
  HelpCircle,
  Briefcase,
} from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { Card3D } from '../../components/ui/Card3D';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import type {
  InterviewQuestion,
  QuestionCategory,
  QuestionDifficulty,
  PracticeAnswer,
  SalaryResearchEntry,
} from '../../types/interview';
import {
  CURATED_QUESTIONS,
  getFilteredQuestions,
  getPracticeAnswers,
  savePracticeAnswer,
  getSalaryEntries,
  saveSalaryEntry,
  deleteSalaryEntry,
  generateLevelsFyiLink,
} from '../../services/interviewService';

const COMPANIES = [
  'All Companies',
  'Google',
  'Meta',
  'Stripe',
  'Amazon',
  'Netflix',
  'General / Tech Startups',
];

const ROLES = ['All Roles', 'Frontend Engineer', 'Full-Stack Engineer', 'Backend Engineer'];

const CATEGORIES: { id: QuestionCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All Categories' },
  { id: 'behavioral', label: 'Behavioral (STAR)' },
  { id: 'technical', label: 'Technical' },
  { id: 'system_design', label: 'System Design' },
  { id: 'culture', label: 'Company Values' },
];

export default function InterviewPrepPage() {
  const { showToast } = useWorkspace();

  const [activeTab, setActiveTab] = useState<'questions' | 'salary'>('questions');

  // Question Filters
  const [selectedCompany, setSelectedCompany] = useState('All Companies');
  const [selectedRole, setSelectedRole] = useState('All Roles');
  const [selectedCategory, setSelectedCategory] = useState<QuestionCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Expandable question card state
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});
  const [practiceAnswers, setPracticeAnswers] = useState<Record<string, PracticeAnswer>>({});

  // Salary Research State
  const [salaryEntries, setSalaryEntries] = useState<SalaryResearchEntry[]>([]);
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [searchLevelsCompany, setSearchLevelsCompany] = useState('Google');
  const [searchLevelsRole, setSearchLevelsRole] = useState('software-engineer');

  // Salary Form state
  const [salCompany, setSalCompany] = useState('');
  const [salRole, setSalRole] = useState('');
  const [salLevel, setSalLevel] = useState('L4 / Mid-Level');
  const [salLocation, setSalLocation] = useState('Remote US');
  const [salBase, setSalBase] = useState(160000);
  const [salStock, setSalStock] = useState(60000);
  const [salBonus, setSalBonus] = useState(20000);
  const [salNotes, setSalNotes] = useState('');
  const [salStrategy, setSalStrategy] = useState('');

  // Computed total compensation
  const computedTotalComp = Number(salBase || 0) + Number(salStock || 0) + Number(salBonus || 0);

  // Load initial progress and salary entries
  useEffect(() => {
    setPracticeAnswers(getPracticeAnswers());
    setSalaryEntries(getSalaryEntries());
  }, []);

  // Filtered Questions
  const filteredQuestions = useMemo(() => {
    return getFilteredQuestions({
      company: selectedCompany,
      role: selectedRole,
      category: selectedCategory,
      searchQuery,
    });
  }, [selectedCompany, selectedRole, selectedCategory, searchQuery]);

  const toggleExpand = (id: string) => {
    setExpandedQuestions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleToggleMastered = (questionId: string) => {
    const existing = practiceAnswers[questionId] || {
      questionId,
      notes: '',
      confidenceRating: 3,
      mastered: false,
      lastPracticedAt: new Date().toISOString(),
    };

    const updated: PracticeAnswer = {
      ...existing,
      mastered: !existing.mastered,
      lastPracticedAt: new Date().toISOString(),
    };

    savePracticeAnswer(updated);
    setPracticeAnswers((prev) => ({ ...prev, [questionId]: updated }));
    showToast(updated.mastered ? 'Marked as mastered!' : 'Unmarked question', 'info');
  };

  const handleUpdateNotes = (questionId: string, notes: string) => {
    const existing = practiceAnswers[questionId] || {
      questionId,
      notes: '',
      confidenceRating: 3,
      mastered: false,
      lastPracticedAt: new Date().toISOString(),
    };

    const updated: PracticeAnswer = {
      ...existing,
      notes,
      lastPracticedAt: new Date().toISOString(),
    };

    savePracticeAnswer(updated);
    setPracticeAnswers((prev) => ({ ...prev, [questionId]: updated }));
  };

  const handleSaveSalary = () => {
    if (!salCompany.trim() || !salRole.trim()) {
      showToast('Company and Role are required', 'error');
      return;
    }

    const created = saveSalaryEntry({
      company: salCompany.trim(),
      role: salRole.trim(),
      level: salLevel.trim(),
      location: salLocation.trim(),
      baseSalary: Number(salBase || 0),
      stockGrantPerYear: Number(salStock || 0),
      bonus: Number(salBonus || 0),
      totalComp: computedTotalComp,
      currency: 'USD',
      levelsFyiUrl: generateLevelsFyiLink(salCompany.trim(), salRole.trim()),
      notes: salNotes.trim(),
      negotiationStrategy: salStrategy.trim(),
    });

    setSalaryEntries((prev) => [created, ...prev]);
    setIsSalaryModalOpen(false);
    showToast('Salary benchmark saved!', 'success');
  };

  const handleDeleteSalary = (id: string) => {
    deleteSalaryEntry(id);
    setSalaryEntries((prev) => prev.filter((s) => s.id !== id));
    showToast('Entry removed', 'info');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* ─── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border-base">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
              Interview Prep &amp; Compensation Guide
            </h1>
            <span className="px-2 py-0.5 rounded-full text-2xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              STAR &amp; Levels.fyi
            </span>
          </div>
          <p className="text-xs sm:text-sm text-text-muted">
            Curated company question banks (STAR method, system design) and Levels.fyi salary
            benchmarks.
          </p>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center gap-1.5 bg-bg-base p-1 rounded-xl border border-border-base">
          <button
            type="button"
            onClick={() => setActiveTab('questions')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'questions'
                ? 'bg-emerald-500 text-white shadow-2xs'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Question Banks ({CURATED_QUESTIONS.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('salary')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'salary'
                ? 'bg-emerald-500 text-white shadow-2xs'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Salary &amp; Levels.fyi ({salaryEntries.length})</span>
          </button>
        </div>
      </div>

      {/* ─── TAB 1: CURATED QUESTION BANKS ──────────────────────────────────── */}
      {activeTab === 'questions' && (
        <div className="space-y-5">
          {/* Filters Bar */}
          <Card3D variant="secondary" className="p-4 border border-border-base space-y-3">
            {/* Search and Role Select */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-text-faint absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search questions by keywords, concepts, or algorithms..."
                  className="pl-9 text-xs"
                />
              </div>

              <div className="w-full sm:w-56">
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full rounded-xl text-xs bg-bg-surface border border-border-base p-2 text-text-primary focus:outline-none focus:border-emerald-500"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Company Pills */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-border-base">
              <span className="text-2xs font-semibold text-text-muted mr-1">Target Company:</span>
              {COMPANIES.map((company) => (
                <button
                  key={company}
                  type="button"
                  onClick={() => setSelectedCompany(company)}
                  className={`px-2.5 py-1 rounded-lg text-2xs font-medium transition-colors ${
                    selectedCompany === company
                      ? 'bg-emerald-500 text-white font-bold shadow-2xs'
                      : 'bg-bg-surface border border-border-base text-text-muted hover:text-text-primary'
                  }`}
                >
                  {company}
                </button>
              ))}
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-border-base">
              <span className="text-2xs font-semibold text-text-muted mr-1">Category:</span>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-lg text-2xs font-medium transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 font-bold'
                      : 'bg-bg-surface border border-border-base text-text-muted hover:text-text-primary'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </Card3D>

          {/* Questions Grid */}
          <div className="space-y-4">
            {filteredQuestions.length === 0 ? (
              <div className="p-12 text-center text-xs text-text-faint border border-dashed border-border-base rounded-2xl bg-bg-surface/30">
                No interview questions match your filter criteria.
              </div>
            ) : (
              filteredQuestions.map((q) => {
                const isExpanded = expandedQuestions[q.id] || false;
                const practice = practiceAnswers[q.id];
                const isMastered = practice?.mastered || false;

                return (
                  <Card3D
                    key={q.id}
                    variant="secondary"
                    className={`p-4 sm:p-5 border transition-all text-xs space-y-3 ${
                      isMastered ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border-base'
                    }`}
                  >
                    {/* Question Header & Meta Badges */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-bg-elevated border border-border-base text-text-primary">
                            {q.company}
                          </span>
                          <span className="text-2xs font-mono text-text-muted">{q.role}</span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                            {q.category.replace('_', ' ')}
                          </span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                              q.difficulty === 'hard'
                                ? 'bg-red-500/10 text-red-500'
                                : q.difficulty === 'medium'
                                  ? 'bg-amber-500/10 text-amber-500'
                                  : 'bg-emerald-500/10 text-emerald-500'
                            }`}
                          >
                            {q.difficulty}
                          </span>
                        </div>

                        {/* The Question Text */}
                        <h3 className="text-sm font-bold text-text-primary leading-snug">
                          {q.question}
                        </h3>
                      </div>

                      {/* Mastered Checkbox Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleMastered(q.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-2xs font-bold transition-all shrink-0 ${
                          isMastered
                            ? 'bg-emerald-500 text-white shadow-2xs'
                            : 'bg-bg-elevated border border-border-base text-text-muted hover:text-text-primary'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isMastered ? 'Mastered' : 'Mark Mastered'}</span>
                      </button>
                    </div>

                    {/* Key Discussion Points Chips */}
                    <div className="space-y-1 pt-1 border-t border-border-base/50">
                      <span className="text-2xs font-semibold text-text-muted">
                        Key Points to Hit in Your Answer:
                      </span>
                      <ul className="list-disc ml-4 space-y-0.5 text-2xs text-text-secondary">
                        {q.keyPointsToCover.map((pt, i) => (
                          <li key={i}>{pt}</li>
                        ))}
                      </ul>
                    </div>

                    {/* STAR Framework Breakdown (if available) */}
                    {q.starFramework && (
                      <div className="p-3.5 rounded-xl bg-bg-surface border border-emerald-500/20 space-y-2">
                        <div className="flex items-center gap-1.5 text-2xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                          <Star className="w-3.5 h-3.5" />
                          <span>STAR Method Framework Guide</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-2xs">
                          <div className="p-2 rounded-lg bg-bg-base border border-border-base">
                            <strong className="text-emerald-500 block mb-0.5">
                              S — Situation:
                            </strong>
                            <p className="text-text-muted">{q.starFramework.situation}</p>
                          </div>
                          <div className="p-2 rounded-lg bg-bg-base border border-border-base">
                            <strong className="text-emerald-500 block mb-0.5">T — Task:</strong>
                            <p className="text-text-muted">{q.starFramework.task}</p>
                          </div>
                          <div className="p-2 rounded-lg bg-bg-base border border-border-base">
                            <strong className="text-emerald-500 block mb-0.5">A — Action:</strong>
                            <p className="text-text-muted">{q.starFramework.action}</p>
                          </div>
                          <div className="p-2 rounded-lg bg-bg-base border border-border-base">
                            <strong className="text-emerald-500 block mb-0.5">R — Result:</strong>
                            <p className="text-text-muted">{q.starFramework.result}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Collapsible Sample Answer */}
                    {q.sampleAnswer && (
                      <div>
                        <button
                          type="button"
                          onClick={() => toggleExpand(q.id)}
                          className="flex items-center gap-1 text-2xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                        >
                          <span>
                            {isExpanded
                              ? 'Hide Sample Architecture & Strategy'
                              : 'View Sample Answer & Strategy'}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )}
                        </button>

                        {isExpanded && (
                          <div className="mt-2 p-3 rounded-xl bg-bg-base/80 border border-border-base text-2xs text-text-secondary leading-relaxed font-mono">
                            {q.sampleAnswer}
                          </div>
                        )}
                      </div>
                    )}

                    {/* User Practice Notes */}
                    <div className="pt-2 border-t border-border-base/50">
                      <textarea
                        rows={2}
                        value={practice?.notes || ''}
                        onChange={(e) => handleUpdateNotes(q.id, e.target.value)}
                        placeholder="Draft your personal talking points, project analogies, or metrics for this question..."
                        className="w-full rounded-xl text-2xs bg-bg-base border border-border-base p-2 text-text-primary placeholder:text-text-faint focus:outline-none focus:border-emerald-500 leading-relaxed"
                      />
                    </div>
                  </Card3D>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 2: SALARY INTELLIGENCE & LEVELS.FYI BENCHMARKS ─────────────── */}
      {activeTab === 'salary' && (
        <div className="space-y-6">
          {/* Levels.fyi Quick Search Bar */}
          <Card3D variant="secondary" className="p-5 border border-border-base space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <span>Levels.fyi Real-Time Compensation Reference</span>
                </h2>
                <p className="text-2xs text-text-muted">
                  Cross-reference verified base, stock grants, and sign-on bonuses on Levels.fyi.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsSalaryModalOpen(true)}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
                  icon={<Plus className="w-4 h-4" />}
                >
                  <span>Add Salary Target</span>
                </Button>
              </div>
            </div>

            {/* Quick Lookup Toolbar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-border-base">
              <div>
                <label className="block text-2xs font-semibold text-text-muted mb-1">Company</label>
                <Input
                  value={searchLevelsCompany}
                  onChange={(e) => setSearchLevelsCompany(e.target.value)}
                  placeholder="e.g. Google, Stripe, Meta"
                  className="text-xs"
                />
              </div>
              <div>
                <label className="block text-2xs font-semibold text-text-muted mb-1">
                  Role Title
                </label>
                <Input
                  value={searchLevelsRole}
                  onChange={(e) => setSearchLevelsRole(e.target.value)}
                  placeholder="e.g. software-engineer"
                  className="text-xs"
                />
              </div>
              <div className="flex items-end">
                <a
                  href={generateLevelsFyiLink(searchLevelsCompany, searchLevelsRole)}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-xl text-xs font-bold bg-bg-surface border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors shadow-2xs"
                >
                  <span>Open {searchLevelsCompany || 'Company'} on Levels.fyi</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </Card3D>

          {/* Saved Salary Benchmarks & Negotiation Strategy */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {salaryEntries.map((entry) => (
              <Card3D
                key={entry.id}
                variant="secondary"
                className="p-5 border border-border-base shadow-card flex flex-col justify-between text-xs space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-1">
                    <div>
                      <span className="font-bold text-text-primary text-sm">{entry.company}</span>
                      <div className="text-2xs text-text-muted font-medium">{entry.role}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteSalary(entry.id)}
                      className="text-text-faint hover:text-red-500 p-1"
                      title="Delete Entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 pt-1 text-2xs text-text-muted flex-wrap">
                    <span className="px-1.5 py-0.2 rounded bg-bg-base border border-border-base font-mono">
                      {entry.level}
                    </span>
                    <span>•</span>
                    <span>{entry.location}</span>
                  </div>

                  {/* Compensation Breakdown */}
                  <div className="mt-3 p-3 rounded-xl bg-bg-base/70 border border-border-base space-y-1.5">
                    <div className="flex justify-between items-baseline text-2xs">
                      <span className="text-text-muted">Base Salary:</span>
                      <span className="font-mono font-semibold text-text-primary">
                        ${entry.baseSalary.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline text-2xs">
                      <span className="text-text-muted">Stock / Equity (yr):</span>
                      <span className="font-mono font-semibold text-text-primary">
                        ${entry.stockGrantPerYear.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline text-2xs">
                      <span className="text-text-muted">Annual Bonus:</span>
                      <span className="font-mono font-semibold text-text-primary">
                        ${entry.bonus.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline pt-1 border-t border-border-base font-bold">
                      <span className="text-text-primary">Total Comp:</span>
                      <span className="font-mono text-sm text-emerald-500">
                        ${entry.totalComp.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Negotiation Strategy Notes */}
                  {entry.negotiationStrategy && (
                    <div className="mt-2 text-2xs text-text-muted italic bg-bg-surface p-2 rounded-lg border border-border-base/50">
                      <strong>Strategy:</strong> {entry.negotiationStrategy}
                    </div>
                  )}
                </div>

                {/* Levels.fyi Direct Link */}
                <div className="pt-2 border-t border-border-base">
                  <a
                    href={entry.levelsFyiUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-2xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                  >
                    <span>Verify on Levels.fyi</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </Card3D>
            ))}
          </div>
        </div>
      )}

      {/* ─── ADD SALARY ENTRY MODAL ────────────────────────────────────────── */}
      <Modal
        isOpen={isSalaryModalOpen}
        onClose={() => setIsSalaryModalOpen(false)}
        title="Record Salary Benchmark"
        description="Manual entry with automatic Levels.fyi verification links."
        size="md"
      >
        <div className="space-y-4 text-xs pt-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-2xs font-semibold text-text-muted mb-1">Company *</label>
              <Input
                value={salCompany}
                onChange={(e) => setSalCompany(e.target.value)}
                placeholder="e.g. Stripe, Google"
              />
            </div>
            <div>
              <label className="block text-2xs font-semibold text-text-muted mb-1">
                Role Title *
              </label>
              <Input
                value={salRole}
                onChange={(e) => setSalRole(e.target.value)}
                placeholder="e.g. Software Engineer"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-2xs font-semibold text-text-muted mb-1">
                Level / Band
              </label>
              <Input
                value={salLevel}
                onChange={(e) => setSalLevel(e.target.value)}
                placeholder="e.g. L4, E5, Senior"
              />
            </div>
            <div>
              <label className="block text-2xs font-semibold text-text-muted mb-1">Location</label>
              <Input
                value={salLocation}
                onChange={(e) => setSalLocation(e.target.value)}
                placeholder="e.g. Remote US, San Francisco"
              />
            </div>
          </div>

          {/* Numeric Breakdown */}
          <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-bg-base border border-border-base">
            <div>
              <label className="block text-2xs font-semibold text-text-muted mb-1">Base ($)</label>
              <Input
                type="number"
                value={salBase}
                onChange={(e) => setSalBase(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-2xs font-semibold text-text-muted mb-1">
                Stock/Yr ($)
              </label>
              <Input
                type="number"
                value={salStock}
                onChange={(e) => setSalStock(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-2xs font-semibold text-text-muted mb-1">Bonus ($)</label>
              <Input
                type="number"
                value={salBonus}
                onChange={(e) => setSalBonus(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
            <span className="text-2xs font-semibold text-emerald-600 dark:text-emerald-400">
              Total Computed Compensation:
            </span>
            <span className="text-base font-extrabold font-mono text-emerald-500">
              ${computedTotalComp.toLocaleString()} / yr
            </span>
          </div>

          <div>
            <label className="block text-2xs font-semibold text-text-muted mb-1">
              Negotiation Counter &amp; Leverage Strategy
            </label>
            <textarea
              rows={2}
              value={salStrategy}
              onChange={(e) => setSalStrategy(e.target.value)}
              placeholder="e.g. Counter with 75th percentile equity band if sign-on bonus is under $30k..."
              className="w-full rounded-xl text-xs bg-bg-surface border border-border-base p-2.5 text-text-primary placeholder:text-text-faint focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border-base">
            <Button variant="ghost" size="sm" onClick={() => setIsSalaryModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveSalary}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
            >
              Save Benchmark
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
