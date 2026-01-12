'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { useAuth } from '@/lib/auth-context';
import { adminApi, AdminInvoice } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function AdminInvoicesPage() {
  const router = useRouter();
  const { isAdmin, loading: authLoading } = useAuth();
  const [invoices, setInvoices] = useState<AdminInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/dashboard');
      return;
    }
    if (isAdmin) {
      fetchInvoices();
    }
  }, [isAdmin, authLoading, router, statusFilter]);

  const fetchInvoices = async () => {
    try {
      const params = statusFilter ? { status: statusFilter } : undefined;
      const data = await adminApi.getInvoices(params);
      setInvoices(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    );
  }
  if (!isAdmin) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">All Invoices</h1>
            <p className="text-gray-500">View all invoices from all users</p>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-40"
          >
            <option value="">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="SENT">Sent</option>
            <option value="PAID">Paid</option>
            <option value="OVERDUE">Overdue</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link href={"/invoices/" + invoice.id} className="font-medium text-primary-600 hover:text-primary-500">
                      {invoice.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-gray-900">{invoice.user?.name}</p>
                    <p className="text-sm text-gray-500">{invoice.user?.email}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-900">{invoice.client?.name}</td>
                  <td className="px-6 py-4 text-gray-500">{formatDate(invoice.createdAt)}</td>
                  <td className="px-6 py-4"><StatusBadge status={invoice.status} /></td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900">{formatCurrency(Number(invoice.total))}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {invoices.length === 0 && (
            <div className="text-center py-12 text-gray-500">No invoices found</div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
