import { Router } from 'express';
import { body, param } from 'express-validator';
import { AssetController } from '../controllers/assetController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authenticate);

router.get('/', AssetController.getAll);

router.get('/:id',
  param('id').isUUID(),
  validate,
  AssetController.getById
);

router.get('/:id/history',
  param('id').isUUID(),
  validate,
  AssetController.getHistory
);

router.post('/',
  authorize('admin', 'asset_manager'),
  body('name').trim().notEmpty().withMessage('Asset name is required'),
  body('category_id').optional().isUUID(),
  body('serial_number').optional().trim(),
  body('acquisition_date').optional().isDate(),
  body('acquisition_cost').optional().isFloat({ min: 0 }),
  body('condition').optional().isIn(['excellent', 'good', 'fair', 'poor']),
  body('location').optional().trim(),
  body('department_id').optional().isUUID(),
  body('is_bookable').optional().isBoolean(),
  body('photo_url').optional().isURL(),
  body('documents_url').optional().isURL(),
  body('custom_fields').optional().isObject(),
  body('notes').optional().trim(),
  validate,
  AssetController.create
);

router.put('/:id',
  authorize('admin', 'asset_manager'),
  param('id').isUUID(),
  body('name').optional().trim().notEmpty(),
  body('category_id').optional().isUUID(),
  body('serial_number').optional().trim(),
  body('acquisition_date').optional().isDate(),
  body('acquisition_cost').optional().isFloat({ min: 0 }),
  body('condition').optional().isIn(['excellent', 'good', 'fair', 'poor']),
  body('location').optional().trim(),
  body('department_id').optional().isUUID(),
  body('is_bookable').optional().isBoolean(),
  body('photo_url').optional().isURL(),
  body('documents_url').optional().isURL(),
  body('notes').optional().trim(),
  validate,
  AssetController.update
);

router.patch('/:id/status',
  authorize('admin', 'asset_manager'),
  param('id').isUUID(),
  body('status').isIn(['available', 'allocated', 'reserved', 'under_maintenance', 'lost', 'retired', 'disposed'])
    .withMessage('Invalid status value'),
  validate,
  AssetController.updateStatus
);

export default router;
