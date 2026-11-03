import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  Briefcase,
  DollarSign,
  Clock,
  Receipt,
  Bell,
  Building,
} from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { AppSettingsSection } from '../../components/settings/AppSettingsSection';
import { api } from '../../services/api';

export default function FreelancerSettingsPage() {
  const { showToast } = useWorkspace();
  const { user, refreshUser } = useAuth();

  const [businessName, setBusinessName] = useState('Apex Creative & Code Studio');
  const [hourlyRate, setHourlyRate] = useState('85');
  const [currency, setCurrency] = useState('USD');
  const [minProjectFee, setMinProjectFee] = useState('1500');
  const [paymentTerms, setPaymentTerms] = useState('Net 15');
  const [taxRate, setTaxRate] = useState('0');

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
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500 border border-orange-500/20">
            <Settings className="w-5 h-5 text-orange-500" />
          </span>
          <span className="text-xs font-mono font-bold text-orange-600 dark:text-orange-400">
            FREELANCER STUDIO CONFIGURATION
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary mt-1">
          Freelance &amp; Client Settings
        </h1>
        <p className="text-xs md:text-sm text-text-muted">
          Configure business rates, billable capacity, milestone delivery terms, invoices, and
          application defaults.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Business & Commercial Billing */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-border-base">
            <DollarSign className="w-5 h-5 text-orange-500" />
            <div>
              <h3 className="text-sm font-bold text-text-primary">
                Commercial Rates &amp; Payment Terms
              </h3>
              <p className="text-xs text-text-muted">
                Applied to proposal generation, invoice creation, and client contract scoping
              </p>
            </div>
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
              <label className="text-xs font-semibold text-text-secondary block">
                Billing Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-bg-surface border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD ($)</option>
                <option value="AUD">AUD ($)</option>
                <option value="INR">INR (₹)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary block">
                Standard Hourly Rate ({currency})
              </label>
              <input
                type="number"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                placeholder="85"
                className="w-full bg-bg-surface border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary block">
                Minimum Project Fee ({currency})
              </label>
              <input
                type="number"
                value={minProjectFee}
                onChange={(e) => setMinProjectFee(e.target.value)}
                placeholder="1500"
                className="w-full bg-bg-surface border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
              />
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
        </Card>

        {/* Time Tracking & Capacity Management */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-border-base">
            <Clock className="w-5 h-5 text-orange-500" />
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
        </Card>

        {/* Client Invoicing & Delivery Workflow */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-border-base">
            <Receipt className="w-5 h-5 text-orange-500" />
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
        </Card>

        {/* Global Application & System Settings */}
        <AppSettingsSection />

        {/* Save Bar */}
        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            variant="primary"
            disabled={isSaving}
            className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white shadow-sm font-semibold"
            leftIcon={<Save className="w-4 h-4" />}
          >
            {isSaving ? 'Saving Settings...' : 'Save Freelance Settings'}
          </Button>
        </div>
      </form>
    </div>
  );
}
