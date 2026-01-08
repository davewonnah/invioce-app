import { Response } from 'express';
import { z } from 'zod';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { generateInvoicePdf } from '../services/pdf.service';
import { sendInvoiceEmail, sendReminderEmail } from '../services/email.service';
import { InvoiceStatus } from '@prisma/client';

const invoiceItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().positive(),
});

const createInvoiceSchema = z.object({
  clientId: z.string().min(1),
  dueDate: z.string().transform((str) => new Date(str)),
  items: z.array(invoiceItemSchema).min(1),
  taxRate: z.number().min(0).max(100).default(0),
  notes: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurringInterval: z.string().optional(),
});

const updateInvoiceSchema = createInvoiceSchema.partial();

async function generateInvoiceNumber(userId: string): Promise<string> {
  const count = await prisma.invoice.count({
    where: { userId },
  });
  const year = new Date().getFullYear();
  return `INV-${year}-${String(count + 1).padStart(4, '0')}`;
}

export const getInvoices = async (req: AuthRequest, res: Response) => {
  const { status, clientId } = req.query;

  const where: any = { userId: req.user!.id };
  if (status) where.status = status;
  if (clientId) where.clientId = clientId;

  const invoices = await prisma.invoice.findMany({
    where,
    include: {
      client: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(invoices);
};

export const getInvoice = async (req: AuthRequest, res: Response) => {
  const invoice = await prisma.invoice.findFirst({
    where: {
      id: req.params.id,
      userId: req.user!.id,
    },
    include: {
      client: true,
      items: true,
      reminders: true,
    },
  });

  if (!invoice) {
    throw new AppError('Invoice not found', 404);
  }

  res.json(invoice);
};

export const createInvoice = async (req: AuthRequest, res: Response) => {
  const data = createInvoiceSchema.parse(req.body);

  // Verify client belongs to user
  const client = await prisma.client.findFirst({
    where: {
      id: data.clientId,
      userId: req.user!.id,
    },
  });

  if (!client) {
    throw new AppError('Client not found', 404);
  }

  // Calculate totals
  const subtotal = data.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );
  const taxAmount = subtotal * (data.taxRate / 100);
  const total = subtotal + taxAmount;

  const invoiceNumber = await generateInvoiceNumber(req.user!.id);

  const invoice = await prisma.invoice.create({
    data: {
      userId: req.user!.id,
      clientId: data.clientId,
      invoiceNumber,
      dueDate: data.dueDate,
      subtotal,
      taxRate: data.taxRate,
      taxAmount,
      total,
      notes: data.notes,
      isRecurring: data.isRecurring,
      recurringInterval: data.recurringInterval,
      items: {
        create: data.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
        })),
      },
    },
    include: {
      client: true,
      items: true,
    },
  });

  res.status(201).json(invoice);
};

export const updateInvoice = async (req: AuthRequest, res: Response) => {
  const data = updateInvoiceSchema.parse(req.body);

  const existing = await prisma.invoice.findFirst({
    where: {
      id: req.params.id,
      userId: req.user!.id,
    },
  });

  if (!existing) {
    throw new AppError('Invoice not found', 404);
  }

  if (existing.status !== 'DRAFT') {
    throw new AppError('Can only edit draft invoices', 400);
  }

  let updateData: any = { ...data };

  // If items are provided, recalculate totals
  if (data.items) {
    const subtotal = data.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    const taxRate = data.taxRate ?? Number(existing.taxRate);
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;

    updateData = {
      ...updateData,
      subtotal,
      taxAmount,
      total,
    };

    // Delete existing items and create new ones
    await prisma.invoiceItem.deleteMany({
      where: { invoiceId: req.params.id },
    });
  }

  delete updateData.items;

  const invoice = await prisma.invoice.update({
    where: { id: req.params.id },
    data: {
      ...updateData,
      ...(data.items && {
        items: {
          create: data.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
          })),
        },
      }),
    },
    include: {
      client: true,
      items: true,
    },
  });

  res.json(invoice);
};

export const deleteInvoice = async (req: AuthRequest, res: Response) => {
  const existing = await prisma.invoice.findFirst({
    where: {
      id: req.params.id,
      userId: req.user!.id,
    },
  });

  if (!existing) {
    throw new AppError('Invoice not found', 404);
  }

  await prisma.invoice.delete({
    where: { id: req.params.id },
  });

  res.status(204).send();
};

export const updateInvoiceStatus = async (req: AuthRequest, res: Response) => {
  const { status } = z.object({ status: z.nativeEnum(InvoiceStatus) }).parse(req.body);

  const existing = await prisma.invoice.findFirst({
    where: {
      id: req.params.id,
      userId: req.user!.id,
    },
  });

  if (!existing) {
    throw new AppError('Invoice not found', 404);
  }

  const invoice = await prisma.invoice.update({
    where: { id: req.params.id },
    data: { status },
    include: {
      client: true,
      items: true,
    },
  });

  res.json(invoice);
};

export const downloadInvoicePdf = async (req: AuthRequest, res: Response) => {
  const invoice = await prisma.invoice.findFirst({
    where: {
      id: req.params.id,
      userId: req.user!.id,
    },
    include: {
      client: true,
      items: true,
      user: {
        select: {
          name: true,
          companyName: true,
          address: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  if (!invoice) {
    throw new AppError('Invoice not found', 404);
  }

  const pdfBuffer = await generateInvoicePdf(invoice);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${invoice.invoiceNumber}.pdf"`
  );
  res.send(pdfBuffer);
};

export const sendInvoice = async (req: AuthRequest, res: Response) => {
  const invoice = await prisma.invoice.findFirst({
    where: {
      id: req.params.id,
      userId: req.user!.id,
    },
    include: {
      client: true,
      items: true,
      user: {
        select: {
          name: true,
          companyName: true,
          address: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  if (!invoice) {
    throw new AppError('Invoice not found', 404);
  }

  await sendInvoiceEmail(invoice);

  // Update status to SENT if it was DRAFT
  if (invoice.status === 'DRAFT') {
    await prisma.invoice.update({
      where: { id: req.params.id },
      data: { status: 'SENT' },
    });
  }

  res.json({ message: 'Invoice sent successfully' });
};

export const sendReminder = async (req: AuthRequest, res: Response) => {
  const invoice = await prisma.invoice.findFirst({
    where: {
      id: req.params.id,
      userId: req.user!.id,
    },
    include: {
      client: true,
      user: {
        select: {
          name: true,
          companyName: true,
          email: true,
        },
      },
    },
  });

  if (!invoice) {
    throw new AppError('Invoice not found', 404);
  }

  if (invoice.status === 'PAID') {
    throw new AppError('Cannot send reminder for paid invoice', 400);
  }

  await sendReminderEmail(invoice);

  // Log the reminder
  await prisma.paymentReminder.create({
    data: {
      invoiceId: invoice.id,
      scheduledDate: new Date(),
      sentAt: new Date(),
      status: 'SENT',
    },
  });

  res.json({ message: 'Reminder sent successfully' });
};
