import { NotificationModel } from '../models/notificationModel.js';
import { ActivityLogModel } from '../models/activityLogModel.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const NotificationController = {
  async getAll(req, res, next) {
    try {
      const { type } = req.query;
      const is_read  = req.query.is_read !== undefined
        ? req.query.is_read === 'true'
        : undefined;

      const page  = Math.max(parseInt(req.query.page  ?? '1', 10), 1);
      const limit = Math.min(parseInt(req.query.limit ?? '20', 10), 100);
      const offset = (page - 1) * limit;

      const user_id = req.user.sub;

      const [notifications, total, unread] = await Promise.all([
        NotificationModel.findAll({ user_id, type, is_read, limit, offset }),
        NotificationModel.count({ user_id, type, is_read }),
        NotificationModel.countUnread(user_id),
      ]);

      ApiResponse.success(res, 200, {
        notifications,
        unread_count: unread,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      }, 'Notifications retrieved');
    } catch (err) { next(err); }
  },

  async markRead(req, res, next) {
    try {
      const { id } = req.params;
      const notification = await NotificationModel.markRead(id, req.user.sub);
      if (!notification) throw ApiError.notFound('Notification not found');
      ApiResponse.success(res, 200, notification, 'Notification marked as read');
    } catch (err) { next(err); }
  },

  async markAllRead(req, res, next) {
    try {
      const count = await NotificationModel.markAllRead(req.user.sub);
      ApiResponse.success(res, 200, { updated: count }, `${count} notification(s) marked as read`);
    } catch (err) { next(err); }
  },

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const deleted = await NotificationModel.delete(id, req.user.sub);
      if (!deleted) throw ApiError.notFound('Notification not found');
      ApiResponse.success(res, 200, null, 'Notification deleted');
    } catch (err) { next(err); }
  },

  /* Activity log (admin/asset_manager visible) */
  async getActivityLog(req, res, next) {
    try {
      const { user_id, entity_type, entity_id } = req.query;
      const page  = Math.max(parseInt(req.query.page  ?? '1', 10), 1);
      const limit = Math.min(parseInt(req.query.limit ?? '50', 10), 200);
      const offset = (page - 1) * limit;

      const [logs, total] = await Promise.all([
        ActivityLogModel.findAll({ user_id, entity_type, entity_id, limit, offset }),
        ActivityLogModel.count({ user_id, entity_type, entity_id }),
      ]);

      ApiResponse.success(res, 200, {
        logs,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      }, 'Activity log retrieved');
    } catch (err) { next(err); }
  },
};
