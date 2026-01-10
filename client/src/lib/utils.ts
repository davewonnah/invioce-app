import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    DRAFT: 'bg-gray-200 text-gray-700',
    SENT: 'bg-blue-500 text-white',
    PAID: 'bg-green-500 text-white',
    OVERDUE: 'bg-red-500 text-white',
    CANCELLED: 'bg-gray-400 text-white',
  };
  return colors[status] || colors.DRAFT;
}
