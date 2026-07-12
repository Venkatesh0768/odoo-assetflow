import { Router } from 'express';
import { body, param } from 'express-validator';
import { CategoryController } from '../controllers/categoryController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authenticate);

router.get('/', CategoryController.getAll);

router.get('/:id',
  param('id').isUUID(),
  validate,
  CategoryController.getById
);

router.post('/',
  authorize('admin', 'asset_manager'),
  body('name').trim().notEmpty().withMessage('Category name is required'),
  body('description').optional().trim(),
  body('custom_fields').optional().isArray().withMessage('custom_fields must be an array'),
  body('status').optional().isIn(['active', 'inactive']),
  validate,
  CategoryController.create
);

router.put('/:id',
  authorize('admin', 'asset_manager'),
  param('id').isUUID(),
  body('name').optional().trim().notEmpty(),
  body('description').optional().trim(),
  body('custom_fields').optional().isArray(),
  body('status').optional().isIn(['active', 'inactive']),
  validate,
  CategoryController.update
);

export default router;
