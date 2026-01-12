const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

interface FetchOptions extends RequestInit {
  token?: string;
}

class ApiClient {
  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }

  private async request<T>(
    endpoint: string,
    options: FetchOptions = {}
  ): Promise<T> {
    const token = options.token || this.getToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  async get<T>(endpoint: string, options?: FetchOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown, options?: FetchOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown, options?: FetchOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: unknown, options?: FetchOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, options?: FetchOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const api = new ApiClient();

// Auth API
export const authApi = {
  register: (data: { email: string; password: string; name: string; companyName?: string }) =>
    api.post<{ user: User; token: string }>('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post<{ user: User; token: string }>('/auth/login', data),
  getMe: () => api.get<User>('/auth/me'),
  updateProfile: (data: Partial<User>) => api.put<User>('/auth/profile', data),
};

// Clients API
export const clientsApi = {
  getAll: () => api.get<Client[]>('/clients'),
  getOne: (id: string) => api.get<Client>(`/clients/${id}`),
  create: (data: Omit<Client, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) =>
    api.post<Client>('/clients', data),
  update: (id: string, data: Partial<Client>) => api.put<Client>(`/clients/${id}`, data),
  delete: (id: string) => api.delete(`/clients/${id}`),
};

// Invoices API
export const invoicesApi = {
  getAll: (params?: { status?: string; clientId?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return api.get<Invoice[]>(`/invoices${query ? `?${query}` : ''}`);
  },
  getOne: (id: string) => api.get<Invoice>(`/invoices/${id}`),
  create: (data: CreateInvoiceData) => api.post<Invoice>('/invoices', data),
  update: (id: string, data: Partial<CreateInvoiceData>) =>
    api.put<Invoice>(`/invoices/${id}`, data),
  delete: (id: string) => api.delete(`/invoices/${id}`),
  updateStatus: (id: string, status: InvoiceStatus) =>
    api.patch<Invoice>(`/invoices/${id}/status`, { status }),
  downloadPdf: async (id: string) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/invoices/${id}/pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.blob();
  },
  send: (id: string) => api.post<{ message: string }>(`/invoices/${id}/send`),
  sendReminder: (id: string) => api.post<{ message: string }>(`/invoices/${id}/remind`),
};

// Dashboard API
export const dashboardApi = {
  getStats: () => api.get<DashboardStats>('/dashboard/stats'),
  getChartData: (months?: number) =>
    api.get<ChartData[]>(`/dashboard/chart${months ? `?months=${months}` : ''}`),
  getRecentInvoices: () => api.get<Invoice[]>('/dashboard/recent'),
  getOverdueInvoices: () => api.get<Invoice[]>('/dashboard/overdue'),
};

// Types
export type Role = 'USER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  role?: Role;
  companyName?: string;
  address?: string;
  phone?: string;
  logoUrl?: string;
}

export interface Client {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  userId: string;
  clientId: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes?: string;
  isRecurring: boolean;
  recurringInterval?: string;
  createdAt: string;
  updatedAt: string;
  client?: Client;
  items?: InvoiceItem[];
}

export interface CreateInvoiceData {
  clientId: string;
  dueDate: string;
  items: { description: string; quantity: number; unitPrice: number }[];
  taxRate?: number;
  notes?: string;
  isRecurring?: boolean;
  recurringInterval?: string;
}

export interface DashboardStats {
  totalInvoices: number;
  paidInvoices: number;
  overdueInvoices: number;
  pendingInvoices: number;
  totalClients: number;
  totalRevenue: number;
  overdueAmount: number;
}

export interface ChartData {
  month: string;
  revenue: number;
}

// Admin Types
export interface AdminUser extends User {
  createdAt: string;
  _count?: {
    invoices: number;
    clients: number;
  };
}

export interface AdminStats {
  totalUsers: number;
  totalInvoices: number;
  totalClients: number;
  totalRevenue: number;
  monthlyRevenue: number;
  invoicesByStatus: Record<string, number>;
  revenuByStatus: Record<string, number>;
  recentUsers: AdminUser[];
}

export interface AdminInvoice extends Invoice {
  user?: {
    id: string;
    name: string;
    email: string;
    companyName?: string;
  };
}

// Admin API
export interface AdminClient {
  id: string;
  name: string;
  email: string;
  user?: { id: string; name: string };
}

export interface InvoiceFilters {
  status?: string;
  userId?: string;
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const adminApi = {
  getStats: () => api.get<AdminStats>('/admin/stats'),
  getUsers: () => api.get<AdminUser[]>('/admin/users'),
  getUser: (id: string) => api.get<AdminUser>(`/admin/users/${id}`),
  updateUser: (id: string, data: Partial<User & { role: Role }>) =>
    api.put<AdminUser>(`/admin/users/${id}`, data),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  getInvoices: (params?: InvoiceFilters) => {
    const filteredParams = Object.fromEntries(
      Object.entries(params || {}).filter(([_, v]) => v !== '' && v !== undefined)
    );
    const query = new URLSearchParams(filteredParams as Record<string, string>).toString();
    return api.get<AdminInvoice[]>(`/admin/invoices${query ? `?${query}` : ''}`);
  },
  getClients: () => api.get<AdminClient[]>('/admin/clients'),
};
