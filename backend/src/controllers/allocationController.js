import { AllocationModel } from '../models/allocationModel.js';
import { AssetModel } from '../models/assetModel.js';
import { UserModel } from '../models/userModel.js';
import { ActivityLogModel } from '../models/activityLogModel.js';
import { NotificationService } from '../services/notificationService.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const AllocationController = {
  /* ── Allocations ───────────────────────────────────────────────── */
  async getAll(req, res, next) {
    try {
      const { asset_id, user_id, status } = req.query;
      const page  = Math.max(parseInt(req.query.page  ?? '1', 10), 1);
      const limit = Math.min(parseInt(req.query.limit ?? '20', 10), 100);
      const offset = (page - 1) * limit;

      const [allocations, total] = await Promise.all([
        AllocationModel.findAll({ asset_id, user_id, status, limit, offset }),
        AllocationModel.count({ asset_id, user_id, status }),
      ]);

      ApiResponse.success(res, 200, {
        allocations,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      }, 'Allocations retrieved');
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      const alloc = await AllocationModel.findById(req.params.id);
      if (!alloc) throw ApiError.notFound('Allocation not found');
      ApiResponse.success(res, 200, alloc, 'Allocation retrieved');
    } catch (err) { next(err); }
  },

  async allocate(req, res, next) {
    try {
      const { asset_id, allocated_to_user, allocated_to_dept, expected_return_date } = req.body;

      /* Guard: asset must exist */
      const asset = await AssetModel.findById(asset_id);
      if (!asset) throw ApiError.notFound('Asset not found');

      /* Guard: double-allocation block */
      if (asset.status === 'allocated') {
        const current = await AllocationModel.findActiveByAsset(asset_id);
        return ApiResponse.error(res, 409, 'Asset is currently allocated', [{
          field: 'asset_id',
          message: 'Asset is already allocated',
          current_holder: current,
        }]);
      }

      if (!['available', 'reserved'].includes(asset.status)) {
        throw ApiError.badRequest(`Asset cannot be allocated. Current status: ${asset.status}`);
      }

      /* Validate target user exists */
      if (allocated_to_user) {
        const user = await UserModel.findById(allocated_to_user);
        if (!user) throw ApiError.notFound('Target user not found');
      }

      const allocation = await AllocationModel.create({
        asset_id,
        allocated_to_user: allocated_to_user ?? null,
        allocated_to_dept: allocated_to_dept ?? null,
        allocated_by: req.user.sub,
        expected_return_date: expected_return_date ?? null,
      });

      /* Update asset status */
      await AssetModel.setStatus(asset_id, 'allocated');

      /* Send notification */
      if (allocated_to_user) {
        await NotificationService.assetAssigned(allocated_to_user, asset.name, asset_id);
      }

      await ActivityLogModel.log({
        user_id: req.user.sub,
        action: 'asset_allocated',
        entity_type: 'allocation',
        entity_id: allocation.id,
        description: `Asset "${asset.name}" (${asset.asset_tag}) allocated`,
        metadata: { asset_tag: asset.asset_tag, allocated_to_user, allocated_to_dept },
        ip_address: req.ip,
      });

      ApiResponse.success(res, 201, allocation, 'Asset allocated successfully');
    } catch (err) { next(err); }
  },

  async returnAsset(req, res, next) {
    try {
      const { id } = req.params;
      const { condition_on_return, return_notes } = req.body;

      const alloc = await AllocationModel.findById(id);
      if (!alloc) throw ApiError.notFound('Allocation not found');
      if (alloc.status === 'returned') throw ApiError.badRequest('Asset has already been returned');

      const updated = await AllocationModel.markReturned(id, { condition_on_return, return_notes });

      /* Revert asset to available */
      await AssetModel.setStatus(alloc.asset_id, 'available');

      /* Update asset condition if provided */
      if (condition_on_return) {
        await AssetModel.update(alloc.asset_id, { condition: condition_on_return });
      }

      /* Notify original requester */
      if (alloc.allocated_to_user) {
        await NotificationService.returnApproved(alloc.allocated_to_user, alloc.asset_name, id);
      }

      await ActivityLogModel.log({
        user_id: req.user.sub,
        action: 'asset_returned',
        entity_type: 'allocation',
        entity_id: id,
        description: `Asset "${alloc.asset_name}" returned from allocation`,
        metadata: { asset_tag: alloc.asset_tag, condition_on_return },
        ip_address: req.ip,
      });

      ApiResponse.success(res, 200, updated, 'Asset returned successfully');
    } catch (err) { next(err); }
  },

  /* ── Transfer Requests ──────────────────────────────────────────── */
  async getTransfers(req, res, next) {
    try {
      const { asset_id, status, user_id } = req.query;
      const page  = Math.max(parseInt(req.query.page  ?? '1', 10), 1);
      const limit = Math.min(parseInt(req.query.limit ?? '20', 10), 100);
      const offset = (page - 1) * limit;

      const transfers = await AllocationModel.findTransfers({ asset_id, status, user_id, limit, offset });
      ApiResponse.success(res, 200, transfers, 'Transfer requests retrieved');
    } catch (err) { next(err); }
  },

  async getTransferById(req, res, next) {
    try {
      const transfer = await AllocationModel.findTransferById(req.params.id);
      if (!transfer) throw ApiError.notFound('Transfer request not found');
      ApiResponse.success(res, 200, transfer, 'Transfer request retrieved');
    } catch (err) { next(err); }
  },

  async requestTransfer(req, res, next) {
    try {
      const { asset_id, to_user, to_dept, reason } = req.body;

      const asset = await AssetModel.findById(asset_id);
      if (!asset) throw ApiError.notFound('Asset not found');

      /* Determine from_user: current holder */
      const currentAlloc = await AllocationModel.findActiveByAsset(asset_id);
      const from_user = currentAlloc?.allocated_to_user ?? null;

      const transfer = await AllocationModel.createTransfer({
        asset_id,
        from_user,
        to_user: to_user ?? null,
        to_dept: to_dept ?? null,
        requested_by: req.user.sub,
        reason,
      });

      await ActivityLogModel.log({
        user_id: req.user.sub,
        action: 'transfer_requested',
        entity_type: 'transfer_request',
        entity_id: transfer.id,
        description: `Transfer request for asset "${asset.name}" submitted`,
        metadata: { asset_tag: asset.asset_tag, to_user, to_dept },
        ip_address: req.ip,
      });

      ApiResponse.success(res, 201, transfer, 'Transfer request submitted');
    } catch (err) { next(err); }
  },

  async approveTransfer(req, res, next) {
    try {
      const { id } = req.params;
      const transfer = await AllocationModel.findTransferById(id);
      if (!transfer) throw ApiError.notFound('Transfer request not found');
      if (transfer.status !== 'requested') {
        throw ApiError.badRequest(`Transfer is already ${transfer.status}`);
      }

      const updated = await AllocationModel.updateTransferStatus(id, {
        status: 'approved',
        approved_by: req.user.sub,
      });

      /* Auto-complete: Return current allocation and create new one */
      const currentAlloc = await AllocationModel.findActiveByAsset(transfer.asset_id);
      if (currentAlloc) {
        await AllocationModel.markReturned(currentAlloc.id, {
          return_notes: `Transferred via request #${id}`,
        });
      }

      if (transfer.to_user || transfer.to_dept) {
        await AllocationModel.create({
          asset_id: transfer.asset_id,
          allocated_to_user: transfer.to_user,
          allocated_to_dept: transfer.to_dept,
          allocated_by: req.user.sub,
        });
        if (transfer.to_user) {
          await NotificationService.transferApproved(transfer.to_user, transfer.asset_name, id);
        }
      } else {
        /* No new recipient – just free the asset */
        await AssetModel.setStatus(transfer.asset_id, 'available');
      }

      /* Also update final status to completed */
      await AllocationModel.updateTransferStatus(id, { status: 'completed', approved_by: req.user.sub });

      await ActivityLogModel.log({
        user_id: req.user.sub,
        action: 'transfer_approved',
        entity_type: 'transfer_request',
        entity_id: id,
        description: `Transfer request for "${transfer.asset_name}" approved and completed`,
        ip_address: req.ip,
      });

      ApiResponse.success(res, 200, updated, 'Transfer approved and completed');
    } catch (err) { next(err); }
  },

  async rejectTransfer(req, res, next) {
    try {
      const { id } = req.params;
      const { rejection_reason } = req.body;

      const transfer = await AllocationModel.findTransferById(id);
      if (!transfer) throw ApiError.notFound('Transfer request not found');
      if (transfer.status !== 'requested') {
        throw ApiError.badRequest(`Transfer is already ${transfer.status}`);
      }

      const updated = await AllocationModel.updateTransferStatus(id, {
        status: 'rejected',
        approved_by: req.user.sub,
        rejection_reason,
      });

      await ActivityLogModel.log({
        user_id: req.user.sub,
        action: 'transfer_rejected',
        entity_type: 'transfer_request',
        entity_id: id,
        description: `Transfer request for "${transfer.asset_name}" rejected`,
        ip_address: req.ip,
      });

      ApiResponse.success(res, 200, updated, 'Transfer rejected');
    } catch (err) { next(err); }
  },
};
