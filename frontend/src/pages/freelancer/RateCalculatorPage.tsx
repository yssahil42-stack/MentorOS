import React, { useState, useMemo } from 'react';
import {
  Calculator,
  Coins,
  ArrowLeftRight,
  Clock,
  Calendar,
  Target,
  TrendingUp,
  Building2,
} from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { Card } from '../../components/ui/Card';
import { Card3D } from '../../components/ui/Card3D';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { CurrencyConverter } from '../../components/ui/CurrencyConverter';
import { CurrencySelect } from '../../components/ui/CurrencySelect';
import { formatCurrency } from '../../utils/dateUtils';
import { CURRENCY_OPTIONS, getCurrencySymbol, convertCurrency } from '../../utils/currency';
import { cn } from '../../utils/cn';

// ─── Calculator Interfaces ───────────────────────────────────────────────────

export interface RateInputs {
  hourlyRate: number;
  monthlyTarget: number;
  billableHoursPerWeek: number;
  weeksPerYear: number;
  overheadPercentage: number;
  utilizationRate: number;
  currency: string;
}

export default function RateCalculatorPage() {
  const { showToast } = useWorkspace();
  const [showCurrencyConverter, setShowCurrencyConverter] = useState(false);

  const [inputs, setInputs] = useState<RateInputs>({
    currency: 'INR',
    hourlyRate: 2500,
    monthlyTarget: 200000,
    billableHoursPerWeek: 20,
    weeksPerYear: 48,
    overheadPercentage: 25,
    utilizationRate: 75,
  });

  // ─── Pure Static Derivations ────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const {
      hourlyRate,
      monthlyTarget,
      billableHoursPerWeek,
      weeksPerYear,
      overheadPercentage,
      utilizationRate,
    } = inputs;

    const safeRate = Math.max(0, hourlyRate);
    const safeHours = Math.max(0, billableHoursPerWeek);
    const safeWeeks = Math.max(0, weeksPerYear);
    const safeOverhead = Math.max(0, overheadPercentage);
    const safeUtil = Math.max(1, utilizationRate);

    const annualBillableHours = safeHours * safeWeeks * (safeUtil / 100);
    const annualGross = safeRate * annualBillableHours;
    const monthlyGross = annualGross / 12;
    const overheadCost = annualGross * (safeOverhead / 100);
    const annualNet = annualGross - overheadCost;
    const monthlyNet = annualNet / 12;
    const effectiveHourlyRate = annualBillableHours > 0 ? annualNet / annualBillableHours : 0;

    const annualTarget = safeRate > 0 ? monthlyTarget * 12 : 0;
    const targetWithOverhead = annualTarget / (1 - safeOverhead / 100);
    const requiredBillableHours = safeRate > 0 ? targetWithOverhead / safeRate : 0;
    const requiredBillableHoursPerWeek = safeWeeks > 0 ? requiredBillableHours / safeWeeks : 0;

    const breakEvenRate = annualBillableHours > 0 ? targetWithOverhead / annualBillableHours : 0;

    return {
      annualBillableHours,
      annualGross,
      monthlyGross,
      overheadCost,
      annualNet,
      monthlyNet,
      effectiveHourlyRate,
      requiredBillableHoursPerWeek,
      breakEvenRate,
      targetWithOverhead,
    };
  }, [inputs]);

  const updateInput = (key: keyof RateInputs, value: number) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const handleCurrencyChange = (newCurrency: string) => {
    const oldCurrency = inputs.currency;
    if (oldCurrency === newCurrency) return;

    const convertedRate = Math.round(convertCurrency(inputs.hourlyRate, oldCurrency, newCurrency));
    const convertedTarget = Math.round(
      convertCurrency(inputs.monthlyTarget, oldCurrency, newCurrency)
    );

    setInputs((prev) => ({
      ...prev,
      currency: newCurrency,
      hourlyRate: convertedRate,
      monthlyTarget: convertedTarget,
    }));

    showToast(`Converted calculator values to ${newCurrency}`, 'info');
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in pb-16 px-1 sm:px-4">
      <div className="bg-white dark:bg-[#161922] rounded-3xl border border-[#eee7e0] dark:border-stone-800/80 p-5 sm:p-8 space-y-6 shadow-xs">
      {/* ─── HEADER ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <Calculator className="w-5 h-5" />
            </span>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              RATE CALCULATOR
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary">Rate Calculator</h1>
          <p className="text-xs md:text-sm text-text-secondary max-w-2xl">
            Calculate your target hourly rate, minimum viable billing, project milestones, and
            retainer pricing based on your real expenses and billable hours.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Currency Switcher */}
          <div className="flex items-center gap-2 bg-bg-surface border border-border-base rounded-xl px-3 py-2 shadow-2xs">
            <span className="text-2xs font-semibold text-text-muted uppercase tracking-wider">
              Currency:
            </span>
            <CurrencySelect
              value={inputs.currency}
              onChange={(newCurrency) => handleCurrencyChange(newCurrency)}
              format="code-symbol"
            />
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowCurrencyConverter((prev) => !prev)}
            className="border-amber-500/30 text-amber-500 hover:bg-amber-500/10 font-semibold"
            icon={<ArrowLeftRight className="w-4 h-4" />}
          >
            {showCurrencyConverter ? 'Hide Converter' : 'Currency Converter'}
          </Button>
        </div>
      </div>

      {/* ─── OPTIONAL INLINE CURRENCY CONVERTER ────────────────────────────── */}
      {showCurrencyConverter && (
        <div className="animate-in fade-in duration-200">
          <CurrencyConverter
            initialAmount={inputs.hourlyRate}
            initialFromCurrency={inputs.currency}
            initialToCurrency={inputs.currency === 'INR' ? 'USD' : 'INR'}
            onApplyRate={(rate, curr) => {
              setInputs((prev) => ({
                ...prev,
                currency: curr,
                hourlyRate: Math.round(rate),
              }));
              showToast(`Applied ${curr} ${Math.round(rate)}/hr to Rate Calculator`, 'success');
            }}
            applyButtonLabel="Apply to Rate Calculator"
          />
        </div>
      )}

      {/* ─── RATE CALCULATOR GRID ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
        {/* Input Panel */}
        <div className="lg:col-span-1 space-y-6">
          <Card3D
            maxTilt={3}
            depth={20}
            variant="glass"
            className="p-5 border border-border-base/90 shadow-card"
          >
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-border-base">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <span className="p-1 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/25">
                  <Target className="w-4 h-4" />
                </span>
                Rate Inputs ({inputs.currency})
              </h3>
            </div>

            <div className="space-y-4">
              <InputField
                label="Hourly Rate"
                icon={<Coins className="w-4 h-4 text-amber-500" />}
                value={inputs.hourlyRate}
                onChange={(v) => updateInput('hourlyRate', v)}
                type="number"
                min="1"
                step={inputs.currency === 'INR' ? '100' : '5'}
                prefix={getCurrencySymbol(inputs.currency)}
                suffix="/hr"
              />

              <InputField
                label="Monthly Income Target"
                icon={<Target className="w-4 h-4 text-emerald-500" />}
                value={inputs.monthlyTarget}
                onChange={(v) => updateInput('monthlyTarget', v)}
                type="number"
                min="0"
                step={inputs.currency === 'INR' ? '5000' : '500'}
                prefix={getCurrencySymbol(inputs.currency)}
              />

              <InputField
                label="Billable Hours/Week"
                icon={<Clock className="w-4 h-4" />}
                value={inputs.billableHoursPerWeek}
                onChange={(v) => updateInput('billableHoursPerWeek', v)}
                type="number"
                min="1"
                max="40"
                step="1"
                suffix="hrs"
              />

              <InputField
                label="Weeks Worked/Year"
                icon={<Calendar className="w-4 h-4" />}
                value={inputs.weeksPerYear}
                onChange={(v) => updateInput('weeksPerYear', v)}
                type="number"
                min="1"
                max="52"
                step="1"
                suffix="weeks"
              />

              <InputField
                label="Overhead % (taxes, tools, insurance)"
                icon={<TrendingUp className="w-4 h-4" />}
                value={inputs.overheadPercentage}
                onChange={(v) => updateInput('overheadPercentage', v)}
                type="number"
                min="0"
                max="100"
                step="1"
                suffix="%"
              />

              <InputField
                label="Utilization Rate %"
                icon={<Building2 className="w-4 h-4" />}
                value={inputs.utilizationRate}
                onChange={(v) => updateInput('utilizationRate', v)}
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
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Quick Market Tiers ({inputs.currency})
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(inputs.currency === 'INR'
                ? [
                    { label: 'Junior Freelancer', rate: 1200, hours: 25, overhead: 20, util: 70 },
                    {
                      label: 'Mid-Level Specialist',
                      rate: 2500,
                      hours: 20,
                      overhead: 25,
                      util: 75,
                    },
                    { label: 'Senior Consultant', rate: 4500, hours: 15, overhead: 30, util: 80 },
                    { label: 'Principal / Lead', rate: 7500, hours: 10, overhead: 35, util: 60 },
                  ]
                : [
                    { label: 'Junior Dev', rate: 75, hours: 25, overhead: 25, util: 70 },
                    { label: 'Mid-Level', rate: 125, hours: 20, overhead: 30, util: 75 },
                    { label: 'Senior', rate: 200, hours: 15, overhead: 35, util: 80 },
                    { label: 'Expert/Consultant', rate: 300, hours: 10, overhead: 40, util: 60 },
                  ]
              ).map((preset) => (
                <button
                  key={preset.label}
                  onClick={() =>
                    setInputs((prev) => ({
                      ...prev,
                      hourlyRate: preset.rate,
                      billableHoursPerWeek: preset.hours,
                      overheadPercentage: preset.overhead,
                      utilizationRate: preset.util,
                    }))
                  }
                  className={cn(
                    'p-3 rounded-xl text-left border transition-all text-xs cursor-pointer',
                    inputs.hourlyRate === preset.rate
                      ? 'border-amber-500/50 bg-amber-500/5'
                      : 'border-border-base hover:border-amber-500/30'
                  )}
                >
                  <p className="font-semibold text-text-primary">{preset.label}</p>
                  <p className="text-text-muted">
                    {formatCurrency(preset.rate, inputs.currency)}/hr &bull; {preset.hours} hrs/wk
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
              value={formatCurrency(metrics.monthlyGross, inputs.currency)}
              subtitle="Before overhead"
              icon={<Coins className="w-5 h-5" />}
              color="amber"
            />
            <MetricCard
              label="Monthly Net"
              value={formatCurrency(metrics.monthlyNet, inputs.currency)}
              subtitle="After overhead"
              icon={<Coins className="w-5 h-5" />}
              color="emerald"
            />
            <MetricCard
              label="Effective Hourly"
              value={`${formatCurrency(metrics.effectiveHourlyRate, inputs.currency)}/hr`}
              subtitle="Real rate after costs"
              icon={<Calculator className="w-5 h-5" />}
              color="blue"
            />
            <MetricCard
              label="Hours Needed for Target"
              value={`${metrics.requiredBillableHoursPerWeek.toFixed(1)} hrs/wk`}
              subtitle={metrics.requiredBillableHoursPerWeek > 40 ? '⚠️ Unrealistic' : 'Achievable'}
              icon={<Target className="w-5 h-5" />}
              color={metrics.requiredBillableHoursPerWeek > 40 ? 'red' : 'purple'}
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
              Annual Projection ({inputs.currency})
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
                    gross={metrics.annualGross}
                    net={metrics.annualNet}
                    currency={inputs.currency}
                  />
                  <RowMetric
                    label="Monthly (×12)"
                    gross={metrics.monthlyGross}
                    net={metrics.monthlyNet}
                    currency={inputs.currency}
                  />
                  <RowMetric
                    label="Weekly (×52)"
                    gross={metrics.annualGross / 52}
                    net={metrics.annualNet / 52}
                    currency={inputs.currency}
                  />
                  <RowMetric
                    label="Daily (×260)"
                    gross={metrics.annualGross / 260}
                    net={metrics.annualNet / 260}
                    currency={inputs.currency}
                  />
                  <RowMetric
                    label="Per Billable Hour"
                    gross={inputs.hourlyRate}
                    net={metrics.effectiveHourlyRate}
                    currency={inputs.currency}
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
              Scenario Analysis ({inputs.currency})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ScenarioCard
                title="Conservative"
                description="75% utilization, 35% overhead"
                monthlyNet={inputs.hourlyRate * inputs.billableHoursPerWeek * 4 * 0.75 * 0.65}
                color="amber"
                currency={inputs.currency}
              />
              <ScenarioCard
                title="Realistic"
                description={`${inputs.utilizationRate}% utilization, ${inputs.overheadPercentage}% overhead`}
                monthlyNet={metrics.monthlyNet}
                color="emerald"
                currency={inputs.currency}
                highlight
              />
              <ScenarioCard
                title="Optimistic"
                description="90% utilization, 25% overhead"
                monthlyNet={inputs.hourlyRate * inputs.billableHoursPerWeek * 4 * 0.9 * 0.75}
                color="blue"
                currency={inputs.currency}
              />
            </div>
          </Card>
        </div>
      </div>
      </div>
    </div>
  );
}

// ─── Sub-Components ─────────────────────────────────────────────────────────

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
  currency?: string;
}

function RowMetric({ label, gross, net, highlight, currency = 'INR' }: RowMetricProps) {
  return (
    <tr className={cn(highlight && 'bg-amber-500/5 font-semibold')}>
      <td className="py-2 text-text-secondary">{label}</td>
      <td className="py-2 text-right text-text-primary">{formatCurrency(gross, currency)}</td>
      <td className="py-2 text-right font-medium text-emerald-400">
        {formatCurrency(net, currency)}
      </td>
    </tr>
  );
}

interface ScenarioCardProps {
  title: string;
  description: string;
  monthlyNet: number;
  color: 'amber' | 'blue' | 'emerald';
  highlight?: boolean;
  currency?: string;
}

function ScenarioCard({
  title,
  description,
  monthlyNet,
  color,
  highlight,
  currency = 'INR',
}: ScenarioCardProps) {
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
        {formatCurrency(monthlyNet, currency)}/mo
      </div>
      <p className="text-xs text-text-muted mt-1">Projected monthly net</p>
    </Card>
  );
}
