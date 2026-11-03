import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '../../../services/api';
import {
  fetchInvoices,
  fetchInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  generateInvoiceFromProject,
  sendInvoice,
  markInvoicePaid,
  downloadInvoicePdf,
  fetchInvoiceStats,
} from '../../../services/invoiceService';

vi.mock('../../../services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('invoiceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetchInvoices queries /invoices with filters', async () => {
    const mockInvoices = [{ id: 1, invoice_number: 'INV-001', total_amount: 1500 }];
    (api.get as any).mockResolvedValueOnce(mockInvoices);

    const result = await fetchInvoices({ status: 'sent', project_id: 4 });
    expect(api.get).toHaveBeenCalledWith('/invoices', {
      params: { status: 'sent', project_id: 4 },
      signal: undefined,
    });
    expect(result).toEqual(mockInvoices);
  });

  it('fetchInvoice queries single invoice by id', async () => {
    const mockInvoice = { id: 10, invoice_number: 'INV-010', client_name: 'Acme Corp' };
    (api.get as any).mockResolvedValueOnce(mockInvoice);

    const result = await fetchInvoice(10);
    expect(api.get).toHaveBeenCalledWith('/invoices/10', { signal: undefined });
    expect(result).toEqual(mockInvoice);
  });

  it('createInvoice posts to /invoices', async () => {
    const payload = {
      client_name: 'Acme Corp',
      client_email: 'billing@acme.com',
      items: [{ description: 'Frontend Development', quantity: 20, unit_price: 85 }],
    };
    (api.post as any).mockResolvedValueOnce({ id: 11, ...payload, total_amount: 1700 });

    const result = await createInvoice(payload as any);
    expect(api.post).toHaveBeenCalledWith('/invoices', payload);
    expect(result.id).toBe(11);
  });

  it('updateInvoice patches /invoices/:id', async () => {
    const patchData = { status: 'paid' as const };
    (api.patch as any).mockResolvedValueOnce({ id: 11, status: 'paid' });

    const result = await updateInvoice(11, patchData);
    expect(api.patch).toHaveBeenCalledWith('/invoices/11', patchData);
    expect(result.status).toBe('paid');
  });

  it('deleteInvoice deletes /invoices/:id', async () => {
    (api.delete as any).mockResolvedValueOnce(undefined);

    await deleteInvoice(11);
    expect(api.delete).toHaveBeenCalledWith('/invoices/11');
  });

  it('generateInvoiceFromProject posts to /invoices/generate', async () => {
    const payload = { project_id: 4, include_unbilled_hours: true };
    const mockPreview = { items: [{ description: 'Milestone 1', amount: 3000 }], total: 3000 };
    (api.post as any).mockResolvedValueOnce(mockPreview);

    const result = await generateInvoiceFromProject(payload as any);
    expect(api.post).toHaveBeenCalledWith('/invoices/generate', payload);
    expect(result).toEqual(mockPreview);
  });

  it('sendInvoice and markInvoicePaid call lifecycle actions', async () => {
    (api.post as any).mockResolvedValueOnce({ id: 12, status: 'sent' });
    const sendResult = await sendInvoice(12);
    expect(api.post).toHaveBeenCalledWith('/invoices/12/send');
    expect(sendResult.status).toBe('sent');

    (api.post as any).mockResolvedValueOnce({ id: 12, status: 'paid' });
    const paidResult = await markInvoicePaid(12);
    expect(api.post).toHaveBeenCalledWith('/invoices/12/mark-paid');
    expect(paidResult.status).toBe('paid');
  });

  it('downloadInvoicePdf requests blob format', async () => {
    const mockBlob = new Blob(['%PDF-1.4'], { type: 'application/pdf' });
    (api.get as any).mockResolvedValueOnce(mockBlob);

    const result = await downloadInvoicePdf(12);
    expect(api.get).toHaveBeenCalledWith('/invoices/12/pdf', {
      responseType: 'blob',
      signal: undefined,
    });
    expect(result).toEqual(mockBlob);
  });

  it('fetchInvoiceStats queries /invoices/stats', async () => {
    const mockStats = {
      total_invoices: 14,
      total_revenue: 48500,
      outstanding_amount: 8200,
      overdue_count: 1,
      avg_payment_days: 12,
    };
    (api.get as any).mockResolvedValueOnce(mockStats);

    const result = await fetchInvoiceStats();
    expect(api.get).toHaveBeenCalledWith('/invoices/stats', { signal: undefined });
    expect(result).toEqual(mockStats);
  });
});
