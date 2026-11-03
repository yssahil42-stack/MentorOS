import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, CheckCircle2, Loader2, Layers } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { api } from '../../services/api';
import { ROLE_CONFIGS } from '../../config/roles';
import type { UserRole } from '../../types/user';
import type { OnboardingStep, OnboardingField } from '../../config/roles';
import { Spatial3DCanvas } from '../../components/ui/Spatial3DCanvas';
import { cn } from '../../utils/cn';

// ─── Individual Field ─────────────────────────────────────────────────────────

function FieldInput({ field, value, onChange }: {
  field: OnboardingField;
  value: string;
  onChange: (v: string) => void;
}) {
  const baseClass = cn(
    'w-full px-3 rounded-xl text-sm text-text-primary placeholder-text-faint',
    'bg-bg-elevated border border-border-subtle',
    'transition-all focus:outline-none focus:ring-2 focus:ring-focus focus:border-transparent',
  );

  if (field.type === 'select' && field.options) {
    return (
      <select
        id={`field-${field.name}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(baseClass, 'h-9')}
        aria-label={field.label}
      >
        <option value="">Select…</option>
        {field.options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    );
  }

  if (field.type === 'textarea') {
    return (
      <textarea
        id={`field-${field.name}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        rows={3}
        className={cn(baseClass, 'py-2.5 resize-none')}
        aria-label={field.label}
      />
    );
  }

  return (
    <input
      id={`field-${field.name}`}
      type={field.type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder}
      className={cn(baseClass, 'h-9')}
      aria-label={field.label}
      min={field.type === 'number' ? '0' : undefined}
    />
  );
}

// ─── Step Form ────────────────────────────────────────────────────────────────

function OnboardingStepForm({
  step,
  formData,
  onUpdate,
}: {
  step: OnboardingStep;
  formData: Record<string, string>;
  onUpdate: (name: string, value: string) => void;
}) {
  return (
    <div className="space-y-4">
      {step.fields.map((field) => (
        <div key={field.name}>
          <label
            htmlFor={`field-${field.name}`}
            className="block text-xs font-medium text-text-secondary mb-1.5"
          >
            {field.label}
            {field.required && <span className="text-danger ml-1" aria-hidden="true">*</span>}
          </label>
          <FieldInput
            field={field}
            value={formData[field.name] ?? ''}
            onChange={(v) => onUpdate(field.name, v)}
          />
        </div>
      ))}
    </div>
  );
}

// ─── Onboarding Page ─────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const { user, refreshUser } = useAuth();
  const { showToast }         = useWorkspace();
  const navigate               = useNavigate();

  const roleConfig = user ? ROLE_CONFIGS[user.role as UserRole] : null;
  const steps      = roleConfig?.onboardingSteps ?? [];

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData]       = useState<Record<string, string>>({});
  const [loading, setLoading]         = useState(false);

  if (!roleConfig) return null;

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  const updateField = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    // Validate required fields for current step
    const missingRequired = step.fields
      .filter((f) => f.required)
      .find((f) => !formData[f.name]?.trim());
    if (missingRequired) {
      showToast(`Please fill in "${missingRequired.label}" before continuing.`, 'warning');
      return;
    }
    setCurrentStep((v) => Math.min(v + 1, steps.length - 1));
  };

  const handleBack = () => setCurrentStep((v) => Math.max(v - 1, 0));

  const handleFinish = async () => {
    // Final validation
    const missingRequired = step.fields
      .filter((f) => f.required)
      .find((f) => !formData[f.name]?.trim());
    if (missingRequired) {
      showToast(`Please fill in "${missingRequired.label}" before continuing.`, 'warning');
      return;
    }

    setLoading(true);
    try {
      await api.patch('/auth/onboarding', { profile_data: formData });

      const rolePath = user ? user.role.replace('_', '-') : 'student';
      await refreshUser();
      showToast('Registration complete! Welcome to MentorOS.', 'success');
      navigate(`/app/${rolePath}/dashboard`, { replace: true });
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Unable to save onboarding details. Please try again.',
        'error',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4 py-12">
      {/* Glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-[120px] pointer-events-none"
        style={{ backgroundColor: `${roleConfig.color}08` }}
        aria-hidden="true"
      />

      <Spatial3DCanvas defaultMode="2d" defaultPreset="standard" className="max-w-md mx-auto">
        <div className="relative w-full">
        {/* Brand */}
        <Link
          to="/"
          className="flex items-center gap-2.5 mb-8 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus rounded-xl w-fit"
          title="Go to first page"
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform"
            style={{ backgroundColor: `${roleConfig.color}20`, border: `1px solid ${roleConfig.color}30` }}
          >
            <Layers className="h-4.5 w-4.5" style={{ color: roleConfig.color }} aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-bold text-text-primary group-hover:text-student-500 transition-colors">MentorOS</p>
            <p className="text-2xs" style={{ color: roleConfig.color }}>{roleConfig.label} Setup</p>
          </div>
        </Link>

        {/* Progress bar */}
        <div className="w-full h-1 bg-bg-elevated rounded-full mb-6 overflow-hidden" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, backgroundColor: roleConfig.color }}
          />
        </div>

        {/* Step card */}
        <div className="card p-6">
          {/* Step header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xs font-medium text-text-faint">
                Step {currentStep + 1} of {steps.length}
              </span>
            </div>
            <h1 className="text-base font-bold text-text-primary">{step.title}</h1>
            <p className="text-xs text-text-muted mt-1">{step.subtitle}</p>
          </div>

          {/* Fields */}
          <OnboardingStepForm step={step} formData={formData} onUpdate={updateField} />

          {/* Actions */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-border-subtle">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 0 || loading}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium',
                'text-text-muted hover:text-text-primary transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus',
                'disabled:opacity-0 disabled:pointer-events-none',
              )}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              Back
            </button>

            <button
              type="button"
              onClick={isLast ? handleFinish : handleNext}
              disabled={loading}
              className={cn(
                'inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white',
                'transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus',
                'disabled:opacity-50 disabled:cursor-not-allowed',
              )}
              style={{ backgroundColor: roleConfig.color }}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {loading ? 'Saving…' : isLast ? (
                <>
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  Complete Registration
                </>
              ) : (
                <>
                  Continue
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Step dots */}
        <div className="flex items-center justify-center gap-2 mt-4" aria-hidden="true">
          {steps.map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                i === currentStep ? 'w-6' : 'w-1.5 bg-bg-elevated',
              )}
              style={i === currentStep ? { backgroundColor: roleConfig.color } : {}}
            />
          ))}
        </div>
        </div>
      </Spatial3DCanvas>
    </div>
  );
}
