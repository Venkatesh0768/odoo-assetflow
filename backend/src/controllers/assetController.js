import { AssetModel } from '../models/assetModel.js';
import { ActivityLogModel } from '../models/activityLogModel.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const AssetController = {
  async getAll(req, res, next) {
    try {
      const { status, category_id, department_id, location, search, is_bookable } = req.query;
      const page  = Math.max(parseInt(req.query.page  ?? '1', 10), 1);
      const limit = Math.min(parseInt(req.query.limit ?? '20', 10), 100);
      const offset = (page - 1) * limit;

      const bookable = is_bookable !== undefined ? is_bookable === 'true' : undefined;

      const [assets, total] = await Promise.all([
        AssetModel.findAll({ status, category_id, department_id, location, search, is_bookable: bookable, limit, offset }),
        AssetModel.count({ status, category_id, department_id, location, search, is_bookable: bookable }),
      ]);

      ApiResponse.success(res, 200, {
        assets,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      }, 'Assets retrieved');
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      const asset = await AssetModel.findById(req.params.id);
      if (!asset) throw ApiError.notFound('Asset not found');
      ApiResponse.success(res, 200, asset, 'Asset retrieved');
    } catch (err) { next(err); }
  },

  async getHistory(req, res, next) {
    try {
      const asset = await AssetModel.findById(req.params.id);
      if (!asset) throw ApiError.notFound('Asset not found');

      const history = await AssetModel.getHistory(req.params.id);
      ApiResponse.success(res, 200, { asset, history }, 'Asset history retrieved');
    } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      const data = { ...req.body, created_by: req.user.sub };
      const asset = await AssetModel.create(data);

      await ActivityLogModel.log({
        user_id: req.user.sub,
        action: 'asset_registered',
        entity_type: 'asset',
        entity_id: asset.id,
        description: `Asset "${asset.name}" (${asset.asset_tag}) registered`,
        metadata: { asset_tag: asset.asset_tag, category_id: asset.category_id },
        ip_address: req.ip,
      });

      ApiResponse.success(res, 201, asset, 'Asset registered');
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const existing = await AssetModel.findById(id);
      if (!existing) throw ApiError.notFound('Asset not found');

      const asset = await AssetModel.update(id, req.body);

      await ActivityLogModel.log({
        user_id: req.user.sub,
        action: 'asset_updated',
        entity_type: 'asset',
        entity_id: id,
        description: `Asset "${existing.name}" (${existing.asset_tag}) updated`,
        ip_address: req.ip,
      });

      ApiResponse.success(res, 200, asset, 'Asset updated');
    } catch (err) { next(err); }
  },

  async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const existing = await AssetModel.findById(id);
      if (!existing) throw ApiError.notFound('Asset not found');

      const asset = await AssetModel.setStatus(id, status);

      await ActivityLogModel.log({
        user_id: req.user.sub,
        action: 'asset_status_changed',
        entity_type: 'asset',
        entity_id: id,
        description: `Asset "${existing.name}" status changed from "${existing.status}" to "${status}"`,
        metadata: { old_status: existing.status, new_status: status },
        ip_address: req.ip,
      });

      ApiResponse.success(res, 200, asset, 'Asset status updated');
    } catch (err) { next(err); }
  },
};
