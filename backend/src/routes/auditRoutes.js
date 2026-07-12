import { Router } from 'express';
import { body, param } from 'express-validator';
import { AuditController } from '../controllers/auditController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authenticate);

/* ── Audit Cycles ─────────────────────────────────────────────────── */
router.get('/', AuditController.getAllCycles);

router.get('/:id',
  param('id').isUUID(),
  validate,
  AuditController.getCycleById
);

router.post('/',
  authorize('admin', 'asset_manager'),
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('scope_type').isIn(['department', 'location', 'all']).withMessage('scope_type must be department, location, or all'),
  body('scope_department_id').optional().isUUID(),
  body('scope_location').optional().trim(),
  body('start_date').isDate().withMessage('start_date is required (YYYY-MM-DD)'),
  body('end_date').isDate().withMessage('end_date is required (YYYY-MM-DD)'),
  validate,
  AuditController.createCycle
);

router.patch('/:id/close',
  authorize('admin', 'asset_manager'),
  param('id').isUUID(),
  validate,
  AuditController.closeCycle
);

/* ── Auditors ────────────────────────────────────────────────────── */
router.post('/:id/auditors',
  authorize('admin', 'asset_manager'),
  param('id').isUUID(),
  body('auditor_id').isUUID().withMessage('auditor_id is required'),
  validate,
  AuditController.assignAuditor
);

router.delete('/:id/auditors/:auditorId',
  authorize('admin', 'asset_manager'),
  param('id').isUUID(),
  param('auditorId').isUUID(),
  validate,
  AuditController.removeAuditor
);

/* ── Audit Items ─────────────────────────────────────────────────── */
router.get('/:id/items',
  param('id').isUUID(),
  validate,
  AuditController.getItems
);

router.patch('/:id/items/:itemId',
  param('id').isUUID(),
  param('itemId').isUUID(),
  body('verification_status').isIn(['verified', 'missing', 'damaged'])
    .withMessage('verification_status must be verified, missing, or damaged'),
  body('notes').optional().trim(),
  validate,
  AuditController.verifyItem
);

/* ── Discrepancy Report ──────────────────────────────────────────── */
router.get('/:id/discrepancy-report',
  param('id').isUUID(),
  validate,
  AuditController.getDiscrepancyReport
);

export default router;
