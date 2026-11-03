import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  FileText,
  Download,
  Printer,
  Copy,
  Check,
  Code2,
  ExternalLink,
  Plus,
  Trash2,
  Layers,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  BookOpen,
  Share2,
} from 'lucide-react';
import { Card3D } from '../../components/ui/Card3D';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import {
  generatePortfolio,
  synthesizePortfolio,
  exportMarkdown,
  exportPdf,
  savePortfolioDraft,
  loadPortfolioDrafts,
} from '../../services/portfolioService';
import type {
  ProjectInputData,
  ProjectCategory,
  GeneratedPortfolioResult,
} from '../../types/portfolio';

const SAMPLE_PROJECTS: Record<string, ProjectInputData> = {
  saas: {
    title: 'MentorOS Productivity Engine',
    tagline: 'Local-first AI workspace orchestrating milestones, tasks, and role-scoped delivery.',
    category: 'Full-Stack',
    description:
      'A multi-role workspace application built for developers, freelancers, students, and job seekers to eliminate cognitive overhead and automate project workflows.',
    techStack: ['React', 'TypeScript', 'TailwindCSS', 'TanStack Query', 'FastAPI'],
    features: [
      'Role-scoped workspaces with tailored dashboard metrics',
      'Local AI proposal streaming with review and batch approval drawers',
      'Continuous deployment tracking with tech debt scoring',
      'Responsive calendar and daily standup progress widgets',
    ],
    challenges:
      'Legacy productivity applications relied on fragmented tools and excessive cloud API latency. Synchronizing complex state across four user personas required robust domain boundary isolation.',
    solution:
      'Engineered a unified single-page application using TanStack Query, typed service gateways, and centralized design variant tokens, cutting render cycles and network churn by 60%.',
    metrics: [
      { label: 'Latency Reduction', value: '62%' },
      { label: 'Test Coverage', value: '95%' },
      { label: 'Bundle Size', value: '112 kB gzip' },
    ],
    githubUrl: 'https://github.com/developer/mentoros',
    liveUrl: 'https://mentoros.app',
    architectureDetails:
      'Layered modular architecture with centralized API client interceptors, debounced filter pipelines, and automated CI test verification.',
  },
  ecommerce: {
    title: 'Nordic Storefront Modernization',
    tagline: 'Ultra-low latency headless commerce platform built for peak flash sales.',
    category: 'Frontend',
    description:
      'A high-concurrency modern storefront replacing an aging monolithic e-commerce engine with sub-second page loads.',
    techStack: ['Next.js', 'TypeScript', 'TailwindCSS', 'Redis', 'Stripe'],
    features: [
      'Instant optimistic cart state updates',
      'Edge SSR product catalog rendering',
      'Automated international tax and currency conversion',
    ],
    challenges:
      'Legacy monolith suffered cascading timeout errors during holiday promotions with checkouts exceeding 8 seconds.',
    solution:
      'Migrated to headless edge architecture with cached product endpoints and resilient payment webhooks.',
    metrics: [
      { label: 'Conversion Lift', value: '+42%' },
      { label: 'P95 Latency', value: '48ms' },
      { label: 'Uptime', value: '99.99%' },
    ],
    githubUrl: 'https://github.com/developer/nordic-storefront',
    liveUrl: 'https://nordicapparel.example.com',
    architectureDetails:
      'Distributed edge cache workers sitting in front of microservice checkout and inventory APIs.',
  },
};

export default function PortfolioGeneratorPage() {
  const { showToast } = useWorkspace();

  const [form, setForm] = useState<ProjectInputData>(SAMPLE_PROJECTS.saas);
  const [techInput, setTechInput] = useState('');
  const [featureInput, setFeatureInput] = useState('');
  const [metricLabel, setMetricLabel] = useState('');
  const [metricValue, setMetricValue] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<GeneratedPortfolioResult | null>(null);
  const [activeTab, setActiveTab] = useState<'readme' | 'casestudy'>('readme');
  const [viewMode, setViewMode] = useState<'preview' | 'raw'>('preview');
  const [copied, setCopied] = useState(false);

  // Initialize with initial synthesized preview
  useEffect(() => {
    const initial = synthesizePortfolio(SAMPLE_PROJECTS.saas);
    setGeneratedResult(initial);
  }, []);

  const handleLoadSample = (sampleKey: 'saas' | 'ecommerce') => {
    const selected = SAMPLE_PROJECTS[sampleKey];
    setForm(selected);
    const result = synthesizePortfolio(selected);
    setGeneratedResult(result);
    showToast(`Loaded ${selected.title} sample`, 'info');
  };

  const handleAddTech = () => {
    if (!techInput.trim()) return;
    if (!form.techStack.includes(techInput.trim())) {
      setForm((prev) => ({ ...prev, techStack: [...prev.techStack, techInput.trim()] }));
    }
    setTechInput('');
  };

  const handleRemoveTech = (tech: string) => {
    setForm((prev) => ({ ...prev, techStack: prev.techStack.filter((t) => t !== tech) }));
  };

  const handleAddFeature = () => {
    if (!featureInput.trim()) return;
    setForm((prev) => ({ ...prev, features: [...prev.features, featureInput.trim()] }));
    setFeatureInput('');
  };

  const handleRemoveFeature = (idx: number) => {
    setForm((prev) => ({ ...prev, features: prev.features.filter((_, i) => i !== idx) }));
  };

  const handleAddMetric = () => {
    if (!metricLabel.trim() || !metricValue.trim()) return;
    setForm((prev) => ({
      ...prev,
      metrics: [...prev.metrics, { label: metricLabel.trim(), value: metricValue.trim() }],
    }));
    setMetricLabel('');
    setMetricValue('');
  };

  const handleRemoveMetric = (idx: number) => {
    setForm((prev) => ({ ...prev, metrics: prev.metrics.filter((_, i) => i !== idx) }));
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const result = await generatePortfolio(form);
      setGeneratedResult(result);
      savePortfolioDraft(result);
      showToast('README and Case Study generated successfully!', 'success');
    } catch {
      showToast('Failed to generate portfolio document', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const currentMarkdown =
    activeTab === 'readme'
      ? generatedResult?.readme.markdown || ''
      : generatedResult?.caseStudy.markdown || '';

  const handleCopy = () => {
    if (!currentMarkdown) return;
    navigator.clipboard.writeText(currentMarkdown);
    setCopied(true);
    showToast('Markdown copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportMd = () => {
    if (!currentMarkdown) return;
    const filename =
      activeTab === 'readme'
        ? `${form.title.toLowerCase().replace(/\s+/g, '-')}-README.md`
        : `${form.title.toLowerCase().replace(/\s+/g, '-')}-CaseStudy.md`;
    exportMarkdown(currentMarkdown, filename);
    showToast(`Exported ${filename}`, 'success');
  };

  const handleExportPdf = () => {
    if (!currentMarkdown) return;
    const filename = `${form.title.toLowerCase().replace(/\s+/g, '-')}-${activeTab}`;
    exportPdf(form.title, currentMarkdown, filename);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* ─── Header & Breadcrumb Banner ────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-bg-surface via-bg-elevated to-bg-surface border border-border-base p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-2xs font-mono text-text-muted">
              <Link
                to="/app/developer/dashboard"
                className="hover:text-text-primary transition-colors"
              >
                Developer
              </Link>
              <span>/</span>
              <span className="text-orange-500 font-semibold">Portfolio Generator</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-orange-500" />
              <span>AI Portfolio &amp; README Generator</span>
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary max-w-2xl">
              Turn your raw project architecture, metrics, and milestones into polished, open-source
              READMEs and portfolio case studies. Export directly to Markdown or PDF.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleLoadSample('saas')}
              className="text-xs"
            >
              Load SaaS Sample
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleLoadSample('ecommerce')}
              className="text-xs"
            >
              Load E-Commerce Sample
            </Button>
            <Link to="/portfolio/alex-engineer">
              <Button
                variant="primary"
                size="sm"
                className="bg-orange-500 hover:bg-orange-600 text-white shadow-2xs"
              >
                <span>Live Portfolio</span>
                <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Main Two-Column Layout ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Project Input Data (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          <Card3D
            variant="secondary"
            className="p-5 sm:p-6 border border-border-base shadow-card backdrop-blur-md space-y-4"
          >
            <div className="pb-3 border-b border-border-base flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-orange-500" />
                <h2 className="text-sm font-bold text-text-primary">Project Specification</h2>
              </div>
              <Badge variant="default" size="sm">
                Input Data
              </Badge>
            </div>

            {/* Title & Tagline */}
            <div className="space-y-3">
              <div>
                <label className="block text-2xs font-semibold text-text-muted mb-1">
                  Project Title *
                </label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. MentorOS Productivity Engine"
                />
              </div>

              <div>
                <label className="block text-2xs font-semibold text-text-muted mb-1">
                  Tagline / Punchline
                </label>
                <Input
                  value={form.tagline}
                  onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                  placeholder="e.g. Local AI workspace orchestrating milestones"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-2xs font-semibold text-text-muted mb-1">
                    Category
                  </label>
                  <Select
                    value={form.category}
                    onChange={(e: any) =>
                      setForm({ ...form, category: e.target.value as ProjectCategory })
                    }
                    options={[
                      { value: 'Full-Stack', label: 'Full-Stack' },
                      { value: 'Frontend', label: 'Frontend' },
                      { value: 'Backend & API', label: 'Backend & API' },
                      { value: 'Mobile App', label: 'Mobile App' },
                      { value: 'AI & Machine Learning', label: 'AI & ML' },
                      { value: 'DevOps & Cloud', label: 'DevOps & Cloud' },
                      { value: 'Open Source', label: 'Open Source' },
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-2xs font-semibold text-text-muted mb-1">
                    Live Demo URL
                  </label>
                  <Input
                    value={form.liveUrl || ''}
                    onChange={(e) => setForm({ ...form, liveUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-2xs font-semibold text-text-muted mb-1">
                  GitHub Repository URL
                </label>
                <Input
                  value={form.githubUrl || ''}
                  onChange={(e) => setForm({ ...form, githubUrl: e.target.value })}
                  placeholder="https://github.com/..."
                />
              </div>

              <div>
                <label className="block text-2xs font-semibold text-text-muted mb-1">
                  Detailed Description
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Provide an overview of the application and its purpose..."
                  className="w-full rounded-xl text-xs bg-bg-surface border border-border-base p-2.5 text-text-primary placeholder:text-text-faint focus:outline-none focus:border-solar-500 focus:ring-1 focus:ring-solar-500/50"
                />
              </div>
            </div>

            {/* Tech Stack Chips */}
            <div className="space-y-2 pt-2 border-t border-border-base">
              <label className="block text-2xs font-semibold text-text-muted">
                Tech Stack Tags
              </label>
              <div className="flex gap-2">
                <Input
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTech())}
                  placeholder="Add technology (e.g. Docker, Redis)"
                />
                <Button variant="outline" size="sm" onClick={handleAddTech}>
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {form.techStack.map((tech) => (
                  <span
                    key={tech}
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-2xs bg-bg-elevated border border-border-base text-text-primary"
                  >
                    <span>{tech}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTech(tech)}
                      className="text-text-muted hover:text-red-500"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Key Features */}
            <div className="space-y-2 pt-2 border-t border-border-base">
              <label className="block text-2xs font-semibold text-text-muted">Key Features</label>
              <div className="flex gap-2">
                <Input
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
                  placeholder="Add key feature..."
                />
                <Button variant="outline" size="sm" onClick={handleAddFeature}>
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
              <ul className="space-y-1.5 text-xs pt-1 max-h-36 overflow-y-auto">
                {form.features.map((feat, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-bg-surface border border-border-base text-2xs"
                  >
                    <span className="truncate">{feat}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(idx)}
                      className="text-text-muted hover:text-red-500 shrink-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Challenges & Solution */}
            <div className="space-y-3 pt-2 border-t border-border-base">
              <div>
                <label className="block text-2xs font-semibold text-text-muted mb-1">
                  The Challenge
                </label>
                <textarea
                  rows={2}
                  value={form.challenges}
                  onChange={(e) => setForm({ ...form, challenges: e.target.value })}
                  placeholder="What core architectural bottlenecks or hurdles did you solve?"
                  className="w-full rounded-xl text-xs bg-bg-surface border border-border-base p-2.5 text-text-primary placeholder:text-text-faint focus:outline-none focus:border-solar-500"
                />
              </div>
              <div>
                <label className="block text-2xs font-semibold text-text-muted mb-1">
                  The Solution &amp; Architecture
                </label>
                <textarea
                  rows={2}
                  value={form.solution}
                  onChange={(e) => setForm({ ...form, solution: e.target.value })}
                  placeholder="How was the problem solved and what technical decisions were made?"
                  className="w-full rounded-xl text-xs bg-bg-surface border border-border-base p-2.5 text-text-primary placeholder:text-text-faint focus:outline-none focus:border-solar-500"
                />
              </div>
            </div>

            {/* Impact Metrics */}
            <div className="space-y-2 pt-2 border-t border-border-base">
              <label className="block text-2xs font-semibold text-text-muted">
                Measurable Impact Metrics
              </label>
              <div className="grid grid-cols-5 gap-2">
                <div className="col-span-3">
                  <Input
                    value={metricLabel}
                    onChange={(e) => setMetricLabel(e.target.value)}
                    placeholder="Metric Label (e.g. Uptime)"
                  />
                </div>
                <div className="col-span-2 flex gap-1">
                  <Input
                    value={metricValue}
                    onChange={(e) => setMetricValue(e.target.value)}
                    placeholder="Value (e.g. 99.98%)"
                  />
                  <Button variant="outline" size="sm" onClick={handleAddMetric}>
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {form.metrics.map((m, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-2xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono"
                  >
                    <span>
                      {m.label}: <strong>{m.value}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMetric(idx)}
                      className="hover:text-red-500"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Primary Generation CTA */}
            <div className="pt-4 border-t border-border-base">
              <Button
                variant="primary"
                size="md"
                fullWidth
                loading={isGenerating}
                onClick={handleGenerate}
                keyboardShortcut="⌘G"
                tooltip="Generate README & Case Study (⌘G)"
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-2xs"
                icon={<Sparkles className="w-4 h-4" />}
              >
                <span>{isGenerating ? 'Synthesizing with AI...' : 'Generate with AI'}</span>
              </Button>
            </div>
          </Card3D>
        </div>

        {/* Right Output: AI Generated Document Preview (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card3D
            variant="secondary"
            className="p-5 sm:p-6 border border-border-base shadow-card backdrop-blur-md flex flex-col h-full min-h-[640px]"
          >
            {/* Action Bar & Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border-base gap-3">
              {/* Document Tabs */}
              <div className="flex items-center gap-1.5 bg-bg-base p-1 rounded-xl border border-border-base">
                <button
                  type="button"
                  onClick={() => setActiveTab('readme')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === 'readme'
                      ? 'bg-orange-500 text-white shadow-2xs'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>README.md</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('casestudy')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === 'casestudy'
                      ? 'bg-orange-500 text-white shadow-2xs'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Portfolio Case Study</span>
                </button>
              </div>

              {/* View mode toggle & Export controls */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 bg-bg-base p-1 rounded-xl border border-border-base text-2xs">
                  <button
                    type="button"
                    onClick={() => setViewMode('preview')}
                    className={`px-2 py-1 rounded-md font-medium transition-colors ${
                      viewMode === 'preview'
                        ? 'bg-bg-elevated text-text-primary font-bold'
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    Formatted
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('raw')}
                    className={`px-2 py-1 rounded-md font-medium transition-colors ${
                      viewMode === 'raw'
                        ? 'bg-bg-elevated text-text-primary font-bold'
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    Raw MD
                  </button>
                </div>

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
                  variant="primary"
                  size="sm"
                  onClick={handleExportPdf}
                  className="bg-orange-500 hover:bg-orange-600 text-white shadow-2xs"
                  icon={<Printer className="w-3.5 h-3.5" />}
                >
                  PDF
                </Button>
              </div>
            </div>

            {/* Generated Output Viewer */}
            <div className="flex-1 pt-4 overflow-y-auto">
              {viewMode === 'raw' ? (
                <textarea
                  readOnly
                  data-testid="raw-markdown-textarea"
                  value={currentMarkdown}
                  className="w-full h-full min-h-[500px] font-mono text-xs p-4 rounded-xl bg-bg-base border border-border-base text-text-primary focus:outline-none resize-none leading-relaxed"
                />
              ) : (
                <div className="p-4 sm:p-6 rounded-xl bg-bg-base/70 border border-border-base font-sans space-y-4">
                  {/* Formatted Markdown Rendering */}
                  <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm space-y-4 leading-relaxed">
                    <pre
                      data-testid="formatted-markdown-preview"
                      className="whitespace-pre-wrap font-sans text-text-primary bg-transparent p-0 border-0"
                    >
                      {currentMarkdown}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </Card3D>
        </div>
      </div>
    </div>
  );
}
