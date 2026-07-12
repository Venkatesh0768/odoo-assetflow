import { query } from '../config/db.js';

/**
 * Data-access layer for the `users` table.
 */
export const UserModel = {
  /** Find a user by their email address (includes password for auth) */
  async findByEmail(email) {
    const { rows } = await query(
      'SELECT * FROM users WHERE email = $1 LIMIT 1',
      [email]
    );
    return rows[0] ?? null;
  },

  /** Find a user by their UUID (safe – no password) */
  async findById(id) {
    const { rows } = await query(
      `SELECT id, name, email, role, employee_id, department_id, phone, avatar_url,
              is_active, created_at, updated_at
       FROM users WHERE id = $1 LIMIT 1`,
      [id]
    );
    return rows[0] ?? null;
  },

  /** Find user with department info */
  async findByIdWithDept(id) {
    const { rows } = await query(
      `SELECT u.id, u.name, u.email, u.role, u.employee_id, u.department_id,
              u.phone, u.avatar_url, u.is_active, u.created_at, u.updated_at,
              d.name AS department_name
       FROM users u
       LEFT JOIN departments d ON d.id = u.department_id
       WHERE u.id = $1 LIMIT 1`,
      [id]
    );
    return rows[0] ?? null;
  },

  /** Create a new user – always as 'employee' on signup */
  async create({ name, email, password, role = 'employee' }) {
    /* Auto-generate employee_id */
    const { rows: [seq] } = await query(
      `SELECT COALESCE(MAX(CAST(SUBSTRING(employee_id FROM 5) AS INT)), 0) + 1 AS next
       FROM users WHERE employee_id IS NOT NULL`
    );
    const employeeId = `EMP-${String(seq.next).padStart(4, '0')}`;

    const { rows } = await query(
      `INSERT INTO users (name, email, password, role, employee_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role, employee_id, department_id, phone, avatar_url, is_active, created_at, updated_at`,
      [name, email, password, role, employeeId]
    );
    return rows[0];
  },

  /** List all employees with optional filters (employee directory) */
  async findAll({ limit = 20, offset = 0, role, department_id, search } = {}) {
    const conditions = [];
    const params = [];
    let p = 1;

    if (role) {
      conditions.push(`u.role = $${p++}`);
      params.push(role);
    }
    if (department_id) {
      conditions.push(`u.department_id = $${p++}`);
      params.push(department_id);
    }
    if (search) {
      conditions.push(`(u.name ILIKE $${p} OR u.email ILIKE $${p} OR u.employee_id ILIKE $${p})`);
      params.push(`%${search}%`);
      p++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = await query(
      `SELECT u.id, u.name, u.email, u.role, u.employee_id, u.department_id,
              u.phone, u.avatar_url, u.is_active, u.created_at, u.updated_at,
              d.name AS department_name
       FROM users u
       LEFT JOIN departments d ON d.id = u.department_id
       ${where}
       ORDER BY u.created_at DESC
       LIMIT $${p} OFFSET $${p + 1}`,
      [...params, limit, offset]
    );
    return rows;
  },

  /** Count all employees (for pagination) */
  async count({ role, department_id, search } = {}) {
    const conditions = [];
    const params = [];
    let p = 1;

    if (role) { conditions.push(`role = $${p++}`); params.push(role); }
    if (department_id) { conditions.push(`department_id = $${p++}`); params.push(department_id); }
    if (search) {
      conditions.push(`(name ILIKE $${p} OR email ILIKE $${p} OR employee_id ILIKE $${p})`);
      params.push(`%${search}%`);
      p++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await query(`SELECT COUNT(*) FROM users ${where}`, params);
    return parseInt(rows[0].count, 10);
  },

  /** Update mutable user fields */
  async update(id, fields) {
    const allowed = ['name', 'email', 'phone', 'avatar_url', 'department_id', 'is_active'];
    const updates = Object.entries(fields).filter(([k]) => allowed.includes(k));
    if (!updates.length) return null;

    const setClauses = updates.map(([k], i) => `${k} = $${i + 2}`).join(', ');
    const values = [id, ...updates.map(([, v]) => v)];

    const { rows } = await query(
      `UPDATE users SET ${setClauses}, updated_at = NOW()
       WHERE id = $1
       RETURNING id, name, email, role, employee_id, department_id, phone, avatar_url, is_active, created_at, updated_at`,
      values
    );
    return rows[0] ?? null;
  },

  /** Promote a user to a new role (admin only) */
  async promoteRole(id, role) {
    const { rows } = await query(
      `UPDATE users SET role = $2, updated_at = NOW()
       WHERE id = $1
       RETURNING id, name, email, role, employee_id, department_id, phone, avatar_url, is_active, created_at, updated_at`,
      [id, role]
    );
    return rows[0] ?? null;
  },

  /** Deactivate / activate a user */
  async setActive(id, isActive) {
    const { rows } = await query(
      `UPDATE users SET is_active = $2, updated_at = NOW()
       WHERE id = $1
       RETURNING id, name, email, role, employee_id, is_active`,
      [id, isActive]
    );
    return rows[0] ?? null;
  },

  /** Hard-delete a user */
  async delete(id) {
    const { rowCount } = await query('DELETE FROM users WHERE id = $1', [id]);
    return rowCount > 0;
  },
};
