import { Router } from 'express';
import authRoutes from './auth.routes';
import clientRoutes from './client.routes';
import invoiceRoutes from './invoice.routes';
import dashboardRoutes from './dashboard.routes';
import adminRoutes from './admin.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/clients', clientRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/admin', adminRoutes);

export default router;
