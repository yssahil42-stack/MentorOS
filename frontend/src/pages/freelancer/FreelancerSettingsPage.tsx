import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  Briefcase,
  Clock,
  Receipt,
  Bell,
  Building,
  ArrowLeftRight,
  IndianRupee,
} from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { CurrencyConverter } from '../../components/ui/CurrencyConverter';
import { CurrencySelect } from '../../components/ui/CurrencySelect';
import { getCurrencySymbol, CURRENCY_OPTIONS } from '../../utils/currency';
import { AppSettingsSection } from '../../components/settings/AppSettingsSection';
import { api } from '../../services/api';

export default function FreelancerSettingsPage() {
  const { showToast } = useWorkspace();
  const { user, refreshUser } = useAuth();

  const [businessName, setBusinessName] = useState('Apex Creative & Code Studio');
  const [hourlyRate, setHourlyRate] = useState('2500');
  const [currency, setCurrency] = useState('INR');
  const [minProjectFee, setMinProjectFee] = useState('40000');
  const [paymentTerms, setPaymentTerms] = useState('Net 15');
  const [taxRate, setTaxRate] = useState('0');
  const [showConverterModal, setShowConverterModal] = useState(false);

  const [weeklyCapacityHours, setWeeklyCapacityHours] = useState('30');
  const [trackInternalTime, setTrackInternalTime] = useState(true);
  const [scopeCreepBuffer, setScopeCreepBuffer] = useState('115');

  const [autoDeliveryReceipts, setAutoDeliveryReceipts] = useState(true);
  const [portalLinkExpiry, setPortalLinkExpiry] = useState('30');
  const [invoiceReminders, setInvoiceReminders] = useState(true);
  const [defaultInvoiceNotes, setDefaultInvoiceNotes] = useState(
    'Thank you for your business. Wire transfer instructions on file.'
  );

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`mentoros_settings_freelancer_${user?.id ?? 'guest'}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.businessName) setBusinessName(parsed.businessName);
        if (parsed.hourlyRate) setHourlyRate(parsed.hourlyRate);
        if (parsed.currency) setCurrency(parsed.currency);
        if (parsed.minProjectFee) setMinProjectFee(parsed.minProjectFee);
        if (parsed.paymentTerms) setPaymentTerms(parsed.paymentTerms);
        if (parsed.taxRate) setTaxRate(parsed.taxRate);
        if (parsed.weeklyCapacityHours) setWeeklyCapacityHours(parsed.weeklyCapacityHours);
        if (parsed.trackInternalTime !== undefined) setTrackInternalTime(parsed.trackInternalTime);
        if (parsed.scopeCreepBuffer) setScopeCreepBuffer(parsed.scopeCreepBuffer);
        if (parsed.autoDeliveryReceipts !== undefined)
          setAutoDeliveryReceipts(parsed.autoDeliveryReceipts);
        if (parsed.portalLinkExpiry) setPortalLinkExpiry(parsed.portalLinkExpiry);
        if (parsed.invoiceReminders !== undefined) setInvoiceReminders(parsed.invoiceReminders);
        if (parsed.defaultInvoiceNotes) setDefaultInvoiceNotes(parsed.defaultInvoiceNotes);
      }
    } catch {
      // ignore
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const payload = {
      businessName,
      hourlyRate,
      currency,
      minProjectFee,
      paymentTerms,
      taxRate,
      weeklyCapacityHours,
      trackInternalTime,
      scopeCreepBuffer,
      autoDeliveryReceipts,
      portalLinkExpiry,
      invoiceReminders,
      defaultInvoiceNotes,
    };

    try {
      localStorage.setItem(
        `mentoros_settings_freelancer_${user?.id ?? 'guest'}`,
        JSON.stringify(payload)
      );
      try {
        await api.patch('/auth/me/onboarding', {
          profile_data: {
            ...((user?.profile_data as Record<string, unknown>) || {}),
            freelancer_settings: payload,
          },
        });
        if (refreshUser) await refreshUser();
      } catch {
        // offline fallback
      }
      showToast('Freelancer workspace settings saved successfully!', 'success');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in pb-16 px-1 sm:px-4">
      {/* Header Container */}
      <div className="bg-white dark:bg-[#161922] rounded-3xl border border-[#eee7e0] dark:border-stone-800/80 p-5 sm:p-8 space-y-6 shadow-xs">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
            Freelance &amp; client settings
          </h1>
          <p className="text-xs text-text-secondary mt-1 font-medium">
            Configure business rates, billable capacity, milestone delivery terms, invoices, and application defaults.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Business & Commercial Billing */}
          <div className="p-6 rounded-2xl border border-border-base/90 bg-[#faf8f5]/60 dark:bg-stone-900/40 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-border-base/60 gap-3">
              <div className="flex items-center gap-2.5">
                <IndianRupee className="w-5 h-5 text-[#c04b1e]" />
                <div>
                  <h3 className="text-sm font-bold text-text-primary">
                    Commercial Rates &amp; Payment Terms
                  </h3>
                  <p className="text-xs text-text-muted">
                    Applied to proposal generation, invoice creation, and client contract scoping
                    (Default: INR ₹)
                  </p>
                </div>
              </div>
            <button
              type="button"
              onClick={() => setShowConverterModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30 transition-all cursor-pointer self-start sm:self-auto"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Currency Converter</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-text-secondary block">
                Studio / Business Name
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Apex Creative & Code Studio"
                className="w-full bg-bg-surface border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-text-secondary block">
                  Billing Currency
                </label>
                <button
                  type="button"
                  onClick={() => setShowConverterModal(true)}
                  className="text-3xs text-orange-600 dark:text-orange-400 font-semibold hover:underline flex items-center gap-1"
                >
                  <ArrowLeftRight className="w-3 h-3" />
                  Convert
                </button>
              </div>
              <CurrencySelect
                value={currency}
                onChange={(c) => setCurrency(c)}
                format="full"
                className="w-full"
                buttonClassName="w-full bg-bg-surface border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary block">
                Standard Hourly Rate ({currency})
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-text-muted">
                  {getCurrencySymbol(currency)}
                </span>
                <input
                  type="number"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  placeholder={currency === 'INR' ? '2500' : '85'}
                  className="w-full bg-bg-surface border border-border-base rounded-xl pl-8 pr-3 py-2 text-xs text-text-primary focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary block">
                Minimum Project Fee ({currency})
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-text-muted">
                  {getCurrencySymbol(currency)}
                </span>
                <input
                  type="number"
                  value={minProjectFee}
                  onChange={(e) => setMinProjectFee(e.target.value)}
                  placeholder={currency === 'INR' ? '40000' : '1500'}
                  className="w-full bg-bg-surface border border-border-base rounded-xl pl-8 pr-3 py-2 text-xs text-text-primary focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary block">
                Default Payment Terms
              </label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full bg-bg-surface border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
              >
                <option value="Due on Receipt">Due on Receipt</option>
                <option value="Net 15">Net 15 Days</option>
                <option value="Net 30">Net 30 Days (Standard)</option>
                <option value="Net 60">Net 60 Days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Time Tracking & Capacity Management */}
        <div className="p-6 rounded-2xl border border-border-base/90 bg-[#faf8f5]/60 dark:bg-stone-900/40 space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-border-base/60">
            <Clock className="w-5 h-5 text-[#c04b1e]" />
            <div>
              <h3 className="text-sm font-bold text-text-primary">
                Capacity &amp; Billable Time Tracking
              </h3>
              <p className="text-xs text-text-muted">
                Manage workload saturation, scope creep alerts, and billable vs admin minute
                allocation
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary block">
                Target Weekly Billable Hours
              </label>
              <input
                type="number"
                value={weeklyCapacityHours}
                onChange={(e) => setWeeklyCapacityHours(e.target.value)}
                placeholder="30"
                className="w-full bg-bg-surface border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary block">
                Scope Creep Warning Threshold
              </label>
              <select
                value={scopeCreepBuffer}
                onChange={(e) => setScopeCreepBuffer(e.target.value)}
                className="w-full bg-bg-surface border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
              >
                <option value="110">At 110% of Estimated Hours</option>
                <option value="115">At 115% of Estimated Hours (Recommended)</option>
                <option value="125">At 125% of Estimated Hours</option>
              </select>
            </div>
          </div>

          <div className="pt-2 border-t border-border-base">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={trackInternalTime}
                onChange={(e) => setTrackInternalTime(e.target.checked)}
                className="rounded text-orange-500 bg-bg-surface border-border-base focus:ring-orange-500"
              />
              <div className="text-xs">
                <span className="font-medium text-text-primary">
                  Separate Billable vs Non-Billable Minutes
                </span>
                <p className="text-3xs text-text-muted">
                  Distinguish between client billable tasks and internal administrative development
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Client Invoicing & Delivery Workflow */}
        <div className="p-6 rounded-2xl border border-border-base/90 bg-[#faf8f5]/60 dark:bg-stone-900/40 space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-border-base/60">
            <Receipt className="w-5 h-5 text-[#c04b1e]" />
            <div>
              <h3 className="text-sm font-bold text-text-primary">
                Client Invoices &amp; Delivery Receipts
              </h3>
              <p className="text-xs text-text-muted">
                Controls portal access links, invoice reminders, and payment remittance instructions
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary block">
                Default Invoice Notes &amp; Remittance Memo
              </label>
              <textarea
                rows={2}
                value={defaultInvoiceNotes}
                onChange={(e) => setDefaultInvoiceNotes(e.target.value)}
                className="w-full bg-bg-surface border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-secondary block">
                  Client Portal Share Link Expiration
                </label>
                <select
                  value={portalLinkExpiry}
                  onChange={(e) => setPortalLinkExpiry(e.target.value)}
                  className="w-full bg-bg-surface border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                >
                  <option value="7">7 Days</option>
                  <option value="14">14 Days</option>
                  <option value="30">30 Days (Standard)</option>
                  <option value="never">Permanent (Never expires)</option>
                </select>
              </div>
            </div>

            <div className="pt-2 border-t border-border-base space-y-2.5">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoDeliveryReceipts}
                  onChange={(e) => setAutoDeliveryReceipts(e.target.checked)}
                  className="rounded text-orange-500 bg-bg-surface border-border-base focus:ring-orange-500"
                />
                <div className="text-xs">
                  <span className="font-medium text-text-primary">
                    Auto-generate Client Delivery Receipts
                  </span>
                  <p className="text-3xs text-text-muted">
                    Produces verification receipts when project milestones are marked delivered
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={invoiceReminders}
                  onChange={(e) => setInvoiceReminders(e.target.checked)}
                  className="rounded text-orange-500 bg-bg-surface border-border-base focus:ring-orange-500"
                />
                <div className="text-xs">
                  <span className="font-medium text-text-primary">Overdue Invoice Alerts</span>
                  <p className="text-3xs text-text-muted">
                    Notify immediately when unpaid client invoices surpass payment terms
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Global Application & System Settings */}
        <AppSettingsSection />

        {/* Save Bar */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="h-10 px-5 rounded-xl bg-[#c04b1e] hover:bg-[#a33d16] text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-all active:translate-y-[1px] cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Settings...' : 'Save Freelance Settings'}</span>
          </button>
        </div>
      </form>
      </div>

      {/* ─── CURRENCY CONVERTER MODAL ─────────────────────────────────────── */}
      {showConverterModal && (
        <Modal
          isOpen={showConverterModal}
          onClose={() => setShowConverterModal(false)}
          title="Currency Converter & Rate Exchange"
          size="xl"
        >
          <div className="p-2 sm:p-4">
            <CurrencyConverter
              initialAmount={Number(hourlyRate) || 2500}
              initialFromCurrency={currency}
              initialToCurrency={currency === 'INR' ? 'USD' : 'INR'}
              onApplyRate={(convertedAmount, targetCurr) => {
                setHourlyRate(String(Math.round(convertedAmount)));
                setCurrency(targetCurr);
                showToast(
                  `Standard rate set to ${getCurrencySymbol(targetCurr)}${Math.round(convertedAmount).toLocaleString()}/hr (${targetCurr})`,
                  'success'
                );
                setShowConverterModal(false);
              }}
              variant="modal"
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
