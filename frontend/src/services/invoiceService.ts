import { api } from './api';
import type {
  Invoice,
  CreateInvoiceRequest,
  UpdateInvoiceRequest,
  GenerateInvoiceFromProjectRequest,
  InvoicePreview,
} from '../types/invoice';

// ─── Invoice API Service ────────────────────────────────────────────────────────

export function fetchInvoices(
  params?: { status?: string; project_id?: number },
  signal?: AbortSignal
): Promise<Invoice[]> {
  return api.get<Invoice[]>('/invoices', { params, signal });
}

export function fetchInvoice(id: number, signal?: AbortSignal): Promise<Invoice> {
  return api.get<Invoice>(`/invoices/${id}`, { signal });
}

export function createInvoice(data: CreateInvoiceRequest): Promise<Invoice> {
  return api.post<Invoice>('/invoices', data);
}

export function updateInvoice(id: number, data: UpdateInvoiceRequest): Promise<Invoice> {
  return api.patch<Invoice>(`/invoices/${id}`, data);
}

export async function deleteInvoice(id: number): Promise<void> {
  await api.delete(`/invoices/${id}`);
}

export function generateInvoiceFromProject(
  data: GenerateInvoiceFromProjectRequest
): Promise<InvoicePreview> {
  return api.post<InvoicePreview>('/invoices/generate', data);
}

export function sendInvoice(id: number): Promise<Invoice> {
  return api.post<Invoice>(`/invoices/${id}/send`);
}

export function markInvoicePaid(id: number): Promise<Invoice> {
  return api.post<Invoice>(`/invoices/${id}/mark-paid`);
}

export function downloadInvoicePdf(id: number, signal?: AbortSignal): Promise<Blob> {
  return api.get<Blob>(`/invoices/${id}/pdf`, { responseType: 'blob', signal });
}

export function fetchInvoiceStats(signal?: AbortSignal): Promise<{
  total_invoices: number;
  total_revenue: number;
  outstanding_amount: number;
  overdue_count: number;
  avg_payment_days: number;
}> {
  return api.get('/invoices/stats', { signal });
}
