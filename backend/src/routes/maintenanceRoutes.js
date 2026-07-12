import { Router } from 'express';
import { body, param } from 'express-validator';
import { MaintenanceController } from '../controllers/maintenanceController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authenticate);

router.get('/', MaintenanceController.getAll);

router.get('/:id',
  param('id').isUUID(),
  validate,
  MaintenanceController.getById
);

/* Any authenticated user can raise a maintenance request */
router.post('/',
  body('asset_id').isUUID().withMessage('asset_id is required'),
  body('issue_description').trim().notEmpty().withMessage('issue_description is required'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  body('photo_url').optional().isURL(),
  validate,
  MaintenanceController.create
);

router.patch('/:id/approve',
  authorize('admin', 'asset_manager'),
  param('id').isUUID(),
  body('estimated_cost').optional().isFloat({ min: 0 }),
  validate,
  MaintenanceController.approve
);

router.patch('/:id/reject',
  authorize('admin', 'asset_manager'),
  param('id').isUUID(),
  body('rejection_reason').optional().trim(),
  validate,
  MaintenanceController.reject
);

router.patch('/:id/assign-technician',
  authorize('admin', 'asset_manager'),
  param('id').isUUID(),
  body('technician_id').isUUID().withMessage('technician_id is required'),
  validate,
  MaintenanceController.assignTechnician
);

router.patch('/:id/start',
  authorize('admin', 'asset_manager'),
  param('id').isUUID(),
  validate,
  MaintenanceController.startWork
);

router.patch('/:id/resolve',
  authorize('admin', 'asset_manager'),
  param('id').isUUID(),
  body('resolution_notes').trim().notEmpty().withMessage('resolution_notes is required'),
  body('actual_cost').optional().isFloat({ min: 0 }),
  validate,
  MaintenanceController.resolve
);

export default router;
