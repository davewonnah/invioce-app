'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import { clientsApi, invoicesApi, Client, Invoice } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

const invoiceSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  taxRate: z.number().min(0).max(100),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      description: z.string().min(1, 'Description is required'),
      quantity: z.number().min(1, 'Quantity must be at least 1'),
      unitPrice: z.number().min(0, 'Price must be positive'),
    })
  ).min(1, 'At least one item is required'),
});

type InvoiceForm = z.infer<typeof invoiceSchema>;

export default function EditInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<InvoiceForm>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      taxRate: 0,
      items: [{ description: '', quantity: 1, unitPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const items = watch('items');
  const taxRate = watch('taxRate');

  const subtotal = items.reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0),
    0
  );
  const taxAmount = subtotal * ((taxRate || 0) / 100);
  const total = subtotal + taxAmount;

  useEffect(() => {
    async function fetchData() {
      try {
        const [invoiceData, clientsData] = await Promise.all([
          invoicesApi.getOne(params.id as string),
          clientsApi.getAll(),
        ]);

        setInvoice(invoiceData);
        setClients(clientsData);

        // Check if invoice can be edited
        if (invoiceData.status !== 'DRAFT') {
          setError('Only draft invoices can be edited');
          return;
        }

        // Pre-fill form with invoice data
        reset({
          clientId: invoiceData.clientId,
          dueDate: new Date(invoiceData.dueDate).toISOString().split('T')[0],
          taxRate: Number(invoiceData.taxRate),
          notes: invoiceData.notes || '',
          items: invoiceData.items?.map((item) => ({
            description: item.description,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
          })) || [{ description: '', quantity: 1, unitPrice: 0 }],
        });
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setError('Failed to load invoice');
      } finally {
        setPageLoading(false);
      }
    }
    fetchData();
  }, [params.id, reset]);

  const onSubmit = async (data: InvoiceForm) => {
    try {
      setError('');
      setLoading(true);
      await invoicesApi.update(params.id as string, data);
      router.push(`/invoices/${params.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to update invoice');
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!invoice || invoice.status !== 'DRAFT') {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto text-center py-12">
          <p className="text-gray-500 mb-4">
            {error || 'Only draft invoices can be edited'}
          </p>
          <Link href={`/invoices/${params.id}`} className="btn-primary">
            Back to Invoice
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
            href={`/invoices/${params.id}`}
            className="inline-flex items-center text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to invoice
          </Link>
        </div>

        <div className="card">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">
              Edit Invoice {invoice.invoiceNumber}
            </h1>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">Client</label>
                <select {...register('clientId')} className="input">
                  <option value="">Select a client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
                {errors.clientId && (
                  <p className="mt-1 text-sm text-red-600">{errors.clientId.message}</p>
                )}
              </div>

              <div>
                <label className="label">Due Date</label>
                <input
                  {...register('dueDate')}
                  type="date"
                  className="input"
                />
                {errors.dueDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.dueDate.message}</p>
                )}
              </div>
            </div>

            {/* Line Items */}
            <div>
              <label className="label">Line Items</label>
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-3 items-start">
                    <div className="flex-1">
                      <input
                        {...register(`items.${index}.description`)}
                        placeholder="Description"
                        className="input"
                      />
                      {errors.items?.[index]?.description && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.items[index]?.description?.message}
                        </p>
                      )}
                    </div>
                    <div className="w-24">
                      <input
                        {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                        type="number"
                        min="1"
                        placeholder="Qty"
                        className="input"
                      />
                    </div>
                    <div className="w-32">
                      <input
                        {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Price"
                        className="input"
                      />
                    </div>
                    <div className="w-32 py-2 text-right font-medium text-gray-900">
                      {formatCurrency((items[index]?.quantity || 0) * (items[index]?.unitPrice || 0))}
                    </div>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="p-2 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => append({ description: '', quantity: 1, unitPrice: 0 })}
                className="mt-3 btn-secondary text-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </button>
            </div>

            {/* Tax and Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">Tax Rate (%)</label>
                <input
                  {...register('taxRate', { valueAsNumber: true })}
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  className="input"
                />
              </div>
              <div>
                <label className="label">Notes (optional)</label>
                <textarea
                  {...register('notes')}
                  rows={3}
                  className="input"
                  placeholder="Payment terms, thank you message, etc."
                />
              </div>
            </div>

            {/* Totals */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {taxRate > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Tax ({taxRate}%)</span>
                    <span>{formatCurrency(taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4">
              <Link href={`/invoices/${params.id}`} className="btn-secondary">
                Cancel
              </Link>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
