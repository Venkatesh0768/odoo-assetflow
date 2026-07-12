import { AuditModel } from '../models/auditModel.js';
import { AssetModel } from '../models/assetModel.js';
import { ActivityLogModel } from '../models/activityLogModel.js';
import { NotificationService } from '../services/notificationService.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { query } from '../config/db.js';

export const AuditController = {
  /* ── Audit Cycles ──────────────────────────────────────────────── */
  async getAllCycles(req, res, next) {
    try {
      const { status } = req.query;
      const page  = Math.max(parseInt(req.query.page  ?? '1', 10), 1);
      const limit = Math.min(parseInt(req.query.limit ?? '20', 10), 100);
      const offset = (page - 1) * limit;

      const cycles = await AuditModel.findAllCycles({ status, limit, offset });
      ApiResponse.success(res, 200, cycles, 'Audit cycles retrieved');
    } catch (err) { next(err); }
  },

  async getCycleById(req, res, next) {
    try {
      const cycle = await AuditModel.findCycleById(req.params.id);
      if (!cycle) throw ApiError.notFound('Audit cycle not found');
      ApiResponse.success(res, 200, cycle, 'Audit cycle retrieved');
    } catch (err) { next(err); }
  },

  async createCycle(req, res, next) {
    try {
      const { title, scope_type, scope_department_id, scope_location, start_date, end_date } = req.body;

      const cycle = await AuditModel.createCycle({
        title, scope_type, scope_department_id, scope_location,
        start_date, end_date, created_by: req.user.sub,
      });

      /* Auto-populate audit items based on scope */
      let assets = [];
      if (scope_type === 'department' && scope_department_id) {
        assets = await AssetModel.findAll({ department_id: scope_department_id, limit: 10000, offset: 0 });
      } else if (scope_type === 'location' && scope_location) {
        assets = await AssetModel.findAll({ location: scope_location, limit: 10000, offset: 0 });
      } else {
        assets = await AssetModel.findAll({ limit: 10000, offset: 0 });
      }

      /* Filter out retired/disposed */
      const auditableAssets = assets.filter(a => !['retired', 'disposed'].includes(a.status));

      for (const asset of auditableAssets) {
        await AuditModel.addItem({
          audit_cycle_id: cycle.id,
          asset_id: asset.id,
          expected_location: asset.location,
        });
      }

      /* Update total_assets count */
      await AuditModel.updateCycle(cycle.id, { total_assets: auditableAssets.length });

      await ActivityLogModel.log({
        user_id: req.user.sub,
        action: 'audit_cycle_created',
        entity_type: 'audit_cycle',
        entity_id: cycle.id,
        description: `Audit cycle "${title}" created with ${auditableAssets.length} assets`,
        ip_address: req.ip,
      });

      const created = await AuditModel.findCycleById(cycle.id);
      ApiResponse.success(res, 201, created, 'Audit cycle created');
    } catch (err) { next(err); }
  },

  async closeCycle(req, res, next) {
    try {
      const { id } = req.params;
      const cycle = await AuditModel.findCycleById(id);
      if (!cycle) throw ApiError.notFound('Audit cycle not found');
      if (cycle.status === 'closed') throw ApiError.badRequest('Audit cycle is already closed');

      /* Gather counts */
      const counts = await AuditModel.getItemCounts(id);

      /* Mark missing assets as 'lost' */
      const missingAssetIds = await AuditModel.getMissingAssetIds(id);
      for (const assetId of missingAssetIds) {
        await AssetModel.setStatus(assetId, 'lost');
        const asset = await AssetModel.findById(assetId);
        if (asset) {
          await NotificationService.auditDiscrepancy(cycle.created_by, asset.name, id);
        }
      }

      /* Lock cycle */
      await AuditModel.updateCycle(id, {
        status: 'closed',
        closed_by: req.user.sub,
        closed_at: new Date().toISOString(),
        verified_count: parseInt(counts.verified, 10),
        missing_count:  parseInt(counts.missing,  10),
        damaged_count:  parseInt(counts.damaged,  10),
        total_assets:   parseInt(counts.total,    10),
      });

      await ActivityLogModel.log({
        user_id: req.user.sub,
        action: 'audit_cycle_closed',
        entity_type: 'audit_cycle',
        entity_id: id,
        description: `Audit cycle "${cycle.title}" closed. ${missingAssetIds.length} assets marked as lost.`,
        metadata: { ...counts, missing_asset_ids: missingAssetIds },
        ip_address: req.ip,
      });

      const updated = await AuditModel.findCycleById(id);
      ApiResponse.success(res, 200, updated, 'Audit cycle closed');
    } catch (err) { next(err); }
  },

  /* ── Auditors ───────────────────────────────────────────────────── */
  async assignAuditor(req, res, next) {
    try {
      const { id } = req.params;
      const { auditor_id } = req.body;

      const cycle = await AuditModel.findCycleById(id);
      if (!cycle) throw ApiError.notFound('Audit cycle not found');
      if (cycle.status === 'closed') throw ApiError.badRequest('Cannot modify a closed audit cycle');

      const assigned = await AuditModel.assignAuditor(id, auditor_id);

      await ActivityLogModel.log({
        user_id: req.user.sub,
        action: 'auditor_assigned',
        entity_type: 'audit_cycle',
        entity_id: id,
        description: `Auditor assigned to audit cycle "${cycle.title}"`,
        ip_address: req.ip,
      });

      ApiResponse.success(res, 201, assigned, 'Auditor assigned');
    } catch (err) { next(err); }
  },

  async removeAuditor(req, res, next) {
    try {
      const { id, auditorId } = req.params;
      const cycle = await AuditModel.findCycleById(id);
      if (!cycle) throw ApiError.notFound('Audit cycle not found');
      if (cycle.status === 'closed') throw ApiError.badRequest('Cannot modify a closed audit cycle');

      const removed = await AuditModel.removeAuditor(id, auditorId);
      if (!removed) throw ApiError.notFound('Auditor not assigned to this cycle');

      ApiResponse.success(res, 200, null, 'Auditor removed');
    } catch (err) { next(err); }
  },

  /* ── Audit Items ────────────────────────────────────────────────── */
  async getItems(req, res, next) {
    try {
      const { id } = req.params;
      const { verification_status } = req.query;

      const cycle = await AuditModel.findCycleById(id);
      if (!cycle) throw ApiError.notFound('Audit cycle not found');

      const items = await AuditModel.findItems(id, { verification_status });
      ApiResponse.success(res, 200, { cycle, items }, 'Audit items retrieved');
    } catch (err) { next(err); }
  },

  async verifyItem(req, res, next) {
    try {
      const { id, itemId } = req.params;
      const { verification_status, notes } = req.body;

      const cycle = await AuditModel.findCycleById(id);
      if (!cycle) throw ApiError.notFound('Audit cycle not found');
      if (cycle.status === 'closed') throw ApiError.badRequest('Cannot update items in a closed audit cycle');

      const item = await AuditModel.findItemById(itemId);
      if (!item || item.audit_cycle_id !== id) {
        throw ApiError.notFound('Audit item not found');
      }

      const updated = await AuditModel.verifyItem(itemId, {
        verification_status,
        auditor_id: req.user.sub,
        notes,
      });

      await ActivityLogModel.log({
        user_id: req.user.sub,
        action: 'audit_item_verified',
        entity_type: 'audit_item',
        entity_id: itemId,
        description: `Asset "${item.asset_name}" marked as ${verification_status} in audit "${cycle.title}"`,
        metadata: { verification_status, notes },
        ip_address: req.ip,
      });

      ApiResponse.success(res, 200, updated, 'Audit item updated');
    } catch (err) { next(err); }
  },

  async getDiscrepancyReport(req, res, next) {
    try {
      const { id } = req.params;
      const cycle = await AuditModel.findCycleById(id);
      if (!cycle) throw ApiError.notFound('Audit cycle not found');

      const discrepancies = await AuditModel.getDiscrepancyReport(id);
      const counts = await AuditModel.getItemCounts(id);

      ApiResponse.success(res, 200, {
        cycle,
        summary: counts,
        discrepancies,
      }, 'Discrepancy report generated');
    } catch (err) { next(err); }
  },
};
