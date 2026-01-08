import { Response } from 'express';
import { z } from 'zod';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const clientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export const getClients = async (req: AuthRequest, res: Response) => {
  const clients = await prisma.client.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' },
  });

  res.json(clients);
};

export const getClient = async (req: AuthRequest, res: Response) => {
  const client = await prisma.client.findFirst({
    where: {
      id: req.params.id,
      userId: req.user!.id,
    },
    include: {
      invoices: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!client) {
    throw new AppError('Client not found', 404);
  }

  res.json(client);
};

export const createClient = async (req: AuthRequest, res: Response) => {
  const data = clientSchema.parse(req.body);

  const client = await prisma.client.create({
    data: {
      ...data,
      userId: req.user!.id,
    },
  });

  res.status(201).json(client);
};

export const updateClient = async (req: AuthRequest, res: Response) => {
  const data = clientSchema.partial().parse(req.body);

  const existing = await prisma.client.findFirst({
    where: {
      id: req.params.id,
      userId: req.user!.id,
    },
  });

  if (!existing) {
    throw new AppError('Client not found', 404);
  }

  const client = await prisma.client.update({
    where: { id: req.params.id },
    data,
  });

  res.json(client);
};

export const deleteClient = async (req: AuthRequest, res: Response) => {
  const existing = await prisma.client.findFirst({
    where: {
      id: req.params.id,
      userId: req.user!.id,
    },
  });

  if (!existing) {
    throw new AppError('Client not found', 404);
  }

  await prisma.client.delete({
    where: { id: req.params.id },
  });

  res.status(204).send();
};
