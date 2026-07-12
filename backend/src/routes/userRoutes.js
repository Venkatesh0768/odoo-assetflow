import { Router } from 'express';
import { body, param } from 'express-validator';
import { UserController } from '../controllers/userController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';

const router = Router();

/* All user routes require authentication */
router.use(authenticate);

/* GET /api/users – employee directory (all roles) */
router.get('/', UserController.getAll);

/* GET /api/users/me – current user profile */
router.get('/me', UserController.getMe);

/* GET /api/users/:id */
router.get('/:id',
  param('id').isUUID(),
  validate,
  UserController.getOne
);

/* PATCH /api/users/:id – update own profile (admin can update any) */
router.patch('/:id',
  param('id').isUUID(),
  body('name').optional().trim().notEmpty(),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().trim(),
  body('avatar_url').optional().isURL(),
  validate,
  UserController.update
);

/* PATCH /api/users/:id/promote – admin only */
router.patch('/:id/promote',
  authorize('admin'),
  param('id').isUUID(),
  body('role').isIn(['admin', 'asset_manager', 'department_head', 'employee'])
    .withMessage('role must be admin, asset_manager, department_head, or employee'),
  validate,
  UserController.promoteRole
);

/* PATCH /api/users/:id/status – admin only */
router.patch('/:id/status',
  authorize('admin'),
  param('id').isUUID(),
  body('is_active').isBoolean(),
  validate,
  UserController.toggleActive
);

/* DELETE /api/users/:id – admin only */
router.delete('/:id',
  authorize('admin'),
  param('id').isUUID(),
  validate,
  UserController.remove
);

export default router;
