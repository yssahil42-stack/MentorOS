import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Calculator,
  DollarSign,
  Clock,
  Calendar,
  FileText,
  Download,
  Copy,
  CheckCircle2,
  AlertCircle,
  Target,
  TrendingUp,
  Building2,
  Sparkles,
  Plus,
  Minus,
  Edit,
  Trash2,
} from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { fetchProjects } from '../../services/projectService';
import { Card } from '../../components/ui/Card';
import { Card3D } from '../../components/ui/Card3D';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { Modal } from '../../components/ui/Modal';
import { formatCurrency } from '../../utils/dateUtils';
import { cn } from '../../utils/cn';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface RateCalculation {
  hourlyRate: number;
  monthlyTarget: number;
  billableHoursPerWeek: number;
  weeksPerYear: number;
  overheadPercentage: number;
  utilizationRate: number;
  // Computed
  annualGross: number;
  annualNet: number;
  monthlyGross: number;
  monthlyNet: number;
  effectiveHourlyRate: number;
  requiredBillableHoursPerWeek: number;
}

interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  category: 'fixed' | 'hourly' | 'retainer' | 'milestone';
  content: string;
  variables: string[];
}

const DEFAULT_TEMPLATES: ContractTemplate[] = [
  {
    id: 'fixed-project',
    name: 'Fixed-Price Project Agreement',
    description: 'Best for well-defined deliverables with clear scope',
    category: 'fixed',
    variables: [
      '{{client_name}}',
      '{{project_name}}',
      '{{total_price}}',
      '{{delivery_date}}',
      '{{freelancer_name}}',
      '{{freelancer_email}}',
    ],
    content: `FREELANCE SERVICES AGREEMENT

This Agreement is entered into on {{date}} between {{freelancer_name}} ("Freelancer") and {{client_name}} ("Client").

1. SCOPE OF WORK
Freelancer agrees to deliver the following project: {{project_name}}
Description: {{project_description}}
Deliverables: {{deliverables_list}}

2. COMPENSATION
Client agrees to pay Freelancer a fixed fee of {{total_price}} ({{currency}}).
Payment Schedule:
- {{deposit_percentage}}% deposit upon signing: {{deposit_amount}}
- {{milestone_percentage}}% at midpoint: {{milestone_amount}}
- {{final_percentage}}% upon delivery: {{final_amount}}

3. TIMELINE
Project start date: {{start_date}}
Project delivery date: {{delivery_date}}
Milestones: {{milestones_list}}

4. REVISIONS
This agreement includes {{revision_rounds}} rounds of revisions. Additional revisions at {{hourly_rate}}/hour.

5. INTELLECTUAL PROPERTY
Upon full payment, all work product becomes Client's property.

6. CONFIDENTIALITY
Both parties agree to keep project details confidential.

7. TERMINATION
Either party may terminate with {{notice_days}} days written notice. Client pays for work completed to date.

Signed:
_________________________ _________________________
{{freelancer_name}} {{client_name}}
Date: {{date}} Date: {{date}}
`,
  },
  {
    id: 'hourly-contract',
    name: 'Hourly Rate Agreement',
    description: 'For ongoing work with flexible scope',
    category: 'hourly',
    variables: [
      '{{client_name}}',
      '{{freelancer_name}}',
      '{{hourly_rate}}',
      '{{estimated_hours}}',
      '{{billing_cycle}}',
    ],
    content: `HOURLY SERVICES AGREEMENT

This Agreement is entered into on {{date}} between {{freelancer_name}} ("Freelancer") and {{client_name}} ("Client").

1. SERVICES
Freelancer will provide {{service_description}} on an as-needed basis.

2. RATE & BILLING
Hourly rate: {{hourly_rate}} {{currency}}/hour
Estimated hours per {{billing_cycle}}: {{estimated_hours}}
Minimum billing increment: {{min_increment}} minutes
Invoices sent: {{billing_cycle}}
Payment terms: Net {{payment_terms}} days

3. EXPENSES
Client reimburses pre-approved expenses with receipts.

4. TIME TRACKING
Freelancer provides detailed time logs with each invoice.

5. TERM
This agreement continues until terminated by either party with {{notice_days}} days notice.

Signed:
_________________________ _________________________
{{freelancer_name}} {{client_name}}
`,
  },
  {
    id: 'monthly-retainer',
    name: 'Monthly Retainer Agreement',
    description: 'Guaranteed availability for ongoing partnership',
    category: 'retainer',
    variables: [
      '{{client_name}}',
      '{{freelancer_name}}',
      '{{monthly_fee}}',
      '{{included_hours}}',
      '{{rollover_policy}}',
    ],
    content: `MONTHLY RETAINER AGREEMENT

This Agreement is entered into on {{date}} between {{freelancer_name}} ("Freelancer") and {{client_name}} ("Client").

1. RETAINER TERMS
Monthly retainer fee: {{monthly_fee}} {{currency}}
Includes: {{included_hours}} hours of {{service_type}} per month
Rollover policy: {{rollover_policy}}

2. PRIORITY ACCESS
Retainer clients receive:
- Guaranteed response within {{response_time}} hours
- Priority scheduling
- {{discount_percentage}}% discount on additional hours

3. BILLING & PAYMENT
Invoiced on the 1st of each month
Due within {{payment_terms}} days
Auto-renews monthly unless cancelled with {{notice_days}} days notice

4. SCOPE
Services include: {{service_list}}
Additional work at {{overage_rate}} {{currency}}/hour

Signed:
_________________________ _________________________
{{freelancer_name}} {{client_name}}
`,
  },
  {
    id: 'milestone-based',
    name: 'Milestone-Based Agreement',
    description: 'Payments tied to specific deliverable milestones',
    category: 'milestone',
    variables: ['{{client_name}}', '{{freelancer_name}}', '{{milestones_list}}', '{{total_price}}'],
    content: `MILESTONE-BASED SERVICES AGREEMENT

This Agreement is entered into on {{date}} between {{freelancer_name}} ("Freelancer") and {{client_name}} ("Client").

1. PROJECT: {{project_name}}
Total contract value: {{total_price}} {{currency}}

2. MILESTONES & PAYMENTS
{{#each milestones}}
Milestone {{@index}}: {{title}}
Description: {{description}}
Amount: {{amount}} {{currency}} ({{percentage}}%)
Due: {{due_date}}
{{/each}}

3. ACCEPTANCE CRITERIA
Each milestone requires Client sign-off within {{acceptance_days}} days.
Deemed accepted if no feedback provided.

4. CHANGE ORDERS
Scope changes require written agreement and may adjust timeline/cost.

Signed:
_________________________ _________________________
{{freelancer_name}} {{client_name}}
`,
  },
];

// ─── Rate Calculator Component ────────────────────────────────────────────────

export default function RateCalculatorPage() {
  const { showToast, openCaptureModal } = useWorkspace();
  const { data: projects = [] } = useQuery({
    queryKey: ['projects', 'freelancer'],
    queryFn: () => fetchProjects(),
  });

  // ─── Rate Calculator State ──────────────────────────────────────────────────
  const [calculation, setCalculation] = useState<RateCalculation>({
    hourlyRate: 100,
    monthlyTarget: 10000,
    billableHoursPerWeek: 20,
    weeksPerYear: 48,
    overheadPercentage: 30,
    utilizationRate: 75,
    annualGross: 0,
    annualNet: 0,
    monthlyGross: 0,
    monthlyNet: 0,
    effectiveHourlyRate: 0,
    requiredBillableHoursPerWeek: 0,
  });

  const [activeTab, setActiveTab] = useState<'calculator' | 'templates' | 'history'>('calculator');
  const [editingTemplate, setEditingTemplate] = useState<ContractTemplate | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [customTemplates, setCustomTemplates] = useState<ContractTemplate[]>([]);

  // ─── Calculations ───────────────────────────────────────────────────────────

  useEffect(() => {
    const {
      hourlyRate,
      monthlyTarget,
      billableHoursPerWeek,
      weeksPerYear,
      overheadPercentage,
      utilizationRate,
    } = calculation;

    const annualGross = hourlyRate * billableHoursPerWeek * weeksPerYear;
    const annualOverhead = annualGross * (overheadPercentage / 100);
    const annualNet = annualGross - annualOverhead;
    const monthlyGross = annualGross / 12;
    const monthlyNet = annualNet / 12;
    const effectiveHourlyRate = annualNet / (billableHoursPerWeek * weeksPerYear);
    const requiredBillableHoursPerWeek =
      ((monthlyTarget * 12) / (hourlyRate * weeksPerYear)) * (100 / utilizationRate);

    setCalculation((prev) => ({
      ...prev,
      annualGross,
      annualNet,
      monthlyGross,
      monthlyNet,
      effectiveHourlyRate,
      requiredBillableHoursPerWeek: Math.min(requiredBillableHoursPerWeek, 40),
    }));
  }, [calculation]);

  const updateCalculation = (field: keyof RateCalculation, value: number) => {
    setCalculation((prev) => ({ ...prev, [field]: value }));
  };

  // ─── Template Handlers ──────────────────────────────────────────────────────

  const openTemplateEditor = (template: ContractTemplate | null) => {
    if (template) {
      setEditingTemplate({ ...template });
    } else {
      setEditingTemplate({
        id: `custom-${Date.now()}`,
        name: '',
        description: '',
        category: 'fixed',
        content: '',
        variables: [],
      });
    }
    setShowTemplateModal(true);
  };

  const saveTemplate = () => {
    if (!editingTemplate) return;
    if (!editingTemplate.name.trim()) {
      showToast('Template name is required', 'error');
      return;
    }
    setCustomTemplates((prev) => {
      const exists = prev.find((t) => t.id === editingTemplate!.id);
      if (exists) {
        return prev.map((t) => (t.id === editingTemplate!.id ? editingTemplate! : t));
      }
      return [...prev, editingTemplate!];
    });
    setShowTemplateModal(false);
    setEditingTemplate(null);
    showToast('Template saved', 'success');
  };

  const copyTemplate = (template: ContractTemplate) => {
    const content = template.content;
    navigator.clipboard.writeText(content);
    showToast('Template copied to clipboard', 'success');
  };

  const downloadTemplate = (template: ContractTemplate) => {
    const blob = new Blob([template.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.name.replace(/\s+/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Template downloaded', 'success');
  };

  const deleteCustomTemplate = (id: string) => {
    setCustomTemplates((prev) => prev.filter((t) => t.id !== id));
    showToast('Template deleted', 'info');
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* ─── HEADER ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <Calculator className="w-5 h-5" />
            </span>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              RATE CALCULATOR & TEMPLATES
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary">
            Rate Calculator & Contract Templates
          </h1>
          <p className="text-xs md:text-sm text-text-secondary max-w-2xl">
            Calculate your rates, plan your income, and generate professional contracts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => openCaptureModal('ai')}
            className="bg-orange-500 hover:bg-orange-600 font-bold px-5 h-10 text-white shadow-sm"
            icon={<Sparkles className="w-4 h-4 text-white" />}
          >
            AI Assist
          </Button>
        </div>
      </div>

      {/* ─── TABS ─────────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 bg-bg-base/80 p-1 rounded-xl border border-border-base">
        {(['calculator', 'templates', 'history'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              activeTab === tab
                ? 'bg-orange-500 text-white shadow-sm font-semibold'
                : 'text-text-muted hover:text-text-primary'
            )}
          >
            {tab === 'calculator' && <Calculator className="w-4 h-4 mr-2 inline" />}
            {tab === 'templates' && <FileText className="w-4 h-4 mr-2 inline" />}
            {tab === 'history' && <Clock className="w-4 h-4 mr-2 inline" />}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* ─── CALCULATOR TAB ───────────────────────────────────────────────────── */}
      {activeTab === 'calculator' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Panel */}
          <div className="lg:col-span-1 space-y-6">
            <Card3D
              maxTilt={3}
              depth={20}
              variant="glass"
              className="p-5 border border-border-base/90 shadow-card"
            >
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2 mb-4">
                <span className="p-1 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/25">
                  <Target className="w-4 h-4" />
                </span>
                Rate Inputs
              </h3>

              <div className="space-y-4">
                <InputField
                  label="Hourly Rate"
                  icon={<DollarSign className="w-4 h-4" />}
                  value={calculation.hourlyRate}
                  onChange={(v) => updateCalculation('hourlyRate', v)}
                  type="number"
                  min="1"
                  step="5"
                  suffix="/hr"
                />

                <InputField
                  label="Monthly Income Target"
                  icon={<Target className="w-4 h-4" />}
                  value={calculation.monthlyTarget}
                  onChange={(v) => updateCalculation('monthlyTarget', v)}
                  type="number"
                  min="0"
                  step="500"
                  prefix="$"
                />

                <InputField
                  label="Billable Hours/Week"
                  icon={<Clock className="w-4 h-4" />}
                  value={calculation.billableHoursPerWeek}
                  onChange={(v) => updateCalculation('billableHoursPerWeek', v)}
                  type="number"
                  min="1"
                  max="40"
                  step="1"
                  suffix="hrs"
                />

                <InputField
                  label="Weeks Worked/Year"
                  icon={<Calendar className="w-4 h-4" />}
                  value={calculation.weeksPerYear}
                  onChange={(v) => updateCalculation('weeksPerYear', v)}
                  type="number"
                  min="1"
                  max="52"
                  step="1"
                  suffix="weeks"
                />

                <InputField
                  label="Overhead % (taxes, tools, insurance)"
                  icon={<TrendingUp className="w-4 h-4" />}
                  value={calculation.overheadPercentage}
                  onChange={(v) => updateCalculation('overheadPercentage', v)}
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  suffix="%"
                />

                <InputField
                  label="Utilization Rate %"
                  icon={<Building2 className="w-4 h-4" />}
                  value={calculation.utilizationRate}
                  onChange={(v) => updateCalculation('utilizationRate', v)}
                  type="number"
                  min="10"
                  max="100"
                  step="5"
                  suffix="%"
                />
              </div>
            </Card3D>

            {/* Quick Presets */}
            <Card className="p-4 border-border-base/50">
              <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                Quick Presets
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Junior Dev', rate: 75, hours: 25, overhead: 25, util: 70 },
                  { label: 'Mid-Level', rate: 125, hours: 20, overhead: 30, util: 75 },
                  { label: 'Senior', rate: 200, hours: 15, overhead: 35, util: 80 },
                  { label: 'Expert/Consultant', rate: 300, hours: 10, overhead: 40, util: 60 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() =>
                      setCalculation((prev) => ({
                        ...prev,
                        hourlyRate: preset.rate,
                        billableHoursPerWeek: preset.hours,
                        overheadPercentage: preset.overhead,
                        utilizationRate: preset.util,
                      }))
                    }
                    className={cn(
                      'p-3 rounded-xl text-left border transition-all text-xs',
                      calculation.hourlyRate === preset.rate
                        ? 'border-amber-500/50 bg-amber-500/5'
                        : 'border-border-base hover:border-amber-500/30'
                    )}
                  >
                    <p className="font-semibold text-text-primary">{preset.label}</p>
                    <p className="text-text-muted">
                      ${preset.rate}/hr • {preset.hours} hrs/wk
                    </p>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                label="Monthly Gross"
                value={formatCurrency(calculation.monthlyGross)}
                subtitle="Before overhead"
                icon={<DollarSign className="w-5 h-5" />}
                color="amber"
              />
              <MetricCard
                label="Monthly Net"
                value={formatCurrency(calculation.monthlyNet)}
                subtitle="After overhead"
                icon={<DollarSign className="w-5 h-5" />}
                color="emerald"
              />
              <MetricCard
                label="Effective Hourly"
                value={formatCurrency(calculation.effectiveHourlyRate)}
                subtitle="Real rate after costs"
                icon={<Calculator className="w-5 h-5" />}
                color="blue"
              />
              <MetricCard
                label="Hours Needed for Target"
                value={`${calculation.requiredBillableHoursPerWeek.toFixed(1)} hrs/wk`}
                subtitle={
                  calculation.requiredBillableHoursPerWeek > 40 ? '⚠️ Unrealistic' : 'Achievable'
                }
                icon={<Target className="w-5 h-5" />}
                color={calculation.requiredBillableHoursPerWeek > 40 ? 'red' : 'purple'}
              />
            </div>

            {/* Annual Projection */}
            <Card3D
              maxTilt={2}
              depth={15}
              variant="secondary"
              className="p-5 border border-border-base shadow-card"
            >
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2 mb-4">
                <span className="p-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                  <TrendingUp className="w-4 h-4" />
                </span>
                Annual Projection
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-base">
                      <th className="text-left py-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
                        Metric
                      </th>
                      <th className="text-right py-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
                        Gross
                      </th>
                      <th className="text-right py-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
                        Net (After Overhead)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-base/50">
                    <RowMetric
                      label="Annual"
                      gross={calculation.annualGross}
                      net={calculation.annualNet}
                    />
                    <RowMetric
                      label="Monthly (×12)"
                      gross={calculation.monthlyGross}
                      net={calculation.monthlyNet}
                    />
                    <RowMetric
                      label="Weekly (×52)"
                      gross={calculation.annualGross / 52}
                      net={calculation.annualNet / 52}
                    />
                    <RowMetric
                      label="Daily (×260)"
                      gross={calculation.annualGross / 260}
                      net={calculation.annualNet / 260}
                    />
                    <RowMetric
                      label="Per Billable Hour"
                      gross={calculation.hourlyRate}
                      net={calculation.effectiveHourlyRate}
                      highlight
                    />
                  </tbody>
                </table>
              </div>
            </Card3D>

            {/* Scenario Analysis */}
            <Card className="p-5 border-border-base/50">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2 mb-4">
                <span className="p-1 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/25">
                  <Target className="w-4 h-4" />
                </span>
                Scenario Analysis
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ScenarioCard
                  title="Conservative"
                  description="75% utilization, 35% overhead"
                  monthlyNet={
                    calculation.hourlyRate * calculation.billableHoursPerWeek * 4 * 0.75 * 0.65
                  }
                  color="amber"
                />
                <ScenarioCard
                  title="Realistic"
                  description={`${calculation.utilizationRate}% utilization, ${calculation.overheadPercentage}% overhead`}
                  monthlyNet={calculation.monthlyNet}
                  color="emerald"
                  highlight
                />
                <ScenarioCard
                  title="Optimistic"
                  description="90% utilization, 25% overhead"
                  monthlyNet={
                    calculation.hourlyRate * calculation.billableHoursPerWeek * 4 * 0.9 * 0.75
                  }
                  color="blue"
                />
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ─── TEMPLATES TAB ────────────────────────────────────────────────────── */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-lg font-bold text-text-primary">Contract Templates</h2>
            <Button onClick={() => openTemplateEditor(null)} icon={<Plus className="w-4 h-4" />}>
              New Template
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...DEFAULT_TEMPLATES, ...customTemplates].map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                isCustom={customTemplates.some((t) => t.id === template.id)}
                onEdit={() => openTemplateEditor(template)}
                onCopy={() => copyTemplate(template)}
                onDownload={() => downloadTemplate(template)}
                onDelete={
                  template.id.startsWith('custom-')
                    ? () => deleteCustomTemplate(template.id)
                    : undefined
                }
              />
            ))}
          </div>

          {DEFAULT_TEMPLATES.length + customTemplates.length === 0 && (
            <Card className="p-8 text-center border-border-base/50">
              <FileText className="w-12 h-12 text-text-faint mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-text-primary mb-1">No templates yet</h3>
              <p className="text-sm text-text-muted mb-6">Create your first contract template</p>
              <Button onClick={() => openTemplateEditor(null)} icon={<Plus className="w-4 h-4" />}>
                Create Template
              </Button>
            </Card>
          )}
        </div>
      )}

      {/* ─── HISTORY TAB ──────────────────────────────────────────────────────── */}
      {activeTab === 'history' && (
        <Card className="p-8 text-center border-border-base/50">
          <Clock className="w-12 h-12 text-text-faint mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-1">Calculation History</h3>
          <p className="text-sm text-text-muted mb-6">
            Your rate calculations and generated contracts will appear here.
          </p>
          <Button variant="outline" size="sm" icon={<Plus className="w-4 h-4" />}>
            Start New Calculation
          </Button>
        </Card>
      )}

      {/* ─── TEMPLATE EDITOR MODAL ────────────────────────────────────────────── */}
      <Modal
        isOpen={showTemplateModal}
        onClose={() => {
          setShowTemplateModal(false);
          setEditingTemplate(null);
        }}
        title={editingTemplate?.id.startsWith('custom-') ? 'Edit Template' : 'New Template'}
        size="xl"
        closeOnBackdrop={false}
      >
        {editingTemplate && (
          <div className="space-y-5 max-h-[80vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Template Name"
                value={editingTemplate.name}
                onChange={(e) =>
                  setEditingTemplate((prev) => (prev ? { ...prev!, name: e.target.value } : null))
                }
                placeholder="e.g., Fixed-Price Web Project"
              />
              <Select
                label="Category"
                value={editingTemplate.category}
                onValueChange={(v) =>
                  setEditingTemplate((prev) => (prev ? { ...prev!, category: v as any } : null))
                }
                options={[
                  { value: 'fixed', label: 'Fixed Price' },
                  { value: 'hourly', label: 'Hourly' },
                  { value: 'retainer', label: 'Retainer' },
                  { value: 'milestone', label: 'Milestone-Based' },
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Description</label>
              <Input
                value={editingTemplate.description}
                onChange={(e) =>
                  setEditingTemplate((prev) =>
                    prev ? { ...prev!, description: e.target.value } : null
                  )
                }
                placeholder="Brief description of when to use this template"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-medium text-text-muted">
                  Contract Content
                </label>
                <span className="text-xs text-text-muted">
                  Use {'{{variable_name}}'} for placeholders
                </span>
              </div>
              <textarea
                value={editingTemplate.content}
                onChange={(e) =>
                  setEditingTemplate((prev) =>
                    prev ? { ...prev!, content: e.target.value } : null
                  )
                }
                rows={15}
                className="w-full font-mono text-xs bg-bg-base border border-border-base rounded-xl px-3 py-2 text-text-primary placeholder:text-text-faint focus:outline-none focus:border-amber-500/50 transition-colors resize-y"
                placeholder="// Enter your contract template here...
// Use {{variable_name}} for dynamic values
// Available: {{client_name}}, {{freelancer_name}}, {{project_name}}, {{total_price}}, {{hourly_rate}}, {{delivery_date}}, etc."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-border-base">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowTemplateModal(false);
                  setEditingTemplate(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={saveTemplate}
                className="bg-orange-500 hover:bg-orange-600 font-bold text-white shadow-sm"
              >
                Save Template
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─── Helper Components ────────────────────────────────────────────────────────

interface InputFieldProps {
  label: string;
  icon: React.ReactNode;
  value: number;
  onChange: (value: number) => void;
  type?: string;
  min?: number | string;
  max?: number | string;
  step?: number | string;
  prefix?: string;
  suffix?: string;
}

function InputField({
  label,
  icon,
  value,
  onChange,
  type = 'number',
  min,
  max,
  step,
  prefix,
  suffix,
}: InputFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-medium text-text-secondary">
        {icon}
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">
            {prefix}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          min={min}
          max={max}
          step={step}
          className={cn(
            'w-full bg-bg-base border border-border-base rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-faint focus:outline-none focus:border-amber-500/50 transition-colors',
            prefix && 'pl-8',
            suffix && 'pr-8'
          )}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  color: 'amber' | 'blue' | 'emerald' | 'purple' | 'red';
}

function MetricCard({ label, value, subtitle, icon, color }: MetricCardProps) {
  const colorClasses = {
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/25',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/25',
    red: 'bg-red-500/10 text-red-400 border-red-500/25',
  };

  return (
    <Card className="p-4 border-border-base/50">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-extrabold text-text-primary mt-1">{value}</p>
          {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
        </div>
        <div className={cn('p-2 rounded-xl', colorClasses[color])}>{icon}</div>
      </div>
    </Card>
  );
}

interface RowMetricProps {
  label: string;
  gross: number;
  net: number;
  highlight?: boolean;
}

function RowMetric({ label, gross, net, highlight }: RowMetricProps) {
  return (
    <tr className={cn(highlight && 'bg-amber-500/5 font-semibold')}>
      <td className="py-2 text-text-secondary">{label}</td>
      <td className="py-2 text-right text-text-primary">{formatCurrency(gross)}</td>
      <td className="py-2 text-right font-medium text-emerald-400">{formatCurrency(net)}</td>
    </tr>
  );
}

interface ScenarioCardProps {
  title: string;
  description: string;
  monthlyNet: number;
  color: 'amber' | 'blue' | 'emerald';
  highlight?: boolean;
}

function ScenarioCard({ title, description, monthlyNet, color, highlight }: ScenarioCardProps) {
  const colorClasses = {
    amber: 'bg-amber-500/10 border-amber-500/25 text-amber-400',
    blue: 'bg-blue-500/10 border-blue-500/25 text-blue-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400',
  };

  return (
    <Card
      className={cn('p-5 border', colorClasses[color], highlight && 'ring-2 ring-emerald-500/50')}
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-text-primary">{title}</h4>
        {highlight && (
          <Badge variant="success" size="sm">
            Recommended
          </Badge>
        )}
      </div>
      <p className="text-xs text-text-muted mb-3">{description}</p>
      <div className="text-2xl font-extrabold text-text-primary">
        {formatCurrency(monthlyNet)}/mo
      </div>
      <p className="text-xs text-text-muted mt-1">Projected monthly net</p>
    </Card>
  );
}

interface TemplateCardProps {
  template: ContractTemplate;
  isCustom: boolean;
  onEdit: () => void;
  onCopy: () => void;
  onDownload: () => void;
  onDelete?: () => void;
}

function TemplateCard({
  template,
  isCustom,
  onEdit,
  onCopy,
  onDownload,
  onDelete,
}: TemplateCardProps) {
  const categoryLabels = {
    fixed: 'Fixed Price',
    hourly: 'Hourly',
    retainer: 'Retainer',
    milestone: 'Milestone',
  };

  const categoryColors = {
    fixed: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
    hourly: 'bg-blue-500/10 text-blue-400 border-blue-500/25',
    retainer: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
    milestone: 'bg-purple-500/10 text-purple-400 border-purple-500/25',
  };

  return (
    <Card3D
      maxTilt={5}
      depth={15}
      variant="secondary"
      className="p-5 border border-border-base/90 hover:border-amber-500/40 transition-all shadow-card flex flex-col"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/25">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-text-primary truncate">{template.name}</h4>
            <span
              className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider border',
                categoryColors[template.category]
              )}
            >
              {categoryLabels[template.category]}
            </span>
          </div>
        </div>
        {isCustom && (
          <Badge variant="outline" size="sm">
            Custom
          </Badge>
        )}
      </div>

      <p className="text-xs text-text-muted line-clamp-2 mb-4 flex-1">{template.description}</p>

      <div className="flex flex-wrap gap-1.5 mb-2">
        {template.variables.slice(0, 4).map((v) => (
          <span
            key={v}
            className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-bg-base/50 border border-border-base text-text-muted"
          >
            {v}
          </span>
        ))}
        {template.variables.length > 4 && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-bg-base/50 border border-border-base text-text-muted">
            +{template.variables.length - 4} more
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2 pt-3 border-t border-border-base mt-auto">
        <Button
          variant="ghost"
          size="xs"
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-1"
          icon={<Edit className="w-3.5 h-3.5" />}
        >
          Edit
        </Button>
        <Button
          variant="ghost"
          size="xs"
          onClick={onCopy}
          className="flex-1 flex items-center justify-center gap-1"
          icon={<Copy className="w-3.5 h-3.5" />}
        >
          Copy
        </Button>
        <Button
          variant="ghost"
          size="xs"
          onClick={onDownload}
          className="flex-1 flex items-center justify-center gap-1"
          icon={<Download className="w-3.5 h-3.5" />}
        >
          Download
        </Button>
        {onDelete && (
          <Button
            variant="ghost"
            size="xs"
            onClick={onDelete}
            className="text-red-400 hover:bg-red-500/10"
            icon={<Trash2 className="w-3.5 h-3.5" />}
          />
        )}
      </div>
    </Card3D>
  );
}
