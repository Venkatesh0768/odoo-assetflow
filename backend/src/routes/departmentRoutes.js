import { Router } from 'express';
import { body, param } from 'express-validator';
import { DepartmentController } from '../controllers/departmentController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authenticate);

router.get('/', DepartmentController.getAll);

router.get('/:id',
  param('id').isUUID(),
  validate,
  DepartmentController.getById
);

router.post('/',
  authorize('admin'),
  body('name').trim().notEmpty().withMessage('Department name is required'),
  body('head_id').optional().isUUID(),
  body('parent_id').optional().isUUID(),
  body('status').optional().isIn(['active', 'inactive']),
  body('description').optional().trim(),
  validate,
  DepartmentController.create
);

router.put('/:id',
  authorize('admin'),
  param('id').isUUID(),
  body('name').optional().trim().notEmpty(),
  body('head_id').optional().isUUID(),
  body('parent_id').optional().isUUID(),
  body('status').optional().isIn(['active', 'inactive']),
  body('description').optional().trim(),
  validate,
  DepartmentController.update
);

router.patch('/:id/deactivate',
  authorize('admin'),
  param('id').isUUID(),
  validate,
  DepartmentController.deactivate
);

router.patch('/:id/activate',
  authorize('admin'),
  param('id').isUUID(),
  validate,
  DepartmentController.activate
);

export default router;
