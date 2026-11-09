import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  CheckCircle2,
  Clock,
  DollarSign,
  Building2,
  Trash2,
  ArrowRight,
  Send,
  FileSpreadsheet,
  X,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useWorkspace } from '../../contexts/WorkspaceContext';

export interface WorkProposal {
  id: string;
  title: string;
  client: string;
  scope: string;
  budget: number;
  timeline: string;
  status: 'draft' | 'sent' | 'accepted';
  created_at: string;
}

const DEFAULT_PROPOSALS: WorkProposal[] = [
  {
    id: 'prop-1',
    title: 'Full-Stack Design System & Next.js App Shell',
    client: 'Acme Brand Portal',
    scope: 'Component tokens, responsive layouts, automated QA suite, and dark mode theming.',
    budget: 4800,
    timeline: '3 Weeks',
    status: 'accepted',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'prop-2',
    title: 'REST API Endpoints & Auth Migration',
    client: 'Nexus Cloud Services',
    scope: 'JWT authentication, PostgreSQL migrations, role-based access control, and Swagger docs.',
    budget: 2400,
    timeline: '2 Weeks',
    status: 'sent',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'prop-3',
    title: 'Mobile UI Audit & Performance Optimization',
    client: 'Horizon Labs',
    scope: 'Core Web Vitals remediation, bundle minimization, asset lazy loading, and accessibility.',
    budget: 1600,
    timeline: '10 Days',
    status: 'draft',
    created_at: new Date().toISOString(),
  },
];

const STORAGE_KEY = 'mentor_freelancer_work_proposals';

interface FreelancerProposalsSectionProps {
  projects?: Array<{ id: number; title: string }>;
}

export function FreelancerProposalsSection({ projects = [] }: FreelancerProposalsSectionProps) {
  const { showToast } = useWorkspace();
  const [proposals, setProposals] = useState<WorkProposal[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_PROPOSALS;
    } catch {
      return DEFAULT_PROPOSALS;
    }
  });

  const [title, setTitle] = useState('');
  const [client, setClient] = useState('');
  const [budget, setBudget] = useState(2500);
  const [scope, setScope] = useState('');
  const [timeline, setTimeline] = useState('2 Weeks');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(proposals));
    } catch {
      // ignore
    }
  }, [proposals]);

  const handleAddProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newProposal: WorkProposal = {
      id: `prop-${Date.now()}`,
      title: title.trim(),
      client: client.trim() || (projects[0]?.title ?? 'Direct Client'),
      scope: scope.trim() || 'Milestone deliverables, scope agreement, and technical handover.',
      budget: Number(budget) || 1500,
      timeline: timeline.trim() || '2 Weeks',
      status: 'draft',
      created_at: new Date().toISOString(),
    };

    setProposals((prev) => [newProposal, ...prev]);
    setTitle('');
    setScope('');
    setIsModalOpen(false);
    showToast('Work proposal created successfully! 📄', 'success');
  };

  const handleAdvanceStatus = (id: string) => {
    setProposals((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const nextMap: Record<WorkProposal['status'], WorkProposal['status']> = {
          draft: 'sent',
          sent: 'accepted',
          accepted: 'draft',
        };
        const nextStatus = nextMap[p.status];
        showToast(
          nextStatus === 'accepted'
            ? 'Proposal accepted! Client engagement active 🚀'
            : nextStatus === 'sent'
            ? 'Proposal marked as sent to client ✉️'
            : 'Proposal moved back to draft',
          'success'
        );
        return { ...p, status: nextStatus };
      })
    );
  };

  const handleDelete = (id: string) => {
    setProposals((prev) => prev.filter((p) => p.id !== id));
    showToast('Proposal removed', 'info');
  };

  const totalValue = proposals.reduce((acc, p) => acc + (p.status !== 'draft' ? p.budget : 0), 0);
  const acceptedCount = proposals.filter((p) => p.status === 'accepted').length;
  const sentCount = proposals.filter((p) => p.status === 'sent').length;

  const statusBadge = (st: WorkProposal['status']) => {
    switch (st) {
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1.5 text-3xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
            <CheckCircle2 className="w-3 h-3" />
            Accepted &bull; Active
          </span>
        );
      case 'sent':
        return (
          <span className="inline-flex items-center gap-1.5 text-3xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">
            <Send className="w-3 h-3" />
            Under Review
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-3xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 dark:bg-bg-elevated text-text-muted border border-border-subtle">
            <Clock className="w-3 h-3" />
            Draft Scope
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 pt-4 border-t border-border-base/70">
      {/* ─── Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center border border-amber-500/25 shrink-0">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-text-primary tracking-tight">
              Work Proposals &amp; Scopes
            </h2>
          </div>
          <p className="text-xs text-text-secondary">
            Draft contract proposals, manage client scope commitments, and track estimated values.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          className="!bg-amber-500 hover:!bg-amber-600 text-stone-950 font-bold shrink-0 self-start sm:self-auto shadow-2xs"
          icon={<Plus className="w-3.5 h-3.5" />}
        >
          Create Proposal
        </Button>
      </div>

      {/* ─── Metrics Bar ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="rounded-xl border border-border-base/80 dark:border-white/[0.08] bg-white dark:bg-bg-surface p-4 shadow-2xs hover:shadow-sm transition-all">
          <span className="text-3xs font-semibold text-text-muted uppercase tracking-wider">Active Proposals</span>
          <div className="mt-1 text-2xl font-black text-text-primary font-mono">{proposals.length}</div>
          <span className="text-3xs text-text-muted mt-0.5 block">{acceptedCount} closed engagements</span>
        </div>

        <div className="rounded-xl border border-border-base/80 dark:border-white/[0.08] bg-white dark:bg-bg-surface p-4 shadow-2xs hover:shadow-sm transition-all">
          <span className="text-3xs font-semibold text-text-muted uppercase tracking-wider">Pipeline Value</span>
          <div className="mt-1 text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
            ${(totalValue / 1000).toFixed(1)}k
          </div>
          <span className="text-3xs text-text-muted mt-0.5 block">Sent &amp; accepted contracts</span>
        </div>

        <div className="rounded-xl border border-border-base/80 dark:border-white/[0.08] bg-white dark:bg-bg-surface p-4 shadow-2xs hover:shadow-sm transition-all">
          <span className="text-3xs font-semibold text-text-muted uppercase tracking-wider">Under Review</span>
          <div className="mt-1 text-2xl font-black text-text-primary font-mono">{sentCount}</div>
          <span className="text-3xs text-amber-600 dark:text-amber-400 font-medium mt-0.5 block">Awaiting client signature</span>
        </div>

        <div className="rounded-xl border border-border-base/80 dark:border-white/[0.08] bg-white dark:bg-bg-surface p-4 shadow-2xs hover:shadow-sm transition-all">
          <span className="text-3xs font-semibold text-text-muted uppercase tracking-wider">Acceptance Rate</span>
          <div className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {proposals.length ? Math.round((acceptedCount / proposals.length) * 100) : 0}%
          </div>
          <span className="text-3xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5 block">High proposal conversion</span>
        </div>
      </div>

      {/* ─── Proposals Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {proposals.map((prop) => (
          <div
            key={prop.id}
            className="rounded-2xl border border-border-base/80 dark:border-white/[0.08] bg-white dark:bg-bg-surface p-5 shadow-2xs hover:shadow-md hover:border-amber-500/30 transition-all duration-300 flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                {statusBadge(prop.status)}
                <button
                  type="button"
                  onClick={() => handleDelete(prop.id)}
                  className="text-text-muted hover:text-danger p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-bg-elevated transition-colors"
                  title="Remove proposal"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <h3 className="text-sm font-bold text-text-primary leading-snug line-clamp-2">
                {prop.title}
              </h3>

              <div className="flex items-center gap-1.5 text-xs text-text-muted mt-2 font-medium">
                <Building2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="truncate">{prop.client}</span>
              </div>

              <p className="text-xs text-text-secondary mt-2.5 line-clamp-3 leading-relaxed">
                {prop.scope}
              </p>
            </div>

            <div className="mt-4 pt-3.5 border-t border-border-base/70 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-extrabold text-text-primary font-mono">
                  ${prop.budget.toLocaleString()}
                </span>
                <span className="text-2xs text-text-muted font-medium">/ {prop.timeline}</span>
              </div>

              <button
                type="button"
                onClick={() => handleAdvanceStatus(prop.id)}
                className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 transition-all cursor-pointer"
                title="Advance proposal stage"
              >
                <span>
                  {prop.status === 'draft'
                    ? 'Send to Client'
                    : prop.status === 'sent'
                    ? 'Mark Accepted'
                    : 'Reopen'}
                </span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Create Proposal Modal ─────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-border-base/90 bg-white dark:bg-bg-surface shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-3.5 border-b border-border-base">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center border border-amber-500/25">
                  <FileText className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-text-primary">
                  Create Client Work Proposal
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-text-muted hover:text-text-primary p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-bg-elevated transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddProposal} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Proposal Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Next.js SaaS MVP & Dashboard Architecture"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-bg-base border border-border-base focus:border-amber-500 focus:outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    Client Name / Project
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Corp"
                    value={client}
                    onChange={(e) => setClient(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-bg-base border border-border-base focus:border-amber-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    Budget Estimate ($)
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="50"
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-bg-base border border-border-base focus:border-amber-500 focus:outline-none transition-colors font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Timeline / Delivery
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2 Weeks (80 Hours)"
                  value={timeline}
                  onChange={(e) => setTimeline(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-bg-base border border-border-base focus:border-amber-500 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Scope &amp; Deliverables Breakdown
                </label>
                <textarea
                  rows={3}
                  placeholder="Specify key deliverables, milestone objectives, and acceptance criteria..."
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-bg-base border border-border-base focus:border-amber-500 focus:outline-none transition-colors resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border-base">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={!title.trim()}
                  className="!bg-amber-500 hover:!bg-amber-600 text-stone-950 font-bold"
                >
                  Add Proposal
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
