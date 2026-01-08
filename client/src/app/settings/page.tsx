'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, User, Building } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/lib/auth-context';

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  companyName: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      companyName: user?.companyName || '',
      address: user?.address || '',
      phone: user?.phone || '',
    },
  });

  const onSubmit = async (data: ProfileForm) => {
    try {
      setError('');
      setSuccess(false);
      setSaving(true);
      await updateUser(data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500">Manage your account settings</p>
        </div>

        <div className="card">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-primary-700">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{user?.name}</h2>
                <p className="text-gray-500">{user?.email}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                Profile updated successfully!
              </div>
            )}

            {/* Personal Info */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-gray-400" />
                <h3 className="font-medium text-gray-900">Personal Information</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="label">Full Name</label>
                  <input {...register('name')} type="text" className="input" />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>
                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    value={user?.email}
                    disabled
                    className="input bg-gray-50 cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Email cannot be changed
                  </p>
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input
                    {...register('phone')}
                    type="tel"
                    className="input"
                    placeholder="+1 234 567 8900"
                  />
                </div>
              </div>
            </div>

            {/* Company Info */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <Building className="w-5 h-5 text-gray-400" />
                <h3 className="font-medium text-gray-900">Company Information</h3>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                This information will appear on your invoices
              </p>
              <div className="space-y-4">
                <div>
                  <label className="label">Company Name</label>
                  <input
                    {...register('companyName')}
                    type="text"
                    className="input"
                    placeholder="Your company name"
                  />
                </div>
                <div>
                  <label className="label">Address</label>
                  <textarea
                    {...register('address')}
                    rows={3}
                    className="input"
                    placeholder="Your business address"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200 flex justify-end">
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
      </div>
    </DashboardLayout>
  );
}
