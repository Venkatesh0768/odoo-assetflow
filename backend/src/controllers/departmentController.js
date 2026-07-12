import { DepartmentModel } from '../models/departmentModel.js';
import { ActivityLogModel } from '../models/activityLogModel.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const DepartmentController = {
  async getAll(req, res, next) {
    try {
      const { status, search } = req.query;
      const departments = await DepartmentModel.findAll({ status, search });
      ApiResponse.success(res, 200, departments, 'Departments retrieved');
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      const dept = await DepartmentModel.findById(req.params.id);
      if (!dept) throw ApiError.notFound('Department not found');
      ApiResponse.success(res, 200, dept, 'Department retrieved');
    } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      const { name, description, head_id, parent_id, status } = req.body;

      const dept = await DepartmentModel.create({ name, description, head_id, parent_id, status });

      await ActivityLogModel.log({
        user_id: req.user.sub,
        action: 'department_created',
        entity_type: 'department',
        entity_id: dept.id,
        description: `Department "${name}" created`,
        ip_address: req.ip,
      });

      ApiResponse.success(res, 201, dept, 'Department created');
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const existing = await DepartmentModel.findById(id);
      if (!existing) throw ApiError.notFound('Department not found');

      const dept = await DepartmentModel.update(id, req.body);

      await ActivityLogModel.log({
        user_id: req.user.sub,
        action: 'department_updated',
        entity_type: 'department',
        entity_id: id,
        description: `Department "${existing.name}" updated`,
        ip_address: req.ip,
      });

      ApiResponse.success(res, 200, dept, 'Department updated');
    } catch (err) { next(err); }
  },

  async deactivate(req, res, next) {
    try {
      const { id } = req.params;
      const existing = await DepartmentModel.findById(id);
      if (!existing) throw ApiError.notFound('Department not found');

      const children = await DepartmentModel.getChildren(id);
      if (children.length > 0) {
        throw ApiError.badRequest('Cannot deactivate a department that has sub-departments. Deactivate them first.');
      }

      const dept = await DepartmentModel.update(id, { status: 'inactive' });

      await ActivityLogModel.log({
        user_id: req.user.sub,
        action: 'department_deactivated',
        entity_type: 'department',
        entity_id: id,
        description: `Department "${existing.name}" deactivated`,
        ip_address: req.ip,
      });

      ApiResponse.success(res, 200, dept, 'Department deactivated');
    } catch (err) { next(err); }
  },

  async activate(req, res, next) {
    try {
      const { id } = req.params;
      const existing = await DepartmentModel.findById(id);
      if (!existing) throw ApiError.notFound('Department not found');

      const dept = await DepartmentModel.update(id, { status: 'active' });

      await ActivityLogModel.log({
        user_id: req.user.sub,
        action: 'department_activated',
        entity_type: 'department',
        entity_id: id,
        description: `Department "${existing.name}" activated`,
        ip_address: req.ip,
      });

      ApiResponse.success(res, 200, dept, 'Department activated');
    } catch (err) { next(err); }
  },
};
