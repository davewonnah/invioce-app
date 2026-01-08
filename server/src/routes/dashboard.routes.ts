import { Router } from 'express';
import {
  getStats,
  getChartData,
  getRecentInvoices,
  getOverdueInvoices,
} from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/stats', getStats);
router.get('/chart', getChartData);
router.get('/recent', getRecentInvoices);
router.get('/overdue', getOverdueInvoices);

export default router;
