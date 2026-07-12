import { Router } from 'express';
import { body, param } from 'express-validator';
import { AllocationController } from '../controllers/allocationController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authenticate);

/* ── Transfer Requests — MUST be before /:id ─────────────────────── */
router.get('/transfers/all', AllocationController.getTransfers);

router.get('/transfers/:id',
  param('id').isUUID(),
  validate,
  AllocationController.getTransferById
);

router.post('/transfers',
  body('asset_id').isUUID().withMessage('asset_id is required'),
  body('to_user').optional().isUUID(),
  body('to_dept').optional().isUUID(),
  body('reason').optional().trim(),
  validate,
  AllocationController.requestTransfer
);

router.patch('/transfers/:id/approve',
  authorize('admin', 'asset_manager', 'department_head'),
  param('id').isUUID(),
  validate,
  AllocationController.approveTransfer
);

router.patch('/transfers/:id/reject',
  authorize('admin', 'asset_manager', 'department_head'),
  param('id').isUUID(),
  body('rejection_reason').optional().trim(),
  validate,
  AllocationController.rejectTransfer
);

/* ── Allocations ─────────────────────────────────────────────────── */
router.get('/', AllocationController.getAll);

router.get('/:id',
  param('id').isUUID(),
  validate,
  AllocationController.getById
);

router.post('/',
  authorize('admin', 'asset_manager', 'department_head'),
  body('asset_id').isUUID().withMessage('asset_id must be a valid UUID'),
  body('allocated_to_user').optional().isUUID(),
  body('allocated_to_dept').optional().isUUID(),
  body('expected_return_date').optional().isDate(),
  validate,
  AllocationController.allocate
);

router.patch('/:id/return',
  authorize('admin', 'asset_manager', 'department_head'),
  param('id').isUUID(),
  body('condition_on_return').optional().isIn(['excellent', 'good', 'fair', 'poor']),
  body('return_notes').optional().trim(),
  validate,
  AllocationController.returnAsset
);

export default router;
