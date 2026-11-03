import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  DollarSign,
  Plus,
  Minus,
  Trash2,
  Edit,
  FileText,
  Download,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  X,
  Sparkles,
} from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { fetchProjects } from '../../services/projectService';
import { fetchMilestones } from '../../services/projectService';
import { fetchTasks } from '../../services/taskService';
import {
  generateInvoiceFromProject,
  createInvoice,
  downloadInvoicePdf,
  sendInvoice,
} from '../../services/invoiceService';
import { Card } from '../../components/ui/Card';
import { Card3D } from '../../components/ui/Card3D';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { Modal } from '../../components/ui/Modal';
import { formatCurrency, formatDate } from '../../utils/dateUtils';
import { cn } from '../../utils/cn';
import type { Project } from '../../types/project';
import type { Milestone } from '../../types/project';
import type { Task } from '../../types/task';
import type {
  Invoice,
  InvoiceLineItem,
  CreateInvoiceRequest,
  PaymentTerms,
  InvoicePreview,
  InvoiceStatus,
} from '../../types/invoice';
import { INVOICE_STATUS_COLORS } from '../../types/invoice';

export default function InvoiceGeneratorPage() {
  const { showToast, openCaptureModal } = useWorkspace();
  const queryClient = useQueryClient();

  // ─── State ──────────────────────────────────────────────────────────────────
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [preview, setPreview] = useState<InvoicePreview | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [editingLineItems, setEditingLineItems] = useState<InvoiceLineItem[]>([]);
  const [invoiceForm, setInvoiceForm] = useState({
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '',
    payment_terms: 'net_30' as PaymentTerms,
    tax_rate: 0,
    currency: 'USD',
    notes: '',
    client_name: '',
    client_email: '',
    client_address: '',
  });
  const [includeOptions, setIncludeOptions] = useState({
    completed_milestones: true,
    completed_tasks: false,
  });

  // ─── Data Fetching ──────────────────────────────────────────────────────────
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['projects', 'freelancer'],
    queryFn: () => fetchProjects(),
  });

  const { data: allMilestones = [], isLoading: milestonesLoading } = useQuery({
    queryKey: ['milestones', 'freelancer'],
    queryFn: () => fetchMilestones(),
    enabled: !!selectedProjectId,
  });

  const { data: allTasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', 'freelancer'],
    queryFn: () => fetchTasks({ role: 'freelancer' }),
    enabled: !!selectedProjectId,
  });

  // ─── Computed ───────────────────────────────────────────────────────────────
  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const projectMilestones = allMilestones.filter((m) => m.project_id === selectedProjectId);
  const projectTasks = allTasks.filter((t) => t.project_id === selectedProjectId);

  const completedMilestones = projectMilestones.filter((m) => m.status === 'completed');
  const completedTasks = projectTasks.filter((t) => t.status === 'completed');

  // ─── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (selectedProjectId && invoiceForm.issue_date) {
      const terms = invoiceForm.payment_terms;
      const issueDate = new Date(invoiceForm.issue_date);
      const days =
        terms === 'due_on_receipt' ? 0 : terms === 'net_15' ? 15 : terms === 'net_30' ? 30 : 45;
      const dueDate = new Date(issueDate);
      dueDate.setDate(dueDate.getDate() + days);
      setInvoiceForm((prev) => ({ ...prev, due_date: dueDate.toISOString().split('T')[0] }));
    }
  }, [invoiceForm.issue_date, invoiceForm.payment_terms]);

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleGeneratePreview = useCallback(async () => {
    if (!selectedProjectId) return;

    setIsGenerating(true);
    try {
      const previewData = await generateInvoiceFromProject({
        project_id: selectedProjectId,
        include_completed_milestones: includeOptions.completed_milestones,
        include_completed_tasks: includeOptions.completed_tasks,
        payment_terms: invoiceForm.payment_terms,
        tax_rate: invoiceForm.tax_rate,
        currency: invoiceForm.currency,
        notes: invoiceForm.notes,
      });
      setPreview(previewData);
      setEditingLineItems(
        previewData.line_items.map((item, index) => ({
          ...item,
          id: index, // temporary IDs for editing
          sort_order: index,
        }))
      );
      setInvoiceForm((prev) => ({ ...prev, ...previewData.invoice }));
      setShowPreviewModal(true);
      showToast('Invoice preview generated', 'success');
    } catch (error) {
      console.error('Failed to generate preview:', error);
      showToast('Failed to generate invoice preview', 'error');
    } finally {
      setIsGenerating(false);
    }
  }, [selectedProjectId, includeOptions, invoiceForm, showToast]);

  const handleCreateInvoice = useCallback(async () => {
    if (!selectedProjectId || !preview) return;

    setIsCreating(true);
    try {
      const invoiceData: CreateInvoiceRequest = {
        project_id: selectedProjectId,
        issue_date: invoiceForm.issue_date,
        due_date: invoiceForm.due_date,
        payment_terms: invoiceForm.payment_terms,
        tax_rate: invoiceForm.tax_rate,
        currency: invoiceForm.currency,
        notes: invoiceForm.notes,
        client_name: invoiceForm.client_name,
        client_email: invoiceForm.client_email,
        client_address: invoiceForm.client_address,
        line_items: editingLineItems.map((item, index) => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          source_type: item.source_type,
          source_id: item.source_id,
        })),
      };

      await createInvoice(invoiceData);
      showToast('Invoice created successfully!', 'success');
      setShowPreviewModal(false);
      setPreview(null);
      setSelectedProjectId(null);
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    } catch (error) {
      console.error('Failed to create invoice:', error);
      showToast('Failed to create invoice', 'error');
    } finally {
      setIsCreating(false);
    }
  }, [selectedProjectId, preview, invoiceForm, editingLineItems, showToast, queryClient]);

  const handleDownloadPdf = useCallback(async () => {
    if (!preview) return;
    try {
      const blob = await downloadInvoicePdf(preview.invoice.project_id); // Would need invoice ID
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${preview.invoice.invoice_number || 'draft'}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      showToast('PDF downloaded', 'success');
    } catch (error) {
      console.error('Failed to download PDF:', error);
      showToast('Failed to download PDF', 'error');
    }
  }, [preview, showToast]);

  const handleSendInvoice = useCallback(
    async (invoiceId: number) => {
      try {
        await sendInvoice(invoiceId);
        showToast('Invoice sent to client', 'success');
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
      } catch (error) {
        console.error('Failed to send invoice:', error);
        showToast('Failed to send invoice', 'error');
      }
    },
    [showToast, queryClient]
  );

  const updateLineItem = (index: number, field: keyof InvoiceLineItem, value: string | number) => {
    setEditingLineItems((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        [field]: value,
        total: (next[index].quantity as number) * (next[index].unit_price as number),
      };
      return next;
    });
  };

  const addLineItem = () => {
    setEditingLineItems((prev) => [
      ...prev,
      {
        id: Date.now(),
        description: '',
        quantity: 1,
        unit_price: 0,
        total: 0,
        sort_order: prev.length,
        source_type: 'custom',
      },
    ]);
  };

  const removeLineItem = (index: number) => {
    setEditingLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const totals = editingLineItems.reduce(
    (acc, item) => {
      acc.subtotal += item.total;
      return acc;
    },
    { subtotal: 0 }
  );
  const taxAmount = totals.subtotal * (invoiceForm.tax_rate / 100);
  const grandTotal = totals.subtotal + taxAmount;

  // ─── Render ─────────────────────────────────────────────────────────────────
  if (projectsLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <LoadingSkeleton variant="card" className="h-40" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <LoadingSkeleton key={i} variant="card" className="h-80" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* ─── HEADER ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <FileText className="w-5 h-5" />
            </span>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              INVOICE GENERATOR
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary">
            Generate Invoices
          </h1>
          <p className="text-xs md:text-sm text-text-secondary max-w-2xl">
            Create professional invoices from completed project deliverables and milestones.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => openCaptureModal('ai')}
          className="!bg-gradient-to-r !from-amber-500 !to-orange-500 hover:!from-amber-600 hover:!to-orange-600 shadow-glow-solar font-bold px-5 h-10 text-stone-950"
          icon={<Plus className="w-4 h-4 text-stone-950" />}
        >
          AI Invoice Assist
        </Button>
      </div>

      {/* ─── STEP 1: SELECT PROJECT ───────────────────────────────────────────── */}
      <Card3D
        maxTilt={3}
        depth={20}
        variant="glass"
        className="p-5 sm:p-6 border border-border-base/90 shadow-card"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-text-primary flex items-center gap-2">
              <span className="p-1 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/25">
                <ArrowRight className="w-4 h-4" />
              </span>
              <span>Step 1: Select Project</span>
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Choose a client project with completed deliverables
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {projects.map((project) => {
            const milestoneCount = allMilestones.filter((m) => m.project_id === project.id).length;
            const completedCount = allMilestones.filter(
              (m) => m.project_id === project.id && m.status === 'completed'
            ).length;
            const taskCount = allTasks.filter((t) => t.project_id === project.id).length;
            const completedTaskCount = allTasks.filter(
              (t) => t.project_id === project.id && t.status === 'completed'
            ).length;

            return (
              <button
                key={project.id}
                type="button"
                onClick={() => {
                  setSelectedProjectId(project.id);
                  setPreview(null);
                  setEditingLineItems([]);
                  // Reset form
                  setInvoiceForm((prev) => ({
                    ...prev,
                    issue_date: new Date().toISOString().split('T')[0],
                  }));
                }}
                className={cn(
                  'p-4 border rounded-xl transition-all text-left',
                  'hover:border-amber-500/40 hover:bg-bg-elevated/50',
                  selectedProjectId === project.id
                    ? 'border-amber-500/50 bg-amber-500/5 ring-2 ring-amber-500/20'
                    : 'border-border-base'
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/25">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-text-primary truncate">
                        {project.title}
                      </h4>
                      <p className="text-[10px] text-text-muted capitalize">{project.status}</p>
                    </div>
                  </div>
                  {selectedProjectId === project.id && (
                    <CheckCircle2 className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-bg-base/50 rounded-lg">
                    <p className="text-text-muted">Milestones</p>
                    <p className="font-bold text-text-primary">
                      {completedCount}/{milestoneCount} done
                    </p>
                  </div>
                  <div className="p-2 bg-bg-base/50 rounded-lg">
                    <p className="text-text-muted">Tasks</p>
                    <p className="font-bold text-text-primary">
                      {completedTaskCount}/{taskCount} done
                    </p>
                  </div>
                  <div className="p-2 bg-bg-base/50 rounded-lg">
                    <p className="text-text-muted">Progress</p>
                    <p className="font-bold text-text-primary">{project.progress}%</p>
                  </div>
                  <div className="p-2 bg-bg-base/50 rounded-lg">
                    <p className="text-text-muted">Target</p>
                    <p className="font-bold text-text-primary">
                      {project.target_date ? formatDate(project.target_date, 'short') : '—'}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}

          {projects.length === 0 && (
            <div className="lg:col-span-3 p-8 text-center">
              <div className="p-4 rounded-2xl bg-bg-surface border border-border-base inline-block mb-4">
                <FileText className="w-12 h-12 text-text-faint mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-1">No projects yet</h3>
              <p className="text-sm text-text-muted mb-4">
                Create a client project first to generate invoices
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => openCaptureModal('ai')}
                icon={<Sparkles className="w-4 h-4" />}
              >
                Create with AI
              </Button>
            </div>
          )}
        </div>
      </Card3D>

      {/* ─── STEP 2: CONFIGURE INVOICE ────────────────────────────────────────── */}
      {selectedProject && (
        <Card3D
          maxTilt={3}
          depth={20}
          variant="glass"
          className="p-5 sm:p-6 border border-border-base/90 shadow-card"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-text-primary flex items-center gap-2">
                <span className="p-1 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/25">
                  <ArrowRight className="w-4 h-4" />
                </span>
                <span>Step 2: Configure Invoice</span>
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                {selectedProject.title} • {completedMilestones.length} completed milestones •{' '}
                {completedTasks.length} completed tasks
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Include Options */}
            <div className="space-y-3">
              <label className="block text-xs font-medium text-text-muted mb-2">
                Include in Invoice
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeOptions.completed_milestones}
                  onChange={(e) =>
                    setIncludeOptions((prev) => ({
                      ...prev,
                      completed_milestones: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 rounded border-border-base text-amber-500 focus:ring-amber-500"
                />
                <span className="text-sm text-text-primary">
                  Completed Milestones ({completedMilestones.length})
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeOptions.completed_tasks}
                  onChange={(e) =>
                    setIncludeOptions((prev) => ({ ...prev, completed_tasks: e.target.checked }))
                  }
                  className="w-4 h-4 rounded border-border-base text-amber-500 focus:ring-amber-500"
                />
                <span className="text-sm text-text-primary">
                  Completed Tasks ({completedTasks.length})
                </span>
              </label>
            </div>

            {/* Invoice Details */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">
                    Issue Date
                  </label>
                  <Input
                    type="date"
                    value={invoiceForm.issue_date}
                    onChange={(e) =>
                      setInvoiceForm((prev) => ({ ...prev, issue_date: e.target.value }))
                    }
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">Due Date</label>
                  <Input
                    type="date"
                    value={invoiceForm.due_date}
                    onChange={(e) =>
                      setInvoiceForm((prev) => ({ ...prev, due_date: e.target.value }))
                    }
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">
                  Payment Terms
                </label>
                <Select
                  value={invoiceForm.payment_terms}
                  onValueChange={(v) =>
                    setInvoiceForm((prev) => ({ ...prev, payment_terms: v as PaymentTerms }))
                  }
                  options={[
                    { value: 'due_on_receipt', label: 'Due on Receipt' },
                    { value: 'net_15', label: 'Net 15' },
                    { value: 'net_30', label: 'Net 30' },
                    { value: 'net_45', label: 'Net 45' },
                  ]}
                />
              </div>
            </div>

            {/* Tax & Currency */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">
                    Tax Rate (%)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={invoiceForm.tax_rate}
                    onChange={(e) =>
                      setInvoiceForm((prev) => ({
                        ...prev,
                        tax_rate: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">Currency</label>
                  <Select
                    value={invoiceForm.currency}
                    onValueChange={(v) => setInvoiceForm((prev) => ({ ...prev, currency: v }))}
                    options={[
                      { value: 'USD', label: 'USD ($)' },
                      { value: 'EUR', label: 'EUR (€)' },
                      { value: 'GBP', label: 'GBP (£)' },
                      { value: 'CAD', label: 'CAD ($)' },
                      { value: 'AUD', label: 'AUD ($)' },
                    ]}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Client Info */}
          <div className="border-t border-border-base pt-4 space-y-3">
            <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Client Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input
                placeholder="Client Name"
                value={invoiceForm.client_name}
                onChange={(e) =>
                  setInvoiceForm((prev) => ({ ...prev, client_name: e.target.value }))
                }
              />
              <Input
                type="email"
                placeholder="Client Email"
                value={invoiceForm.client_email}
                onChange={(e) =>
                  setInvoiceForm((prev) => ({ ...prev, client_email: e.target.value }))
                }
              />
              <Input
                placeholder="Client Address (optional)"
                value={invoiceForm.client_address}
                onChange={(e) =>
                  setInvoiceForm((prev) => ({ ...prev, client_address: e.target.value }))
                }
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-text-muted mb-1">Notes</label>
            <textarea
              value={invoiceForm.notes}
              onChange={(e) => setInvoiceForm((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Payment instructions, terms, thank you note..."
              rows={2}
              className="w-full bg-bg-base border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary placeholder:text-text-faint focus:outline-none focus:border-amber-500/50 transition-colors resize-none"
            />
          </div>

          {/* Generate Preview Button */}
          <div className="pt-4 border-t border-border-base">
            <Button
              size="lg"
              className="w-full !bg-gradient-to-r !from-amber-500 !to-orange-500 hover:!from-amber-600 hover:!to-orange-600 shadow-glow-solar font-bold text-stone-950"
              onClick={handleGeneratePreview}
              loading={isGenerating}
              icon={<FileText className="w-4 h-4" />}
            >
              {isGenerating ? 'Generating Preview...' : 'Generate Invoice Preview'}
            </Button>
          </div>
        </Card3D>
      )}

      {/* ─── STEP 3: PREVIEW & FINALIZE (Modal) ──────────────────────────────── */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title="Invoice Preview"
        size="xl"
        closeOnBackdrop={false}
      >
        {preview && (
          <div className="space-y-6 max-h-[80vh] overflow-y-auto">
            {/* Invoice Header */}
            <div className="border-b border-border-base pb-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-extrabold text-text-primary">INVOICE</h2>
                  <p className="text-sm text-text-muted mt-1">
                    #{preview.invoice.invoice_number || 'DRAFT'}
                  </p>
                </div>
                <div className="text-right md:text-left">
                  <div className="flex items-center gap-2 justify-end md:justify-start mb-2">
                    <Badge
                      variant="default"
                      className={cn(
                        'capitalize',
                        INVOICE_STATUS_COLORS[preview.invoice.status as InvoiceStatus] || ''
                      )}
                    >
                      {preview.invoice.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-text-muted flex items-center gap-1 justify-end md:justify-start">
                    <DollarSign className="w-4 h-4" />
                    <span>{preview.invoice.currency}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div>
                  <p className="font-semibold text-text-primary">From</p>
                  <p className="text-text-secondary">
                    {preview.invoice.client_name || 'Your Name/Company'}
                  </p>
                  {preview.invoice.client_email && (
                    <p className="text-text-muted">{preview.invoice.client_email}</p>
                  )}
                  {preview.invoice.client_address && (
                    <p className="text-text-muted">{preview.invoice.client_address}</p>
                  )}
                </div>
                <div className="md:text-right">
                  <p className="font-semibold text-text-primary">Bill To</p>
                  <p className="text-text-secondary">
                    {preview.invoice.client_name || 'Client Name'}
                  </p>
                  {preview.invoice.client_email && (
                    <p className="text-text-muted">{preview.invoice.client_email}</p>
                  )}
                  {preview.invoice.client_address && (
                    <p className="text-text-muted">{preview.invoice.client_address}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                <div>
                  <p className="text-text-muted">Issue Date</p>
                  <p className="font-medium text-text-primary">
                    {formatDate(preview.invoice.issue_date, 'medium')}
                  </p>
                </div>
                <div>
                  <p className="text-text-muted">Due Date</p>
                  <p className="font-medium text-text-primary">
                    {formatDate(preview.invoice.due_date, 'medium')}
                  </p>
                </div>
                <div>
                  <p className="text-text-muted">Terms</p>
                  <p className="font-medium text-text-primary">
                    {preview.invoice.payment_terms.replace('_', ' ').toUpperCase()}
                  </p>
                </div>
                <div>
                  <p className="text-text-muted">Project</p>
                  <p className="font-medium text-text-primary">{selectedProject?.title}</p>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-base">
                      <th className="text-left py-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
                        #
                      </th>
                      <th className="text-left py-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
                        Description
                      </th>
                      <th className="text-right py-2 text-xs font-semibold text-text-muted uppercase tracking-wider w-20">
                        Qty
                      </th>
                      <th className="text-right py-2 text-xs font-semibold text-text-muted uppercase tracking-wider w-28">
                        Unit Price
                      </th>
                      <th className="text-right py-2 text-xs font-semibold text-text-muted uppercase tracking-wider w-28">
                        Total
                      </th>
                      <th className="text-right py-2 text-xs font-semibold text-text-muted uppercase tracking-wider w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {editingLineItems.map((item, index) => (
                      <tr key={item.id} className="border-b border-border-base/50">
                        <td className="py-3 text-text-muted">{index + 1}</td>
                        <td className="py-3">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                            className="w-full bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-amber-500 rounded px-1 text-text-primary"
                          />
                        </td>
                        <td className="py-3 text-right">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.quantity}
                            onChange={(e) =>
                              updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)
                            }
                            className="w-20 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-amber-500 rounded px-1 text-text-primary text-right"
                          />
                        </td>
                        <td className="py-3 text-right">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unit_price}
                            onChange={(e) =>
                              updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)
                            }
                            className="w-28 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-amber-500 rounded px-1 text-text-primary text-right"
                          />
                        </td>
                        <td className="py-3 text-right font-semibold text-text-primary">
                          {formatCurrency(item.total, preview.invoice.currency)}
                        </td>
                        <td className="py-3 text-right">
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => removeLineItem(index)}
                            className="text-text-muted hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={6} className="py-2 text-right">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={addLineItem}
                          icon={<Plus className="w-3.5 h-3.5" />}
                        >
                          Add Line Item
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="mt-4 ml-auto w-full md:w-72">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-text-secondary">
                    <span>Subtotal</span>
                    <span>{formatCurrency(totals.subtotal, preview.invoice.currency)}</span>
                  </div>
                  {preview.invoice.tax_rate > 0 && (
                    <div className="flex justify-between text-text-secondary">
                      <span>Tax ({preview.invoice.tax_rate}%)</span>
                      <span>{formatCurrency(taxAmount, preview.invoice.currency)}</span>
                    </div>
                  )}
                  <div className="border-t border-border-base pt-2 flex justify-between text-lg font-bold text-text-primary">
                    <span>Total</span>
                    <span>{formatCurrency(grandTotal, preview.invoice.currency)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {preview.invoice.notes && (
              <div className="border-t border-border-base pt-4">
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                  Notes
                </p>
                <p className="text-sm text-text-muted">{preview.invoice.notes}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-border-base">
              <Button variant="ghost" size="sm" onClick={() => setShowPreviewModal(false)}>
                <X className="w-3.5 h-3.5" />
                Back
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDownloadPdf}
                icon={<Download className="w-3.5 h-3.5" />}
              >
                Download PDF
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleCreateInvoice}
                loading={isCreating}
                className="!bg-gradient-to-r !from-amber-500 !to-orange-500 hover:!from-amber-600 hover:!to-orange-600 shadow-glow-solar font-bold text-stone-950"
                icon={<Send className="w-3.5 h-3.5" />}
              >
                {isCreating ? 'Creating...' : 'Create & Send Invoice'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
