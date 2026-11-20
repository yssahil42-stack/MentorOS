import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  Bot,
  Layers,
  Code2,
  Users,
  Sliders,
  Copy,
  Check,
  Save,
  MessageSquare,
  RefreshCw,
  Eye,
  Edit3,
  Terminal,
  BookOpen,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { MarkdownRenderer } from '../ui/MarkdownRenderer';
import { askChatbot } from '../../services/aiService';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { cn } from '../../utils/cn';

export interface DocumentationGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveToNotes: (doc: { title: string; content: string }) => void;
  initialTopic?: string;
  role?: string;
}

export type DocTemplate =
  'adr' | 'tech_spec' | 'api_spec' | 'component_guide' | 'runbook' | 'db_schema' | 'security_audit';

export type DocAudience = 'engineers' | 'architects' | 'devops' | 'qa' | 'product';

export type DocDetailLevel = 'comprehensive' | 'concise' | 'code_heavy' | 'step_by_step';

const DOC_TEMPLATES: { id: DocTemplate; label: string; icon: string; desc: string }[] = [
  {
    id: 'adr',
    label: 'Architecture Decision Record (ADR)',
    icon: 'Layers',
    desc: 'Status, Context, Decision, Consequences & Alternatives Considered',
  },
  {
    id: 'tech_spec',
    label: 'Technical Specification / RFC',
    icon: 'FileText',
    desc: 'Problem statement, Proposed Architecture, Rollout, Milestones & Risks',
  },
  {
    id: 'api_spec',
    label: 'API & REST Endpoint Specifications',
    icon: 'Terminal',
    desc: 'HTTP Methods, Request/Response payloads, Auth, Error Codes & Examples',
  },
  {
    id: 'component_guide',
    label: 'Component & Frontend Module Guide',
    icon: 'Code2',
    desc: 'Props interfaces, Hook lifecycles, Accessibility, Testing & Code snippet',
  },
  {
    id: 'runbook',
    label: 'Deployment Runbook & Troubleshooting',
    icon: 'BookOpen',
    desc: 'Prerequisites, Step-by-step deploy, Monitoring checks & Rollback playbook',
  },
  {
    id: 'db_schema',
    label: 'Database Schema & Data Model',
    icon: 'Layers',
    desc: 'Table structures, Foreign keys, Indices, Constraints & Migrations',
  },
  {
    id: 'security_audit',
    label: 'Security & Auth Verification Guide',
    icon: 'Users',
    desc: 'IDOR prevention, Role-based guards, Token management & Audit checklist',
  },
];

const AUDIENCES: { id: DocAudience; label: string; desc: string }[] = [
  { id: 'engineers', label: 'Software Engineers', desc: 'Implementation focus with code patterns' },
  {
    id: 'architects',
    label: 'Tech Leads & Architects',
    desc: 'Design rationale, scaling & trade-offs',
  },
  { id: 'devops', label: 'DevOps & SRE', desc: 'Infrastructure, deployment & monitoring' },
  {
    id: 'qa',
    label: 'QA & Test Engineers',
    desc: 'Edge cases, test scenarios & acceptance criteria',
  },
  { id: 'product', label: 'Product & Cross-Functional', desc: 'High-level architecture & impact' },
];

const DETAIL_LEVELS: { id: DocDetailLevel; label: string; desc: string }[] = [
  {
    id: 'comprehensive',
    label: 'Comprehensive',
    desc: 'Full context, tables, schemas and code blocks',
  },
  {
    id: 'concise',
    label: 'Concise & Pragmatic',
    desc: 'Key takeaways and bulleted specifications',
  },
  { id: 'code_heavy', label: 'Code-Heavy', desc: 'Maximized code samples and minimal prose' },
  {
    id: 'step_by_step',
    label: 'Step-by-Step Guide',
    desc: 'Sequential walkthrough from setup to verify',
  },
];

const TECH_STACK_PRESETS = [
  'React + TypeScript + Tailwind CSS',
  'Python + FastAPI + SQLAlchemy',
  'Node.js + Express + PostgreSQL',
  'GitLab CI/CD + Docker + Linux',
  'Full-Stack MentorOS Architecture',
  'Custom',
];

export function DocumentationGeneratorModal({
  isOpen,
  onClose,
  onSaveToNotes,
  initialTopic = '',
  role = 'developer',
}: DocumentationGeneratorModalProps) {
  const { openAsk, showToast } = useWorkspace();

  // ─── Parameter Form States ──────────────────────────────────
  const [topic, setTopic] = useState(initialTopic);
  const [template, setTemplate] = useState<DocTemplate>('adr');
  const [audience, setAudience] = useState<DocAudience>('engineers');
  const [detailLevel, setDetailLevel] = useState<DocDetailLevel>('comprehensive');
  const [techStack, setTechStack] = useState('React + TypeScript + Tailwind CSS');
  const [customStack, setCustomStack] = useState('');
  const [contextDetails, setContextDetails] = useState('');

  // ─── Generation & Preview States ────────────────────────────
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'params' | 'preview'>('params');
  const [generatedDoc, setGeneratedDoc] = useState<{ title: string; content: string } | null>(null);
  const [viewMode, setViewMode] = useState<'formatted' | 'raw'>('formatted');
  const [hasCopied, setHasCopied] = useState(false);

  const effectiveStack = techStack === 'Custom' ? customStack.trim() || 'General' : techStack;

  const handleGenerate = async () => {
    if (!topic.trim()) {
      showToast('Please enter a documentation topic or title', 'error');
      return;
    }

    setIsGenerating(true);
    const selectedTpl = DOC_TEMPLATES.find((t) => t.id === template)?.label || template;
    const selectedAud = AUDIENCES.find((a) => a.id === audience)?.label || audience;
    const selectedLvl = DETAIL_LEVELS.find((l) => l.id === detailLevel)?.label || detailLevel;

    const prompt = `Please author a professional engineering documentation note with the following customized parameters:

### Parameters:
- **Documentation Type**: ${selectedTpl}
- **Subject / Topic**: ${topic.trim()}
- **Target Audience**: ${selectedAud}
- **Detail Level & Style**: ${selectedLvl}
- **Technology Stack**: ${effectiveStack}
- **Context, Decisions & Edge Cases**:
${contextDetails.trim() || 'Include industry best practices, production-ready code examples, trade-offs, and operational guidelines.'}

### Output Requirements:
1. Provide a clear Markdown document starting with a top-level # Title.
2. Structure with clear Markdown sections (Context / Problem, Proposed Architecture / Solution, Code / Schema Examples, Trade-offs & Alternatives, Testing / Verification).
3. Do NOT output meta text like "Here is your documentation". Output only the clean Markdown document.`;

    try {
      const response = await askChatbot({
        message: prompt,
        history: [],
        role,
      });

      const fullReply = response.reply.trim();
      let docTitle = topic.trim();
      const firstLine = fullReply.split('\n')[0].trim();
      if (firstLine.startsWith('# ')) {
        docTitle = firstLine.replace(/^#\s+/, '').trim();
      }

      setGeneratedDoc({
        title: docTitle,
        content: fullReply,
      });
      setActiveTab('preview');
      showToast('Documentation drafted successfully by Ask AI!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to generate documentation through Ask AI', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!generatedDoc) return;
    navigator.clipboard.writeText(generatedDoc.content);
    setHasCopied(true);
    showToast('Markdown documentation copied to clipboard!', 'info');
    setTimeout(() => setHasCopied(false), 2000);
  };

  const handleSave = () => {
    if (!generatedDoc) return;
    onSaveToNotes(generatedDoc);
    onClose();
  };

  const handleDiscussInAsk = () => {
    if (!generatedDoc) return;
    const query = `Here is our documentation for "${generatedDoc.title}":\n\n${generatedDoc.content.slice(0, 1500)}\n\nCould you review this documentation, suggest refinements, and point out any edge cases?`;
    onClose();
    openAsk(query);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Draft Documentation with Ask AI"
      description="Customize parameters to generate engineering documentation, ADRs, or technical specifications."
      size="xl"
      footer={
        <div className="flex items-center justify-between w-full gap-3">
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <Bot className="w-3.5 h-3.5 text-solar-500" />
            <span>Powered by Ask Conversational AI</span>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'preview' ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab('params')}
                  icon={<Sliders className="w-3.5 h-3.5" />}
                >
                  Adjust Parameters
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleDiscussInAsk}
                  icon={<MessageSquare className="w-3.5 h-3.5 text-solar-500" />}
                >
                  Discuss in Ask Chatbot
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSave}
                  className="!bg-blue-600 hover:!bg-blue-700 text-white font-semibold"
                  icon={<Save className="w-3.5 h-3.5" />}
                >
                  Save to Notes
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={onClose} disabled={isGenerating}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleGenerate}
                  disabled={!topic.trim() || isGenerating}
                  loading={isGenerating}
                  className="!bg-gradient-to-r !from-indigo-600 !to-purple-600 hover:!from-indigo-700 hover:!to-purple-700 text-white font-bold"
                  icon={<Sparkles className="w-4 h-4" />}
                >
                  {isGenerating ? 'Drafting with Ask AI...' : 'Generate Documentation'}
                </Button>
              </>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-4 py-1">
        {/* Navigation Tabs (Parameters vs Preview) */}
        <div className="flex items-center justify-between border-b border-border-base pb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('params')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                activeTab === 'params'
                  ? 'bg-solar-500/15 text-solar-500 border border-solar-500/30'
                  : 'text-text-muted hover:text-text-primary'
              )}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>1. Custom Parameters</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (generatedDoc) setActiveTab('preview');
              }}
              disabled={!generatedDoc}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                activeTab === 'preview'
                  ? 'bg-solar-500/15 text-solar-500 border border-solar-500/30'
                  : 'text-text-muted hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed'
              )}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>2. Generated Preview {generatedDoc && '✓'}</span>
            </button>
          </div>

          {activeTab === 'preview' && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setViewMode(viewMode === 'formatted' ? 'raw' : 'formatted')}
                className="px-2 py-1 text-2xs font-mono font-medium rounded bg-bg-surface hover:bg-bg-elevated text-text-secondary border border-border-base"
              >
                {viewMode === 'formatted' ? 'View Raw' : 'View Formatted'}
              </button>
              <Button
                variant="ghost"
                size="xs"
                onClick={handleCopy}
                icon={
                  hasCopied ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )
                }
              >
                {hasCopied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          )}
        </div>

        {/* ─── TAB 1: PARAMETERS FORM ─────────────────────────── */}
        {activeTab === 'params' && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 no-scrollbar">
            {/* Topic / Title */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-text-primary">
                Documentation Subject or Feature Title <span className="text-danger">*</span>
              </label>
              <Input
                type="text"
                placeholder="e.g. TanStack Query v5 Cache Strategy & Invalidation Rules"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full text-xs"
              />
            </div>

            {/* Parameter: Template Type */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-text-primary">
                Document Template / Type
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {DOC_TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTemplate(t.id)}
                    className={cn(
                      'p-2.5 rounded-xl border text-left transition-all cursor-pointer',
                      template === t.id
                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20'
                        : 'border-border-base bg-bg-surface hover:border-border-hover text-text-secondary'
                    )}
                  >
                    <p className="text-xs font-bold text-text-primary truncate">{t.label}</p>
                    <p className="text-3xs text-text-muted line-clamp-1 mt-0.5">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Parameter Grid: Target Audience & Detail Level */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Audience */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-text-primary">
                  Target Audience
                </label>
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value as DocAudience)}
                  className="w-full bg-bg-surface border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-indigo-500"
                >
                  {AUDIENCES.map((a) => (
                    <option key={a.id} value={a.id} className="bg-bg-surface text-text-primary">
                      {a.label} ({a.desc})
                    </option>
                  ))}
                </select>
              </div>

              {/* Detail Level */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-text-primary">
                  Detail &amp; Style
                </label>
                <select
                  value={detailLevel}
                  onChange={(e) => setDetailLevel(e.target.value as DocDetailLevel)}
                  className="w-full bg-bg-surface border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-indigo-500"
                >
                  {DETAIL_LEVELS.map((l) => (
                    <option key={l.id} value={l.id} className="bg-bg-surface text-text-primary">
                      {l.label} — {l.desc}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Parameter: Tech Stack */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-text-primary">
                Tech Stack / Environment
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {TECH_STACK_PRESETS.map((stack) => (
                  <button
                    key={stack}
                    type="button"
                    onClick={() => setTechStack(stack)}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-2xs font-medium border transition-all cursor-pointer',
                      techStack === stack
                        ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40 font-semibold'
                        : 'bg-bg-surface text-text-muted border-border-base hover:text-text-primary'
                    )}
                  >
                    {stack}
                  </button>
                ))}
              </div>
              {techStack === 'Custom' && (
                <Input
                  type="text"
                  placeholder="e.g. Next.js App Router + Prisma + tRPC"
                  value={customStack}
                  onChange={(e) => setCustomStack(e.target.value)}
                  className="w-full text-xs font-mono"
                />
              )}
            </div>

            {/* Parameter: Key Decisions & Context */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-text-primary">
                Specific Context, Constraints &amp; Key Decisions
              </label>
              <textarea
                rows={3}
                placeholder="e.g. We chose pgBouncer over native pooling due to AWS Lambda concurrency spikes. Include connection string configuration, latency metrics, and failure recovery..."
                value={contextDetails}
                onChange={(e) => setContextDetails(e.target.value)}
                className="w-full bg-bg-surface border border-border-base rounded-xl p-3 text-xs text-text-primary placeholder:text-text-faint focus:outline-none focus:border-indigo-500 resize-none font-mono"
              />
            </div>
          </div>
        )}

        {/* ─── TAB 2: GENERATED PREVIEW ───────────────────────── */}
        {activeTab === 'preview' && generatedDoc && (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-bg-surface border border-border-base">
              <div>
                <h3 className="text-sm font-bold text-text-primary">{generatedDoc.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="info" size="xs">
                    {DOC_TEMPLATES.find((t) => t.id === template)?.label}
                  </Badge>
                  <Badge variant="secondary" size="xs">
                    {AUDIENCES.find((a) => a.id === audience)?.label}
                  </Badge>
                  <span className="text-3xs text-text-muted font-mono">
                    {generatedDoc.content.split(/\s+/).length} words
                  </span>
                </div>
              </div>
            </div>

            <div className="max-h-[50vh] overflow-y-auto p-4 rounded-xl border border-border-base bg-bg-surface/50">
              {viewMode === 'formatted' ? (
                <MarkdownRenderer content={generatedDoc.content} />
              ) : (
                <pre className="text-xs font-mono text-text-secondary whitespace-pre-wrap leading-relaxed">
                  {generatedDoc.content}
                </pre>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
