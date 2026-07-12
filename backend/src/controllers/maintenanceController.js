import { MaintenanceModel } from '../models/maintenanceModel.js';
import { AssetModel } from '../models/assetModel.js';
import { ActivityLogModel } from '../models/activityLogModel.js';
import { NotificationService } from '../services/notificationService.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const MaintenanceController = {
  async getAll(req, res, next) {
    try {
      const { asset_id, status, priority, raised_by } = req.query;
      const page  = Math.max(parseInt(req.query.page  ?? '1', 10), 1);
      const limit = Math.min(parseInt(req.query.limit ?? '20', 10), 100);
      const offset = (page - 1) * limit;

      const [requests, total] = await Promise.all([
        MaintenanceModel.findAll({ asset_id, status, priority, raised_by, limit, offset }),
        MaintenanceModel.count({ asset_id, status, priority, raised_by }),
      ]);

      ApiResponse.success(res, 200, {
        requests,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      }, 'Maintenance requests retrieved');
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      const request = await MaintenanceModel.findById(req.params.id);
      if (!request) throw ApiError.notFound('Maintenance request not found');
      ApiResponse.success(res, 200, request, 'Maintenance request retrieved');
    } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      const { asset_id, issue_description, priority, photo_url } = req.body;

      const asset = await AssetModel.findById(asset_id);
      if (!asset) throw ApiError.notFound('Asset not found');

      if (['retired', 'disposed', 'lost'].includes(asset.status)) {
        throw ApiError.badRequest(`Cannot raise maintenance request for an asset with status: ${asset.status}`);
      }

      const request = await MaintenanceModel.create({
        asset_id,
        raised_by: req.user.sub,
        issue_description,
        priority,
        photo_url,
      });

      await ActivityLogModel.log({
        user_id: req.user.sub,
        action: 'maintenance_requested',
        entity_type: 'maintenance_request',
        entity_id: request.id,
        description: `Maintenance requested for asset "${asset.name}" (${asset.asset_tag}): ${issue_description.substring(0, 100)}`,
        metadata: { asset_tag: asset.asset_tag, priority },
        ip_address: req.ip,
      });

      ApiResponse.success(res, 201, request, 'Maintenance request submitted');
    } catch (err) { next(err); }
  },

  async approve(req, res, next) {
    try {
      const { id } = req.params;
      const { estimated_cost } = req.body;

      const request = await MaintenanceModel.findById(id);
      if (!request) throw ApiError.notFound('Maintenance request not found');
      if (request.status !== 'pending') {
        throw ApiError.badRequest(`Request is already ${request.status}`);
      }

      const updated = await MaintenanceModel.update(id, {
        status: 'approved',
        approved_by: req.user.sub,
        estimated_cost: estimated_cost ?? null,
      });

      /* Asset → under_maintenance */
      await AssetModel.setStatus(request.asset_id, 'under_maintenance');

      await NotificationService.maintenanceApproved(request.raised_by, request.asset_name, id);

      await ActivityLogModel.log({
        user_id: req.user.sub,
        action: 'maintenance_approved',
        entity_type: 'maintenance_request',
        entity_id: id,
        description: `Maintenance request for "${request.asset_name}" approved`,
        ip_address: req.ip,
      });

      ApiResponse.success(res, 200, updated, 'Maintenance request approved');
    } catch (err) { next(err); }
  },

  async reject(req, res, next) {
    try {
      const { id } = req.params;
      const { rejection_reason } = req.body;

      const request = await MaintenanceModel.findById(id);
      if (!request) throw ApiError.notFound('Maintenance request not found');
      if (request.status !== 'pending') {
        throw ApiError.badRequest(`Request is already ${request.status}`);
      }

      const updated = await MaintenanceModel.update(id, {
        status: 'rejected',
        approved_by: req.user.sub,
        rejection_reason,
      });

      await NotificationService.maintenanceRejected(request.raised_by, request.asset_name, id, rejection_reason);

      await ActivityLogModel.log({
        user_id: req.user.sub,
        action: 'maintenance_rejected',
        entity_type: 'maintenance_request',
        entity_id: id,
        description: `Maintenance request for "${request.asset_name}" rejected`,
        ip_address: req.ip,
      });

      ApiResponse.success(res, 200, updated, 'Maintenance request rejected');
    } catch (err) { next(err); }
  },

  async assignTechnician(req, res, next) {
    try {
      const { id } = req.params;
      const { technician_id } = req.body;

      const request = await MaintenanceModel.findById(id);
      if (!request) throw ApiError.notFound('Maintenance request not found');
      if (request.status !== 'approved') {
        throw ApiError.badRequest('Request must be approved before assigning a technician');
      }

      const updated = await MaintenanceModel.update(id, {
        status: 'technician_assigned',
        technician_id,
      });

      await ActivityLogModel.log({
        user_id: req.user.sub,
        action: 'technician_assigned',
        entity_type: 'maintenance_request',
        entity_id: id,
        description: `Technician assigned to maintenance request for "${request.asset_name}"`,
        ip_address: req.ip,
      });

      ApiResponse.success(res, 200, updated, 'Technician assigned');
    } catch (err) { next(err); }
  },

  async startWork(req, res, next) {
    try {
      const { id } = req.params;
      const request = await MaintenanceModel.findById(id);
      if (!request) throw ApiError.notFound('Maintenance request not found');
      if (!['approved', 'technician_assigned'].includes(request.status)) {
        throw ApiError.badRequest(`Cannot start work. Current status: ${request.status}`);
      }

      const updated = await MaintenanceModel.update(id, { status: 'in_progress' });

      await ActivityLogModel.log({
        user_id: req.user.sub,
        action: 'maintenance_started',
        entity_type: 'maintenance_request',
        entity_id: id,
        description: `Maintenance work started for "${request.asset_name}"`,
        ip_address: req.ip,
      });

      ApiResponse.success(res, 200, updated, 'Maintenance work started');
    } catch (err) { next(err); }
  },

  async resolve(req, res, next) {
    try {
      const { id } = req.params;
      const { resolution_notes, actual_cost } = req.body;

      const request = await MaintenanceModel.findById(id);
      if (!request) throw ApiError.notFound('Maintenance request not found');
      if (!['approved', 'technician_assigned', 'in_progress'].includes(request.status)) {
        throw ApiError.badRequest(`Cannot resolve. Current status: ${request.status}`);
      }

      const updated = await MaintenanceModel.update(id, {
        status: 'resolved',
        resolution_notes,
        actual_cost: actual_cost ?? null,
        resolved_at: new Date().toISOString(),
      });

      /* Asset → available */
      await AssetModel.setStatus(request.asset_id, 'available');

      await ActivityLogModel.log({
        user_id: req.user.sub,
        action: 'maintenance_resolved',
        entity_type: 'maintenance_request',
        entity_id: id,
        description: `Maintenance resolved for asset "${request.asset_name}"`,
        metadata: { resolution_notes: resolution_notes?.substring(0, 200), actual_cost },
        ip_address: req.ip,
      });

      ApiResponse.success(res, 200, updated, 'Maintenance resolved. Asset marked as available.');
    } catch (err) { next(err); }
  },
};
