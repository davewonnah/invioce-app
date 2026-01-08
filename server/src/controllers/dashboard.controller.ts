import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getStats = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  // Get counts and totals
  const [
    totalInvoices,
    paidInvoices,
    overdueInvoices,
    pendingInvoices,
    totalClients,
    revenueData,
    overdueAmount,
  ] = await Promise.all([
    prisma.invoice.count({ where: { userId } }),
    prisma.invoice.count({ where: { userId, status: 'PAID' } }),
    prisma.invoice.count({
      where: {
        userId,
        status: { in: ['SENT', 'OVERDUE'] },
        dueDate: { lt: new Date() },
      },
    }),
    prisma.invoice.count({
      where: { userId, status: { in: ['DRAFT', 'SENT'] } },
    }),
    prisma.client.count({ where: { userId } }),
    prisma.invoice.aggregate({
      where: { userId, status: 'PAID' },
      _sum: { total: true },
    }),
    prisma.invoice.aggregate({
      where: {
        userId,
        status: { in: ['SENT', 'OVERDUE'] },
        dueDate: { lt: new Date() },
      },
      _sum: { total: true },
    }),
  ]);

  res.json({
    totalInvoices,
    paidInvoices,
    overdueInvoices,
    pendingInvoices,
    totalClients,
    totalRevenue: revenueData._sum.total || 0,
    overdueAmount: overdueAmount._sum.total || 0,
  });
};

export const getChartData = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const months = parseInt(req.query.months as string) || 12;

  // Get monthly revenue for the past X months
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const invoices = await prisma.invoice.findMany({
    where: {
      userId,
      status: 'PAID',
      createdAt: { gte: startDate },
    },
    select: {
      total: true,
      createdAt: true,
    },
  });

  // Group by month
  const monthlyData: { [key: string]: number } = {};

  for (let i = 0; i < months; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyData[key] = 0;
  }

  invoices.forEach((invoice) => {
    const date = new Date(invoice.createdAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (monthlyData[key] !== undefined) {
      monthlyData[key] += Number(invoice.total);
    }
  });

  const chartData = Object.entries(monthlyData)
    .map(([month, revenue]) => ({ month, revenue }))
    .reverse();

  res.json(chartData);
};

export const getRecentInvoices = async (req: AuthRequest, res: Response) => {
  const invoices = await prisma.invoice.findMany({
    where: { userId: req.user!.id },
    include: {
      client: {
        select: { name: true, email: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  res.json(invoices);
};

export const getOverdueInvoices = async (req: AuthRequest, res: Response) => {
  const invoices = await prisma.invoice.findMany({
    where: {
      userId: req.user!.id,
      status: { in: ['SENT', 'OVERDUE'] },
      dueDate: { lt: new Date() },
    },
    include: {
      client: {
        select: { name: true, email: true },
      },
    },
    orderBy: { dueDate: 'asc' },
  });

  // Update status to OVERDUE if not already
  const overdueIds = invoices
    .filter((inv) => inv.status !== 'OVERDUE')
    .map((inv) => inv.id);

  if (overdueIds.length > 0) {
    await prisma.invoice.updateMany({
      where: { id: { in: overdueIds } },
      data: { status: 'OVERDUE' },
    });
  }

  res.json(invoices);
};
