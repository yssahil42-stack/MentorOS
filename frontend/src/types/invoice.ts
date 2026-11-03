// ─── Invoice Types ───────────────────────────────────────────────────────────────

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type PaymentTerms = 'net_15' | 'net_30' | 'net_45' | 'due_on_receipt';

export interface Invoice {
  id: number;
  user_id: number;
  role: string;
  project_id: number;
  invoice_number: string;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
  payment_terms: PaymentTerms;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  currency: string;
  notes?: string;
  paid_at?: string | null;
  sent_at?: string | null;
  created_at: string;
  updated_at: string;
  // Populated joins
  project_title?: string;
  client_name?: string;
  client_email?: string;
  client_address?: string;
  line_items: InvoiceLineItem[];
}

export interface InvoiceLineItem {
  id: number;
  invoice_id?: number;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  sort_order: number;
  // Source tracking
  source_type?: 'milestone' | 'task' | 'custom';
  source_id?: number;
}

export interface CreateInvoiceRequest {
  project_id: number;
  invoice_number?: string;
  issue_date?: string;
  due_date?: string;
  payment_terms?: PaymentTerms;
  tax_rate?: number;
  currency?: string;
  notes?: string;
  line_items: CreateInvoiceLineItemRequest[];
  client_name?: string;
  client_email?: string;
  client_address?: string;
}

export interface CreateInvoiceLineItemRequest {
  description: string;
  quantity: number;
  unit_price: number;
  source_type?: 'milestone' | 'task' | 'custom';
  source_id?: number;
}

export interface UpdateInvoiceRequest {
  invoice_number?: string;
  status?: InvoiceStatus;
  issue_date?: string;
  due_date?: string;
  payment_terms?: PaymentTerms;
  tax_rate?: number;
  currency?: string;
  notes?: string;
  client_name?: string;
  client_email?: string;
  client_address?: string;
}

export interface GenerateInvoiceFromProjectRequest {
  project_id: number;
  include_completed_milestones: boolean;
  include_completed_tasks: boolean;
  payment_terms?: PaymentTerms;
  tax_rate?: number;
  currency?: string;
  notes?: string;
}

export interface InvoicePreview {
  invoice: Omit<Invoice, 'id' | 'created_at' | 'updated_at' | 'line_items'>;
  line_items: Omit<InvoiceLineItem, 'id' | 'invoice_id'>[];
  source_milestones: number[];
  source_tasks: number[];
}

// Default payment terms
export const PAYMENT_TERMS_OPTIONS: { value: PaymentTerms; label: string; days: number }[] = [
  { value: 'due_on_receipt', label: 'Due on Receipt', days: 0 },
  { value: 'net_15', label: 'Net 15', days: 15 },
  { value: 'net_30', label: 'Net 30', days: 30 },
  { value: 'net_45', label: 'Net 45', days: 45 },
];

export const INVOICE_STATUS_COLORS: Record<InvoiceStatus, string> = {
  draft: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  sent: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  paid: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  overdue: 'bg-red-500/10 text-red-400 border-red-500/20',
  cancelled: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  paid: 'Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
};

// Helper functions
export function calculateInvoiceTotals(
  lineItems: { quantity: number; unit_price: number }[],
  taxRate: number = 0
): { subtotal: number; taxAmount: number; total: number } {
  const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;
  return { subtotal, taxAmount, total };
}

export function generateInvoiceNumber(existingInvoices: Invoice[]): string {
  const year = new Date().getFullYear();
  const count =
    existingInvoices.filter((inv) => inv.invoice_number.startsWith(`INV-${year}-`)).length + 1;
  return `INV-${year}-${String(count).padStart(4, '0')}`;
}

export function calculateDueDate(issueDate: string, terms: PaymentTerms): string {
  const date = new Date(issueDate);
  const days = PAYMENT_TERMS_OPTIONS.find((t) => t.value === terms)?.days || 0;
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}
