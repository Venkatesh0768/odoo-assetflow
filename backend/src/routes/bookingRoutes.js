import { Router } from 'express';
import { body, param } from 'express-validator';
import { BookingController } from '../controllers/bookingController.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authenticate);

router.get('/', BookingController.getAll);

/* Calendar view for a specific bookable asset — MUST be before /:id */
router.get('/calendar/:id',
  param('id').isUUID(),
  validate,
  BookingController.getCalendar
);

router.get('/:id',
  param('id').isUUID(),
  validate,
  BookingController.getById
);

router.post('/',
  body('asset_id').isUUID().withMessage('asset_id is required'),
  body('start_time').isISO8601().withMessage('start_time must be a valid ISO date-time'),
  body('end_time').isISO8601().withMessage('end_time must be a valid ISO date-time'),
  body('purpose').optional().trim(),
  body('department_id').optional().isUUID(),
  validate,
  BookingController.create
);

router.patch('/:id/reschedule',
  param('id').isUUID(),
  body('start_time').optional().isISO8601(),
  body('end_time').optional().isISO8601(),
  body('purpose').optional().trim(),
  validate,
  BookingController.reschedule
);

router.patch('/:id/cancel',
  param('id').isUUID(),
  body('cancellation_reason').optional().trim(),
  validate,
  BookingController.cancel
);

export default router;
