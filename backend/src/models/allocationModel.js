import { query } from '../config/db.js';

export const AllocationModel = {
  async findAll({ asset_id, user_id, status, limit = 20, offset = 0 } = {}) {
    const conditions = [];
    const params = [];
    let p = 1;

    if (asset_id) { conditions.push(`al.asset_id = $${p++}`);              params.push(asset_id); }
    if (user_id)  { conditions.push(`al.allocated_to_user = $${p++}`);     params.push(user_id); }
    if (status)   { conditions.push(`al.status = $${p++}`);                params.push(status); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = await query(
      `SELECT al.*,
              a.asset_tag, a.name AS asset_name, a.condition AS asset_condition,
              u1.name AS allocated_to_name, u1.email AS allocated_to_email,
              u2.name AS allocated_by_name,
              d.name  AS department_name
       FROM allocations al
       LEFT JOIN assets      a  ON a.id  = al.asset_id
       LEFT JOIN users       u1 ON u1.id = al.allocated_to_user
       LEFT JOIN users       u2 ON u2.id = al.allocated_by
       LEFT JOIN departments d  ON d.id  = al.allocated_to_dept
       ${where}
       ORDER BY al.created_at DESC
       LIMIT $${p} OFFSET $${p + 1}`,
      [...params, limit, offset]
    );
    return rows;
  },

  async count({ asset_id, user_id, status } = {}) {
    const conditions = [];
    const params = [];
    let p = 1;
    if (asset_id) { conditions.push(`asset_id = $${p++}`);          params.push(asset_id); }
    if (user_id)  { conditions.push(`allocated_to_user = $${p++}`); params.push(user_id); }
    if (status)   { conditions.push(`status = $${p++}`);            params.push(status); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await query(`SELECT COUNT(*) FROM allocations ${where}`, params);
    return parseInt(rows[0].count, 10);
  },

  async findById(id) {
    const { rows } = await query(
      `SELECT al.*,
              a.asset_tag, a.name AS asset_name,
              u1.name AS allocated_to_name, u1.email AS allocated_to_email,
              u2.name AS allocated_by_name,
              d.name  AS department_name
       FROM allocations al
       LEFT JOIN assets      a  ON a.id  = al.asset_id
       LEFT JOIN users       u1 ON u1.id = al.allocated_to_user
       LEFT JOIN users       u2 ON u2.id = al.allocated_by
       LEFT JOIN departments d  ON d.id  = al.allocated_to_dept
       WHERE al.id = $1 LIMIT 1`,
      [id]
    );
    return rows[0] ?? null;
  },

  /** Get active allocation for an asset */
  async findActiveByAsset(assetId) {
    const { rows } = await query(
      `SELECT al.*,
              u.name AS allocated_to_name, u.email AS allocated_to_email,
              u.employee_id AS allocated_to_employee_id
       FROM allocations al
       LEFT JOIN users u ON u.id = al.allocated_to_user
       WHERE al.asset_id = $1 AND al.status IN ('active','overdue')
       ORDER BY al.created_at DESC LIMIT 1`,
      [assetId]
    );
    return rows[0] ?? null;
  },

  async create({ asset_id, allocated_to_user, allocated_to_dept, allocated_by, expected_return_date }) {
    const { rows } = await query(
      `INSERT INTO allocations
         (asset_id, allocated_to_user, allocated_to_dept, allocated_by, expected_return_date, status)
       VALUES ($1, $2, $3, $4, $5, 'active')
       RETURNING *`,
      [asset_id, allocated_to_user ?? null, allocated_to_dept ?? null, allocated_by,
       expected_return_date ?? null]
    );
    return rows[0];
  },

  async markReturned(id, { condition_on_return, return_notes }) {
    const { rows } = await query(
      `UPDATE allocations
       SET status = 'returned', actual_return_date = CURRENT_DATE,
           condition_on_return = $2, return_notes = $3, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id, condition_on_return ?? null, return_notes ?? null]
    );
    return rows[0] ?? null;
  },

  async markOverdue(id) {
    const { rows } = await query(
      `UPDATE allocations SET status = 'overdue', is_overdue = true, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id]
    );
    return rows[0] ?? null;
  },

  /** Find active allocations past expected_return_date */
  async findOverdueActive() {
    const { rows } = await query(
      `SELECT al.*, a.name AS asset_name, a.asset_tag,
              u.name AS allocated_to_name, u.email AS allocated_to_email
       FROM allocations al
       LEFT JOIN assets a ON a.id = al.asset_id
       LEFT JOIN users  u ON u.id = al.allocated_to_user
       WHERE al.status = 'active'
         AND al.expected_return_date IS NOT NULL
         AND al.expected_return_date < CURRENT_DATE`
    );
    return rows;
  },

  /* ── Transfer Requests ──────────────────────────────────────────── */
  async createTransfer({ asset_id, from_user, to_user, to_dept, requested_by, reason }) {
    const { rows } = await query(
      `INSERT INTO transfer_requests
         (asset_id, from_user, to_user, to_dept, requested_by, reason, status)
       VALUES ($1,$2,$3,$4,$5,$6,'requested')
       RETURNING *`,
      [asset_id, from_user ?? null, to_user ?? null, to_dept ?? null, requested_by, reason ?? null]
    );
    return rows[0];
  },

  async findTransfers({ asset_id, status, user_id, limit = 20, offset = 0 } = {}) {
    const conditions = [];
    const params = [];
    let p = 1;

    if (asset_id) { conditions.push(`tr.asset_id = $${p++}`);              params.push(asset_id); }
    if (status)   { conditions.push(`tr.status = $${p++}`);                params.push(status); }
    if (user_id)  { conditions.push(`(tr.from_user = $${p} OR tr.to_user = $${p} OR tr.requested_by = $${p})`); params.push(user_id); p++; }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = await query(
      `SELECT tr.*,
              a.asset_tag, a.name AS asset_name,
              u1.name AS from_user_name,
              u2.name AS to_user_name,
              u3.name AS requested_by_name,
              u4.name AS approved_by_name,
              d.name  AS to_dept_name
       FROM transfer_requests tr
       LEFT JOIN assets      a  ON a.id  = tr.asset_id
       LEFT JOIN users       u1 ON u1.id = tr.from_user
       LEFT JOIN users       u2 ON u2.id = tr.to_user
       LEFT JOIN users       u3 ON u3.id = tr.requested_by
       LEFT JOIN users       u4 ON u4.id = tr.approved_by
       LEFT JOIN departments d  ON d.id  = tr.to_dept
       ${where}
       ORDER BY tr.created_at DESC
       LIMIT $${p} OFFSET $${p + 1}`,
      [...params, limit, offset]
    );
    return rows;
  },

  async findTransferById(id) {
    const { rows } = await query(
      `SELECT tr.*,
              a.asset_tag, a.name AS asset_name,
              u1.name AS from_user_name,
              u2.name AS to_user_name,
              u3.name AS requested_by_name,
              u4.name AS approved_by_name
       FROM transfer_requests tr
       LEFT JOIN assets a  ON a.id  = tr.asset_id
       LEFT JOIN users  u1 ON u1.id = tr.from_user
       LEFT JOIN users  u2 ON u2.id = tr.to_user
       LEFT JOIN users  u3 ON u3.id = tr.requested_by
       LEFT JOIN users  u4 ON u4.id = tr.approved_by
       WHERE tr.id = $1 LIMIT 1`,
      [id]
    );
    return rows[0] ?? null;
  },

  async updateTransferStatus(id, { status, approved_by, rejection_reason }) {
    const { rows } = await query(
      `UPDATE transfer_requests
       SET status = $2, approved_by = $3, rejection_reason = $4, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id, status, approved_by ?? null, rejection_reason ?? null]
    );
    return rows[0] ?? null;
  },
};
