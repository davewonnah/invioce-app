'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { clientsApi, Client, Invoice } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

const clientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type ClientForm = z.infer<typeof clientSchema>;

interface ClientWithInvoices extends Client {
  invoices?: Invoice[];
}

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [client, setClient] = useState<ClientWithInvoices | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ClientForm>({
    resolver: zodResolver(clientSchema),
  });

  useEffect(() => {
    async function fetchClient() {
      try {
        const data = await clientsApi.getOne(params.id as string);
        setClient(data);
        reset({
          name: data.name,
          email: data.email,
          phone: data.phone || '',
          address: data.address || '',
        });
      } catch (error) {
        console.error('Failed to fetch client:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchClient();
  }, [params.id, reset]);

  const onSubmit = async (data: ClientForm) => {
    try {
      setError('');
      setSaving(true);
      const updated = await clientsApi.update(params.id as string, data);
      setClient({ ...client, ...updated });
      reset(data);
    } catch (err: any) {
      setError(err.message || 'Failed to update client');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this client?')) return;
    try {
      await clientsApi.delete(params.id as string);
      router.push('/clients');
    } catch (error) {
      alert('Failed to delete client');
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

  if (!client) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Client not found</p>
          <Link href="/clients" className="btn-primary mt-4 inline-flex">
            Back to clients
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            href="/clients"
            className="inline-flex items-center text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to clients
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Client Form */}
          <div className="lg:col-span-2 card">
            <div className="p-6 border-b border-gray-200">
              <h1 className="text-xl font-bold text-gray-900">Client Details</h1>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="label">Name</label>
                <input {...register('name')} type="text" className="input" />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="label">Email</label>
                <input {...register('email')} type="email" className="input" />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="label">Phone</label>
                <input {...register('phone')} type="tel" className="input" />
              </div>

              <div>
                <label className="label">Address</label>
                <textarea {...register('address')} rows={3} className="input" />
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="btn-danger"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </button>
                <button
                  type="submit"
                  disabled={saving || !isDirty}
                  className="btn-primary"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Recent Invoices */}
          <div className="card">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Invoices</h2>
            </div>
            <div className="p-4">
              {!client.invoices || client.invoices.length === 0 ? (
                <p className="text-gray-500 text-sm">No invoices yet</p>
              ) : (
                <div className="space-y-3">
                  {client.invoices.map((invoice) => (
                    <Link
                      key={invoice.id}
                      href={`/invoices/${invoice.id}`}
                      className="block p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900">
                          {invoice.invoiceNumber}
                        </span>
                        <StatusBadge status={invoice.status} />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                          {formatDate(invoice.createdAt)}
                        </span>
                        <span className="font-medium text-gray-900">
                          {formatCurrency(Number(invoice.total))}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              <Link
                href={`/invoices/new?clientId=${client.id}`}
                className="btn-primary w-full mt-4"
              >
                Create Invoice
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
