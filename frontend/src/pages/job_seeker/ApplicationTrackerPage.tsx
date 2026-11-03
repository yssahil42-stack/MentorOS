import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Send,
  Bookmark,
  Calendar,
  Award,
  Clock,
  AlertCircle,
  Mail,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Trash2,
  Edit2,
  Download,
  Search,
  CheckCircle2,
  Copy,
  Check,
  Building2,
  DollarSign,
  MapPin,
  Filter,
} from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { Card3D } from '../../components/ui/Card3D';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import type {
  JobApplication,
  ApplicationStatus,
  WorkplaceType,
  ApplicationReminder,
  CreateApplicationInput,
} from '../../types/application';
import {
  getApplications,
  createApplication,
  updateApplication,
  updateApplicationStatus,
  deleteApplication,
  calculateReminders,
  calculateMetrics,
  generateFollowUpEmail,
  exportApplicationsCsv,
} from '../../services/applicationService';

interface ColumnConfig {
  status: ApplicationStatus;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  badgeBg: string;
  description: string;
}

const KANBAN_COLUMNS: ColumnConfig[] = [
  {
    status: 'saved',
    label: 'Saved',
    icon: Bookmark,
    color: 'text-blue-500',
    badgeBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    description: 'Bookmarked targets to review and tailor resume',
  },
  {
    status: 'applied',
    label: 'Applied',
    icon: Send,
    color: 'text-amber-500',
    badgeBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    description: 'Submitted applications tracking 7d/14d follow-ups',
  },
  {
    status: 'interview',
    label: 'Interviewing',
    icon: Calendar,
    color: 'text-purple-500',
    badgeBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    description: 'Recruiter screens, technical assessments, and onsites',
  },
  {
    status: 'offer',
    label: 'Offers',
    icon: Award,
    color: 'text-emerald-500',
    badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    description: 'Written & verbal offers in compensation negotiation',
  },
];

const STAGE_ORDER: ApplicationStatus[] = ['saved', 'applied', 'interview', 'offer'];

export default function ApplicationTrackerPage() {
  const { showToast } = useWorkspace();

  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRemindersOnly, setFilterRemindersOnly] = useState(false);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<JobApplication | null>(null);

  // Email Draft Modal state
  const [emailModalData, setEmailModalData] = useState<{
    app: JobApplication;
    type: 'follow_up_7d' | 'follow_up_14d';
    subject: string;
    body: string;
    mailtoUrl: string;
  } | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Form State
  const [formCompany, setFormCompany] = useState('');
  const [formRole, setFormRole] = useState('');
  const [formLocation, setFormLocation] = useState('Remote');
  const [formWorkplace, setFormWorkplace] = useState<WorkplaceType>('remote');
  const [formStatus, setFormStatus] = useState<ApplicationStatus>('saved');
  const [formAppliedDate, setFormAppliedDate] = useState('');
  const [formSalary, setFormSalary] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formContactName, setFormContactName] = useState('');
  const [formContactEmail, setFormContactEmail] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Load applications
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const data = await getApplications();
        if (Array.isArray(data)) {
          setApplications(data);
        }
      } catch {
        showToast('Failed to load applications', 'error');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Keyboard shortcut ⌘N to open create modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        openCreateModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const reminders = useMemo(() => calculateReminders(applications), [applications]);
  const metrics = useMemo(
    () => calculateMetrics(applications, reminders),
    [applications, reminders]
  );

  // Map reminder by application ID for instant lookup
  const reminderMap = useMemo(() => {
    const map = new Map<string, ApplicationReminder>();
    reminders.forEach((r) => map.set(r.applicationId, r));
    return map;
  }, [reminders]);

  // Filtered applications
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const matchesSearch =
        searchQuery === '' ||
        app.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (app.notes && app.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesReminders = !filterRemindersOnly || reminderMap.has(app.id);

      return matchesSearch && matchesReminders;
    });
  }, [applications, searchQuery, filterRemindersOnly, reminderMap]);

  const openCreateModal = () => {
    setEditingApp(null);
    setFormCompany('');
    setFormRole('');
    setFormLocation('Remote');
    setFormWorkplace('remote');
    setFormStatus('saved');
    setFormAppliedDate('');
    setFormSalary('');
    setFormUrl('');
    setFormContactName('');
    setFormContactEmail('');
    setFormNotes('');
    setIsCreateModalOpen(true);
  };

  const openEditModal = (app: JobApplication) => {
    setEditingApp(app);
    setFormCompany(app.company);
    setFormRole(app.role);
    setFormLocation(app.location);
    setFormWorkplace(app.workplaceType);
    setFormStatus(app.status);
    setFormAppliedDate(app.appliedDate || '');
    setFormSalary(app.salaryRange || '');
    setFormUrl(app.url || '');
    setFormContactName(app.contactName || '');
    setFormContactEmail(app.contactEmail || '');
    setFormNotes(app.notes || '');
    setIsCreateModalOpen(true);
  };

  const handleSaveApplication = async () => {
    if (!formCompany.trim() || !formRole.trim()) {
      showToast('Company and Role are required', 'error');
      return;
    }

    try {
      if (editingApp) {
        const updated = await updateApplication(editingApp.id, {
          company: formCompany.trim(),
          role: formRole.trim(),
          location: formLocation.trim(),
          workplaceType: formWorkplace,
          status: formStatus,
          appliedDate:
            formStatus === 'applied' && !formAppliedDate
              ? new Date().toISOString().split('T')[0]
              : formAppliedDate || null,
          salaryRange: formSalary.trim(),
          url: formUrl.trim(),
          contactName: formContactName.trim(),
          contactEmail: formContactEmail.trim(),
          notes: formNotes.trim(),
        });
        setApplications((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
        showToast('Application updated', 'success');
      } else {
        const created = await createApplication({
          company: formCompany.trim(),
          role: formRole.trim(),
          location: formLocation.trim(),
          workplaceType: formWorkplace,
          status: formStatus,
          appliedDate:
            formStatus === 'applied' && !formAppliedDate
              ? new Date().toISOString().split('T')[0]
              : formAppliedDate || null,
          salaryRange: formSalary.trim(),
          url: formUrl.trim(),
          contactName: formContactName.trim(),
          contactEmail: formContactEmail.trim(),
          notes: formNotes.trim(),
        });
        setApplications((prev) => [created, ...prev]);
        showToast('Application added to pipeline', 'success');
      }
      setIsCreateModalOpen(false);
    } catch {
      showToast('Failed to save application', 'error');
    }
  };

  const handleStatusChange = async (id: string, newStatus: ApplicationStatus) => {
    try {
      const updated = await updateApplicationStatus(id, newStatus);
      setApplications((prev) => prev.map((a) => (a.id === id ? updated : a)));
      showToast(`Moved to ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`, 'info');
    } catch {
      showToast('Failed to update stage', 'error');
    }
  };

  const handleAdvanceStage = (app: JobApplication, direction: 'next' | 'prev') => {
    const currentIndex = STAGE_ORDER.indexOf(app.status);
    if (currentIndex === -1) return;

    if (direction === 'next' && currentIndex < STAGE_ORDER.length - 1) {
      handleStatusChange(app.id, STAGE_ORDER[currentIndex + 1]);
    } else if (direction === 'prev' && currentIndex > 0) {
      handleStatusChange(app.id, STAGE_ORDER[currentIndex - 1]);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this application from your tracker?')) return;
    try {
      await deleteApplication(id);
      setApplications((prev) => prev.filter((a) => a.id !== id));
      showToast('Application removed', 'success');
    } catch {
      showToast('Failed to delete application', 'error');
    }
  };

  const handleOpenEmailDraft = (
    app: JobApplication,
    reminderType?: 'follow_up_7d' | 'follow_up_14d'
  ) => {
    const type = reminderType || (reminderMap.get(app.id)?.type ?? 'follow_up_7d');
    const email = generateFollowUpEmail(app, type);
    setEmailModalData({
      app,
      type,
      subject: email.subject,
      body: email.body,
      mailtoUrl: email.mailtoUrl,
    });
    setCopiedEmail(false);
  };

  const handleCopyEmail = async () => {
    if (!emailModalData) return;
    const text = `Subject: ${emailModalData.subject}\n\n${emailModalData.body}`;
    await navigator.clipboard.writeText(text);
    setCopiedEmail(true);
    showToast('Copied email to clipboard', 'success');
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleExportCsv = () => {
    exportApplicationsCsv(applications);
    showToast('Exported applications to CSV', 'success');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* ─── HEADER & PRIMARY ACTIONS ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border-base">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
              Job Application Tracker
            </h1>
            <span className="px-2 py-0.5 rounded-full text-2xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Kanban Pipeline
            </span>
          </div>
          <p className="text-xs sm:text-sm text-text-muted">
            Kanban pipeline (Saved → Applied → Interview → Offer) with automatic 7-day and 14-day
            follow-up cadences.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Export CSV
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={openCreateModal}
            keyboardShortcut="⌘N"
            tooltip="Add new job application (⌘N)"
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-2xs"
            icon={<Plus className="w-4 h-4" />}
          >
            <span>Add Application</span>
          </Button>
        </div>
      </div>

      {/* ─── KPI METRICS STRIP ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card3D variant="secondary" className="p-4 border border-border-base">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-semibold uppercase tracking-wider text-text-muted">
              Active Applications
            </span>
            <Building2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-text-primary">{metrics.total}</span>
            <span className="text-2xs text-text-faint">{metrics.saved} saved</span>
          </div>
        </Card3D>

        <Card3D variant="secondary" className="p-4 border border-border-base">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-semibold uppercase tracking-wider text-text-muted">
              Submitted Pipeline
            </span>
            <Send className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-500">{metrics.applied}</span>
            <span className="text-2xs text-text-muted">Awaiting feedback</span>
          </div>
        </Card3D>

        <Card3D variant="secondary" className="p-4 border border-border-base">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-semibold uppercase tracking-wider text-text-muted">
              Interviews &amp; Offers
            </span>
            <Award className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-500">
              {metrics.interview + metrics.offer}
            </span>
            <span className="text-2xs text-emerald-500 font-semibold">{metrics.offer} offer</span>
          </div>
        </Card3D>

        <Card3D
          variant="secondary"
          className={`p-4 border transition-all ${
            reminders.length > 0 ? 'border-amber-500/40 bg-amber-500/5' : 'border-border-base'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-2xs font-semibold uppercase tracking-wider text-text-muted">
              Follow-Up Cadence
            </span>
            <Clock
              className={`w-4 h-4 ${reminders.length > 0 ? 'text-amber-500 animate-pulse' : 'text-text-muted'}`}
            />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-500">{reminders.length}</span>
            <span className="text-2xs text-text-muted">7d / 14d follow-ups due</span>
          </div>
        </Card3D>
      </div>

      {/* ─── AUTOMATED 7D / 14D FOLLOW-UP ALERT BANNER ────────────────────────── */}
      {reminders.length > 0 && (
        <div
          data-testid="reminders-alert-banner"
          className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-text-primary flex items-center gap-2">
                <span>
                  Action Required: {reminders.length} Applications Reached Follow-Up Cadence
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-500/20 text-amber-600 dark:text-amber-400 font-mono">
                  7/14 Day Auto-Reminders
                </span>
              </div>
              <p className="text-2xs text-text-muted mt-0.5">
                Sending structured follow-up notes significantly increases interview callback rates.
                Click below to view pre-crafted email drafts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilterRemindersOnly(!filterRemindersOnly)}
              className={filterRemindersOnly ? 'bg-amber-500/20 text-amber-600' : ''}
            >
              {filterRemindersOnly ? 'Show All Applications' : 'Filter Overdue Follow-ups'}
            </Button>
          </div>
        </div>
      )}

      {/* ─── SEARCH & FILTER TOOLBAR ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-text-faint absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search company, role, or notes..."
            className="pl-9 text-xs"
          />
        </div>

        {filterRemindersOnly && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-2xs bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400">
            <span>Filtering: Follow-ups Due Only ({reminders.length})</span>
            <button
              type="button"
              onClick={() => setFilterRemindersOnly(false)}
              className="hover:text-red-500 ml-1"
            >
              &times;
            </button>
          </span>
        )}
      </div>

      {/* ─── KANBAN BOARD COLUMNS ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((column) => {
          const colApps = filteredApplications.filter((a) => a.status === column.status);
          const Icon = column.icon;

          return (
            <div
              key={column.status}
              data-testid={`kanban-column-${column.status}`}
              className="flex flex-col min-w-[280px] bg-bg-surface/50 border border-border-base rounded-2xl p-3 h-full min-h-[550px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 border-b border-border-base mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`p-1.5 rounded-lg bg-bg-base border border-border-base ${column.color}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-text-primary">{column.label}</h2>
                    <span className="text-[10px] text-text-muted">
                      {colApps.length} opportunities
                    </span>
                  </div>
                </div>

                {column.status === 'saved' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={openCreateModal}
                    className="h-6 w-6 p-0 text-text-muted hover:text-text-primary"
                    title="Add Saved Application"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>

              {/* Column Application Cards Container */}
              <div className="space-y-3 flex-1 overflow-y-auto pr-0.5">
                {colApps.length === 0 ? (
                  <div className="py-12 text-center text-2xs text-text-faint border border-dashed border-border-base rounded-xl">
                    No applications in {column.label.toLowerCase()}
                  </div>
                ) : (
                  colApps.map((app) => {
                    const reminder = reminderMap.get(app.id);
                    const is7d = reminder?.type === 'follow_up_7d';
                    const is14d = reminder?.type === 'follow_up_14d';

                    return (
                      <Card3D
                        key={app.id}
                        variant="secondary"
                        className={`p-3.5 border transition-all text-xs space-y-2.5 relative group ${
                          is14d
                            ? 'border-rose-500/40 bg-rose-500/5'
                            : is7d
                              ? 'border-amber-500/40 bg-amber-500/5'
                              : 'border-border-base hover:border-emerald-500/40'
                        }`}
                      >
                        {/* Company & Role Header */}
                        <div>
                          <div className="flex items-start justify-between gap-1">
                            <span className="font-bold text-text-primary text-xs leading-snug line-clamp-1">
                              {app.company}
                            </span>
                            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => openEditModal(app)}
                                className="text-text-faint hover:text-text-primary p-0.5"
                                title="Edit"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleDelete(app.id, e)}
                                className="text-text-faint hover:text-red-500 p-0.5"
                                title="Delete"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <div className="text-2xs font-medium text-text-muted line-clamp-1 mt-0.5">
                            {app.role}
                          </div>
                        </div>

                        {/* Location, Workplace & Salary */}
                        <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-text-muted">
                          <span className="px-1.5 py-0.2 rounded bg-bg-base border border-border-base">
                            {app.workplaceType.toUpperCase()}
                          </span>
                          {app.salaryRange && (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono font-medium">
                              {app.salaryRange}
                            </span>
                          )}
                          {app.appliedDate && (
                            <span className="text-text-faint">Applied {app.appliedDate}</span>
                          )}
                        </div>

                        {/* Automated Follow-Up Reminders (Prompt Requirement: 7d/14d) */}
                        {reminder && (
                          <div className="pt-1">
                            <div
                              className={`p-2 rounded-xl text-2xs flex items-center justify-between gap-2 ${
                                is14d
                                  ? 'bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400'
                                  : 'bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <Clock className="w-3.5 h-3.5 shrink-0" />
                                <span className="font-semibold truncate">
                                  {is14d
                                    ? `14d+ Follow-Up (${reminder.daysElapsed}d)`
                                    : `7d+ Follow-Up (${reminder.daysElapsed}d)`}
                                </span>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenEmailDraft(app, reminder.type)}
                                className="h-6 text-[10px] px-2 py-0 bg-white/50 dark:bg-black/20"
                              >
                                <Mail className="w-3 h-3 mr-1" />
                                Draft
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Notes preview */}
                        {app.notes && (
                          <p className="text-[11px] text-text-muted italic line-clamp-2 bg-bg-base/60 p-1.5 rounded-lg border border-border-base/50">
                            &ldquo;{app.notes}&rdquo;
                          </p>
                        )}

                        {/* Navigation / Stage Advancement Controls */}
                        <div className="flex items-center justify-between pt-2 border-t border-border-base/60 gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={app.status === 'saved'}
                            onClick={() => handleAdvanceStage(app, 'prev')}
                            className="h-6 px-1.5 text-[10px] text-text-muted disabled:opacity-20"
                            title="Move to Previous Stage"
                          >
                            <ChevronLeft className="w-3.5 h-3.5 mr-0.5" />
                            Prev
                          </Button>

                          {app.url && (
                            <a
                              href={app.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-emerald-500 hover:underline flex items-center gap-0.5"
                            >
                              <span>Listing</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={app.status === 'offer'}
                            onClick={() => handleAdvanceStage(app, 'next')}
                            className="h-6 px-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold disabled:opacity-20"
                            title="Advance to Next Stage"
                          >
                            Next
                            <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                          </Button>
                        </div>
                      </Card3D>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── ADD / EDIT APPLICATION MODAL ────────────────────────────────────── */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={editingApp ? 'Edit Job Application' : 'Add New Application'}
        description="Track position details, workplace type, and target interview milestones."
        size="lg"
      >
        <div className="space-y-4 text-xs pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-2xs font-semibold text-text-muted mb-1">
                Company Name *
              </label>
              <Input
                value={formCompany}
                onChange={(e) => setFormCompany(e.target.value)}
                placeholder="e.g. Stripe, Linear, Vercel"
              />
            </div>
            <div>
              <label className="block text-2xs font-semibold text-text-muted mb-1">
                Job Title / Role *
              </label>
              <Input
                value={formRole}
                onChange={(e) => setFormRole(e.target.value)}
                placeholder="e.g. Senior Frontend Engineer"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-2xs font-semibold text-text-muted mb-1">
                Pipeline Status
              </label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as ApplicationStatus)}
                className="w-full rounded-xl text-xs bg-bg-surface border border-border-base p-2 text-text-primary focus:outline-none focus:border-emerald-500"
              >
                <option value="saved">Saved</option>
                <option value="applied">Applied</option>
                <option value="interview">Interview</option>
                <option value="offer">Offer</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="block text-2xs font-semibold text-text-muted mb-1">
                Workplace Mode
              </label>
              <select
                value={formWorkplace}
                onChange={(e) => setFormWorkplace(e.target.value as WorkplaceType)}
                className="w-full rounded-xl text-xs bg-bg-surface border border-border-base p-2 text-text-primary focus:outline-none focus:border-emerald-500"
              >
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">On-site</option>
              </select>
            </div>

            <div>
              <label className="block text-2xs font-semibold text-text-muted mb-1">
                Applied Date
              </label>
              <Input
                type="date"
                value={formAppliedDate}
                onChange={(e) => setFormAppliedDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-2xs font-semibold text-text-muted mb-1">Location</label>
              <Input
                value={formLocation}
                onChange={(e) => setFormLocation(e.target.value)}
                placeholder="e.g. San Francisco, CA or Remote"
              />
            </div>
            <div>
              <label className="block text-2xs font-semibold text-text-muted mb-1">
                Salary Range (Target)
              </label>
              <Input
                value={formSalary}
                onChange={(e) => setFormSalary(e.target.value)}
                placeholder="e.g. $160k - $190k"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-2xs font-semibold text-text-muted mb-1">
                Job Posting URL
              </label>
              <Input
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-2xs font-semibold text-text-muted mb-1">
                Contact / Recruiter Name
              </label>
              <Input
                value={formContactName}
                onChange={(e) => setFormContactName(e.target.value)}
                placeholder="e.g. Alex Recruiter"
              />
            </div>
            <div>
              <label className="block text-2xs font-semibold text-text-muted mb-1">
                Contact Email
              </label>
              <Input
                type="email"
                value={formContactEmail}
                onChange={(e) => setFormContactEmail(e.target.value)}
                placeholder="recruiter@company.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-2xs font-semibold text-text-muted mb-1">
              Application Notes &amp; Strategy
            </label>
            <textarea
              rows={3}
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Key requirements, tailored resume highlights, or referral notes..."
              className="w-full rounded-xl text-xs bg-bg-surface border border-border-base p-2.5 text-text-primary placeholder:text-text-faint focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border-base">
            <Button variant="ghost" size="sm" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveApplication}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
            >
              {editingApp ? 'Save Changes' : 'Create Application'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ─── FOLLOW-UP EMAIL DRAFT MODAL ─────────────────────────────────────── */}
      {emailModalData && (
        <Modal
          isOpen={Boolean(emailModalData)}
          onClose={() => setEmailModalData(null)}
          title={`Follow-Up Email Draft (${emailModalData.type === 'follow_up_7d' ? '7-Day Follow-Up' : '14-Day Status Check'})`}
          description={`Automated reminder template tailored for ${emailModalData.app.company}.`}
          size="lg"
        >
          <div className="space-y-4 text-xs pt-1">
            <div className="p-3 rounded-xl bg-bg-base border border-border-base space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xs text-text-muted font-semibold">Subject:</span>
                <span className="text-2xs font-mono text-text-primary">
                  {emailModalData.subject}
                </span>
              </div>
              {emailModalData.app.contactEmail && (
                <div className="flex items-center justify-between border-t border-border-base/50 pt-1.5">
                  <span className="text-2xs text-text-muted font-semibold">To:</span>
                  <span className="text-2xs font-mono text-emerald-500">
                    {emailModalData.app.contactEmail}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-2xs font-semibold text-text-muted mb-1">
                Email Body:
              </label>
              <textarea
                rows={10}
                readOnly
                value={emailModalData.body}
                className="w-full rounded-xl text-xs bg-bg-base border border-border-base p-3 text-text-primary font-mono focus:outline-none resize-none leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border-base">
              <span className="text-2xs text-text-faint">
                Tip: Personalize with specific projects or mutual contacts.
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyEmail}
                  icon={
                    copiedEmail ? (
                      <Check className="w-3.5 h-3.5 text-success" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )
                  }
                >
                  {copiedEmail ? 'Copied' : 'Copy Email'}
                </Button>
                <a
                  href={emailModalData.mailtoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-2xs transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Open in Mail App</span>
                </a>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
