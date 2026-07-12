import { Router } from 'express';
import { ReportController } from '../controllers/reportController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();
router.use(authenticate);
router.use(authorize('admin', 'asset_manager', 'department_head'));

router.get('/summary',                 ReportController.summary);
router.get('/utilization-trends',      ReportController.utilizationTrends);
router.get('/maintenance-frequency',   ReportController.maintenanceFrequency);
router.get('/maintenance-due',         ReportController.maintenanceDue);
router.get('/department-allocation',   ReportController.departmentAllocationSummary);
router.get('/booking-heatmap',         ReportController.bookingHeatmap);
router.get('/asset-usage',             ReportController.assetUsage);

export default router;
