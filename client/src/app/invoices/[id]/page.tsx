'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  Send,
  Bell,
  CheckCircle,
  Edit,
  Trash2,
} from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { invoicesApi, Invoice } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');

  useEffect(() => {
    async function fetchInvoice() {
      try {
        const data = await invoicesApi.getOne(params.id as string);
        setInvoice(data);
      } catch (error) {
        console.error('Failed to fetch invoice:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchInvoice();
  }, [params.id]);

  const handleDownloadPdf = async () => {
    try {
      setActionLoading('pdf');
      const blob = await invoicesApi.downloadPdf(invoice!.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoice!.invoiceNumber}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Failed to download PDF');
    } finally {
      setActionLoading('');
    }
  };

  const handleSendInvoice = async () => {
    try {
      setActionLoading('send');
      await invoicesApi.send(invoice!.id);
      setInvoice({ ...invoice!, status: 'SENT' });
      alert('Invoice sent successfully!');
    } catch (error) {
      alert('Failed to send invoice');
    } finally {
      setActionLoading('');
    }
  };

  const handleSendReminder = async () => {
    try {
      setActionLoading('remind');
      await invoicesApi.sendReminder(invoice!.id);
      alert('Reminder sent successfully!');
    } catch (error) {
      alert('Failed to send reminder');
    } finally {
      setActionLoading('');
    }
  };

  const handleMarkPaid = async () => {
    try {
      setActionLoading('paid');
      const updated = await invoicesApi.updateStatus(invoice!.id, 'PAID');
      setInvoice(updated);
    } catch (error) {
      alert('Failed to update status');
    } finally {
      setActionLoading('');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    try {
      setActionLoading('delete');
      await invoicesApi.delete(invoice!.id);
      router.push('/invoices');
    } catch (error) {
      alert('Failed to delete invoice');
      setActionLoading('');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!invoice) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Invoice not found</p>
          <Link href="/invoices" className="btn-primary mt-4 inline-flex">
            Back to invoices
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/invoices"
            className="inline-flex items-center text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to invoices
          </Link>
          <div className="flex gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={!!actionLoading}
              className="btn-secondary"
            >
              <Download className="w-4 h-4 mr-2" />
              {actionLoading === 'pdf' ? 'Downloading...' : 'Download PDF'}
            </button>
            {invoice.status === 'DRAFT' && (
              <button
                onClick={handleSendInvoice}
                disabled={!!actionLoading}
                className="btn-primary"
              >
                <Send className="w-4 h-4 mr-2" />
                {actionLoading === 'send' ? 'Sending...' : 'Send Invoice'}
              </button>
            )}
            {(invoice.status === 'SENT' || invoice.status === 'OVERDUE') && (
              <>
                <button
                  onClick={handleSendReminder}
                  disabled={!!actionLoading}
                  className="btn-secondary"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  {actionLoading === 'remind' ? 'Sending...' : 'Send Reminder'}
                </button>
                <button
                  onClick={handleMarkPaid}
                  disabled={!!actionLoading}
                  className="btn-primary"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {actionLoading === 'paid' ? 'Updating...' : 'Mark as Paid'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Invoice Card */}
        <div className="card">
          {/* Invoice Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {invoice.invoiceNumber}
                </h1>
                <p className="text-gray-500 mt-1">
                  Issued on {formatDate(invoice.issueDate)}
                </p>
              </div>
              <StatusBadge status={invoice.status} />
            </div>
          </div>

          {/* Client & Dates */}
          <div className="p-6 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Bill To</h3>
                <p className="font-medium text-gray-900">{invoice.client?.name}</p>
                <p className="text-gray-500">{invoice.client?.email}</p>
                {invoice.client?.address && (
                  <p className="text-gray-500">{invoice.client.address}</p>
                )}
              </div>
              <div className="text-right">
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500">Issue Date</h3>
                  <p className="text-gray-900">{formatDate(invoice.issueDate)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Due Date</h3>
                  <p className="text-gray-900">{formatDate(invoice.dueDate)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="p-6 border-b border-gray-200">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500">
                  <th className="pb-3">Description</th>
                  <th className="pb-3 text-right">Qty</th>
                  <th className="pb-3 text-right">Unit Price</th>
                  <th className="pb-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoice.items?.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3 text-gray-900">{item.description}</td>
                    <td className="py-3 text-right text-gray-500">
                      {Number(item.quantity)}
                    </td>
                    <td className="py-3 text-right text-gray-500">
                      {formatCurrency(Number(item.unitPrice))}
                    </td>
                    <td className="py-3 text-right font-medium text-gray-900">
                      {formatCurrency(Number(item.total))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="p-6">
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(Number(invoice.subtotal))}</span>
                </div>
                {Number(invoice.taxRate) > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Tax ({Number(invoice.taxRate)}%)</span>
                    <span>{formatCurrency(Number(invoice.taxAmount))}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-200">
                  <span>Total</span>
                  <span>{formatCurrency(Number(invoice.total))}</span>
                </div>
              </div>
            </div>

            {invoice.notes && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
                <p className="text-gray-700">{invoice.notes}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-between">
            {invoice.status === 'DRAFT' && (
              <Link href={`/invoices/${invoice.id}/edit`} className="btn-secondary">
                <Edit className="w-4 h-4 mr-2" />
                Edit Invoice
              </Link>
            )}
            <button
              onClick={handleDelete}
              disabled={!!actionLoading}
              className="btn-danger ml-auto"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {actionLoading === 'delete' ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
