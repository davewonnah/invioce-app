'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, FileText, DollarSign, TrendingUp } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/lib/auth-context';
import { adminApi, AdminStats } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { isAdmin, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/dashboard');
      return;
    }
    if (isAdmin) {
      adminApi.getStats().then(setStats).catch(console.error).finally(() => setLoading(false));
    }
  }, [isAdmin, authLoading, router]);

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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500">System-wide statistics and management</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard icon={Users} label="Total Users" value={stats?.totalUsers || 0} color="blue" />
          <StatCard icon={FileText} label="Total Invoices" value={stats?.totalInvoices || 0} color="purple" />
          <StatCard icon={DollarSign} label="Total Revenue" value={formatCurrency(stats?.totalRevenue || 0)} color="green" />
          <StatCard icon={TrendingUp} label="Monthly Revenue" value={formatCurrency(stats?.monthlyRevenue || 0)} color="orange" />
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  const bgColors: Record<string, string> = { blue: 'bg-blue-100', purple: 'bg-purple-100', green: 'bg-green-100', orange: 'bg-orange-100' };
  const textColors: Record<string, string> = { blue: 'text-blue-600', purple: 'text-purple-600', green: 'text-green-600', orange: 'text-orange-600' };
  return (
    <div className="card p-6">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${bgColors[color]}`}>
          <Icon className={`w-6 h-6 ${textColors[color]}`} />
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}
