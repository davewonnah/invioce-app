import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getAllInvoices,
  getAdminStats,
} from '../controllers/admin.controller';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// Admin stats
router.get('/stats', getAdminStats);

// User management
router.get('/users', getUsers);
router.get('/users/:id', getUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Invoice management
router.get('/invoices', getAllInvoices);

export default router;
