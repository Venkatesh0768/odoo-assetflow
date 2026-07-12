import { query } from '../config/db.js';

export const CategoryModel = {
  async findAll({ status, search } = {}) {
    const conditions = [];
    const params = [];
    let p = 1;

    if (status) { conditions.push(`status = $${p++}`); params.push(status); }
    if (search) {
      conditions.push(`name ILIKE $${p}`);
      params.push(`%${search}%`);
      p++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = await query(
      `SELECT c.*,
              (SELECT COUNT(*) FROM assets WHERE category_id = c.id) AS asset_count
       FROM asset_categories c
       ${where}
       ORDER BY c.name ASC`,
      params
    );
    return rows;
  },

  async findById(id) {
    const { rows } = await query(
      `SELECT c.*,
              (SELECT COUNT(*) FROM assets WHERE category_id = c.id) AS asset_count
       FROM asset_categories c
       WHERE c.id = $1 LIMIT 1`,
      [id]
    );
    return rows[0] ?? null;
  },

  async create({ name, description, custom_fields = [], status = 'active' }) {
    const { rows } = await query(
      `INSERT INTO asset_categories (name, description, custom_fields, status)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, description ?? null, JSON.stringify(custom_fields), status]
    );
    return rows[0];
  },

  async update(id, fields) {
    const allowed = ['name', 'description', 'custom_fields', 'status'];
    const updates = Object.entries(fields).filter(([k]) => allowed.includes(k));
    if (!updates.length) return null;

    const values = updates.map(([, v]) => (typeof v === 'object' && v !== null ? JSON.stringify(v) : v));
    const setClauses = updates.map(([k], i) => `${k} = $${i + 2}`).join(', ');

    const { rows } = await query(
      `UPDATE asset_categories SET ${setClauses}, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return rows[0] ?? null;
  },
};
