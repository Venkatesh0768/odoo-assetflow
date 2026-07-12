import { Router } from 'express';
import authRoutes         from './authRoutes.js';
import userRoutes         from './userRoutes.js';
import departmentRoutes   from './departmentRoutes.js';
import categoryRoutes     from './categoryRoutes.js';
import assetRoutes        from './assetRoutes.js';
import allocationRoutes   from './allocationRoutes.js';
import bookingRoutes      from './bookingRoutes.js';
import maintenanceRoutes  from './maintenanceRoutes.js';
import auditRoutes        from './auditRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import reportRoutes       from './reportRoutes.js';
import dashboardRoutes    from './dashboardRoutes.js';

const router = Router();

// ── Health check (no auth required) ─────────────────────────────────────────
router.get('/health', (_req, res) => {
  res.json({ success: true, message: 'API is healthy', timestamp: new Date().toISOString() });
});

// ── Auth ─────────────────────────────────────────────────────────────────────
router.use('/auth',          authRoutes);

// ── Core resources ────────────────────────────────────────────────────────────
router.use('/users',         userRoutes);
router.use('/departments',   departmentRoutes);
router.use('/categories',    categoryRoutes);
router.use('/assets',        assetRoutes);
router.use('/allocations',   allocationRoutes);
router.use('/bookings',      bookingRoutes);
router.use('/maintenance',   maintenanceRoutes);
router.use('/audits',        auditRoutes);
router.use('/notifications', notificationRoutes);
router.use('/reports',       reportRoutes);
router.use('/dashboard',     dashboardRoutes);

export default router;

