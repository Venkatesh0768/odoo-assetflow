import { Router } from 'express';
import { DashboardController } from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();
router.use(authenticate);

/**
 * GET /api/dashboard
 * Full dashboard payload (KPIs + top categories + recent allocations + activity).
 * Accessible to admin, asset_manager, department_head, and employee.
 */
router.get('/', DashboardController.getFullDashboard);

/**
 * GET /api/dashboard/kpis
 * Lightweight KPI-only endpoint — useful for polling/refresh.
 */
router.get('/kpis', DashboardController.getKPIs);

/**
 * GET /api/dashboard/activity?limit=20
 * Recent activity log — admin and asset_manager only.
 */
router.get(
  '/activity',
  authorize('admin', 'asset_manager'),
  DashboardController.getRecentActivity
);

export default router;
