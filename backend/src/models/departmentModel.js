import { query } from '../config/db.js';

export const DepartmentModel = {
  async findAll({ status, search } = {}) {
    const conditions = [];
    const params = [];
    let p = 1;

    if (status) { conditions.push(`d.status = $${p++}`); params.push(status); }
    if (search) {
      conditions.push(`d.name ILIKE $${p}`);
      params.push(`%${search}%`);
      p++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = await query(
      `SELECT d.*, u.name AS head_name, u.email AS head_email,
              p.name AS parent_name,
              (SELECT COUNT(*) FROM users WHERE department_id = d.id) AS employee_count
       FROM departments d
       LEFT JOIN users u ON u.id = d.head_id
       LEFT JOIN departments p ON p.id = d.parent_id
       ${where}
       ORDER BY d.name ASC`,
      params
    );
    return rows;
  },

  async findById(id) {
    const { rows } = await query(
      `SELECT d.*, u.name AS head_name, u.email AS head_email,
              p.name AS parent_name
       FROM departments d
       LEFT JOIN users u ON u.id = d.head_id
       LEFT JOIN departments p ON p.id = d.parent_id
       WHERE d.id = $1 LIMIT 1`,
      [id]
    );
    return rows[0] ?? null;
  },

  async create({ name, description, head_id, parent_id, status = 'active' }) {
    const { rows } = await query(
      `INSERT INTO departments (name, description, head_id, parent_id, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, description ?? null, head_id ?? null, parent_id ?? null, status]
    );
    return rows[0];
  },

  async update(id, fields) {
    const allowed = ['name', 'description', 'head_id', 'parent_id', 'status'];
    const updates = Object.entries(fields).filter(([k]) => allowed.includes(k));
    if (!updates.length) return null;

    const setClauses = updates.map(([k], i) => `${k} = $${i + 2}`).join(', ');
    const values = [id, ...updates.map(([, v]) => v)];

    const { rows } = await query(
      `UPDATE departments SET ${setClauses}, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      values
    );
    return rows[0] ?? null;
  },

  async getChildren(parentId) {
    const { rows } = await query(
      `SELECT * FROM departments WHERE parent_id = $1`,
      [parentId]
    );
    return rows;
  },

  async countEmployees(id) {
    const { rows } = await query(
      `SELECT COUNT(*) FROM users WHERE department_id = $1`,
      [id]
    );
    return parseInt(rows[0].count, 10);
  },
};
