import { UserModel } from '../models/userModel.js';
import { ActivityLogModel } from '../models/activityLogModel.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';

const VALID_ROLES = ['admin', 'asset_manager', 'department_head', 'employee'];

export const UserController = {
  /** Employee directory – all users with optional filters */
  async getAll(req, res, next) {
    try {
      const { role, department_id, search } = req.query;
      const page   = Math.max(parseInt(req.query.page  ?? '1', 10), 1);
      const limit  = Math.min(parseInt(req.query.limit ?? '20', 10), 100);
      const offset = (page - 1) * limit;

      const [users, total] = await Promise.all([
        UserModel.findAll({ limit, offset, role, department_id, search }),
        UserModel.count({ role, department_id, search }),
      ]);

      ApiResponse.success(res, 200, {
        employees: users,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    } catch (err) {
      next(err);
    }
  },

  async getOne(req, res, next) {
    try {
      const user = await UserModel.findByIdWithDept(req.params.id);
      if (!user) throw ApiError.notFound('User not found');
      ApiResponse.success(res, 200, user);
    } catch (err) {
      next(err);
    }
  },

  /** Get currently authenticated user's profile */
  async getMe(req, res, next) {
    try {
      const user = await UserModel.findByIdWithDept(req.user.sub);
      if (!user) throw ApiError.notFound('User not found');
      ApiResponse.success(res, 200, user);
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const { name, email, phone, avatar_url } = req.body;
      const user = await UserModel.update(req.params.id, { name, email, phone, avatar_url });
      if (!user) throw ApiError.notFound('User not found');
      ApiResponse.success(res, 200, user, 'User updated');
    } catch (err) {
      next(err);
    }
  },

  /** Admin-only: promote a user to a new role */
  async promoteRole(req, res, next) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!VALID_ROLES.includes(role)) {
        throw ApiError.badRequest(`Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`);
      }

      const existing = await UserModel.findById(id);
      if (!existing) throw ApiError.notFound('User not found');

      /* Prevent demoting self */
      if (id === req.user.sub) {
        throw ApiError.badRequest('You cannot change your own role');
      }

      const updated = await UserModel.promoteRole(id, role);

      await ActivityLogModel.log({
        user_id: req.user.sub,
        action: 'user_role_changed',
        entity_type: 'user',
        entity_id: id,
        description: `User "${existing.name}" role changed from "${existing.role}" to "${role}"`,
        metadata: { old_role: existing.role, new_role: role },
        ip_address: req.ip,
      });

      ApiResponse.success(res, 200, updated, `User role updated to ${role}`);
    } catch (err) {
      next(err);
    }
  },

  /** Admin-only: toggle user active status */
  async toggleActive(req, res, next) {
    try {
      const { id } = req.params;
      const { is_active } = req.body;

      if (id === req.user.sub) {
        throw ApiError.badRequest('You cannot deactivate your own account');
      }

      const existing = await UserModel.findById(id);
      if (!existing) throw ApiError.notFound('User not found');

      const updated = await UserModel.setActive(id, is_active);

      await ActivityLogModel.log({
        user_id: req.user.sub,
        action: is_active ? 'user_activated' : 'user_deactivated',
        entity_type: 'user',
        entity_id: id,
        description: `User "${existing.name}" ${is_active ? 'activated' : 'deactivated'}`,
        ip_address: req.ip,
      });

      ApiResponse.success(res, 200, updated, `User ${is_active ? 'activated' : 'deactivated'}`);
    } catch (err) {
      next(err);
    }
  },

  async remove(req, res, next) {
    try {
      const deleted = await UserModel.delete(req.params.id);
      if (!deleted) throw ApiError.notFound('User not found');
      ApiResponse.success(res, 200, null, 'User deleted');
    } catch (err) {
      next(err);
    }
  },
};
