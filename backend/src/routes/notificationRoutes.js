import { Router } from 'express';
import { param } from 'express-validator';
import { NotificationController } from '../controllers/notificationController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authenticate);

/* Notifications for the current user */
router.get('/', NotificationController.getAll);
router.patch('/read-all', NotificationController.markAllRead);

router.patch('/:id/read',
  param('id').isUUID(),
  validate,
  NotificationController.markRead
);

router.delete('/:id',
  param('id').isUUID(),
  validate,
  NotificationController.delete
);

/* Activity log – accessible to admin and asset_manager */
router.get('/activity-log',
  authorize('admin', 'asset_manager'),
  NotificationController.getActivityLog
);

export default router;
