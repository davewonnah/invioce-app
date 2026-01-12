import { Response } from 'express';
import { z } from 'zod';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

// Get all users
export const getUsers = async (req: AuthRequest, res: Response) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      companyName: true,
      createdAt: true,
      _count: {
        select: {
          invoices: true,
          clients: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(users);
};

// Get single user
export const getUser = async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      companyName: true,
      address: true,
      phone: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          invoices: true,
          clients: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json(user);
};

// Update user (including role)
const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.enum(['USER', 'ADMIN']).optional(),
  companyName: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
});

export const updateUser = async (req: AuthRequest, res: Response) => {
  const data = updateUserSchema.parse(req.body);

  // Prevent admin from changing their own role
  if (req.params.id === req.user!.id && data.role) {
    throw new AppError('Cannot change your own role', 400);
  }

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      companyName: true,
      address: true,
      phone: true,
    },
  });

  res.json(user);
};

// Delete user
export const deleteUser = async (req: AuthRequest, res: Response) => {
  // Prevent admin from deleting themselves
  if (req.params.id === req.user!.id) {
    throw new AppError('Cannot delete your own account', 400);
  }

  await prisma.user.delete({
    where: { id: req.params.id },
  });

  res.status(204).send();
};

// Get all invoices (from all users)
export const getAllInvoices = async (req: AuthRequest, res: Response) => {
  const { status, userId, clientId, dateFrom, dateTo } = req.query;

  const where: any = {};
  if (status) where.status = status;
  if (userId) where.userId = userId;
  if (clientId) where.clientId = clientId;

  // Date range filter
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) {
      where.createdAt.gte = new Date(dateFrom as string);
    }
    if (dateTo) {
      const toDate = new Date(dateTo as string);
      toDate.setHours(23, 59, 59, 999);
      where.createdAt.lte = toDate;
    }
  }

  const invoices = await prisma.invoice.findMany({
    where,
    include: {
      client: {
        select: { id: true, name: true, email: true },
      },
      user: {
        select: { id: true, name: true, email: true, companyName: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(invoices);
};

// Get all clients (for filter dropdown)
export const getAllClients = async (req: AuthRequest, res: Response) => {
  const clients = await prisma.client.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      user: {
        select: { id: true, name: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  res.json(clients);
};

// Get admin dashboard stats
export const getAdminStats = async (req: AuthRequest, res: Response) => {
  const [
    totalUsers,
    totalInvoices,
    totalClients,
    invoiceStats,
    recentUsers,
    monthlyRevenue,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.invoice.count(),
    prisma.client.count(),
    prisma.invoice.groupBy({
      by: ['status'],
      _count: true,
      _sum: { total: true },
    }),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        role: true,
      },
    }),
    prisma.invoice.aggregate({
      where: {
        status: 'PAID',
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
      _sum: { total: true },
    }),
  ]);

  const statusCounts: Record<string, number> = {};
  const statusTotals: Record<string, number> = {};
  let totalRevenue = 0;

  invoiceStats.forEach((stat) => {
    statusCounts[stat.status] = stat._count;
    statusTotals[stat.status] = Number(stat._sum.total) || 0;
    if (stat.status === 'PAID') {
      totalRevenue = Number(stat._sum.total) || 0;
    }
  });

  res.json({
    totalUsers,
    totalInvoices,
    totalClients,
    totalRevenue,
    monthlyRevenue: Number(monthlyRevenue._sum.total) || 0,
    invoicesByStatus: statusCounts,
    revenuByStatus: statusTotals,
    recentUsers,
  });
};
