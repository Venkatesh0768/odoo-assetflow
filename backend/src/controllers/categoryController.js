import { CategoryModel } from '../models/categoryModel.js';
import { ActivityLogModel } from '../models/activityLogModel.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const CategoryController = {
  async getAll(req, res, next) {
    try {
      const { status, search } = req.query;
      const categories = await CategoryModel.findAll({ status, search });
      ApiResponse.success(res, 200, categories, 'Categories retrieved');
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      const cat = await CategoryModel.findById(req.params.id);
      if (!cat) throw ApiError.notFound('Category not found');
      ApiResponse.success(res, 200, cat, 'Category retrieved');
    } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      const { name, description, custom_fields, status } = req.body;
      const cat = await CategoryModel.create({ name, description, custom_fields, status });

      await ActivityLogModel.log({
        user_id: req.user.sub,
        action: 'category_created',
        entity_type: 'asset_category',
        entity_id: cat.id,
        description: `Asset category "${name}" created`,
        ip_address: req.ip,
      });

      ApiResponse.success(res, 201, cat, 'Category created');
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const existing = await CategoryModel.findById(id);
      if (!existing) throw ApiError.notFound('Category not found');

      const cat = await CategoryModel.update(id, req.body);

      await ActivityLogModel.log({
        user_id: req.user.sub,
        action: 'category_updated',
        entity_type: 'asset_category',
        entity_id: id,
        description: `Asset category "${existing.name}" updated`,
        ip_address: req.ip,
      });

      ApiResponse.success(res, 200, cat, 'Category updated');
    } catch (err) { next(err); }
  },
};
