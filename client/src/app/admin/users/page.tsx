'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Shield, User } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/lib/auth-context';
import { adminApi, AdminUser, Role } from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function AdminUsersPage() {
  const router = useRouter();
  const { isAdmin, loading: authLoading, user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/dashboard');
      return;
    }
    if (isAdmin) {
      adminApi.getUsers().then(setUsers).catch(console.error).finally(() => setLoading(false));
    }
  }, [isAdmin, authLoading, router]);

  const handleRoleChange = async (userId: string, newRole: Role) => {
    try {
      await adminApi.updateUser(userId, { role: newRole });
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (error) {
      alert('Failed to update role');
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await adminApi.deleteUser(userId);
      setUsers(users.filter(u => u.id !== userId));
    } catch (error) {
      alert('Failed to delete user');
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
          <p className="text-gray-500">View and manage all users in the system</p>
        </div>

        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoices</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clients</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-700 font-medium">{user.name?.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value as Role)}
                      disabled={user.id === currentUser?.id}
                      className="text-sm border rounded px-2 py-1"
                    >
                      <option value="USER">User</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-gray-900">{user._count?.invoices || 0}</td>
                  <td className="px-6 py-4 text-gray-900">{user._count?.clients || 0}</td>
                  <td className="px-6 py-4 text-gray-500">{formatDate(user.createdAt)}</td>
                  <td className="px-6 py-4 text-right">
                    {user.id !== currentUser?.id && (
                      <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:text-red-800">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
