import { query } from '../config/db.js';

export const MaintenanceModel = {
  async findAll({ asset_id, status, priority, raised_by, limit = 20, offset = 0 } = {}) {
    const conditions = [];
    const params = [];
    let p = 1;

    if (asset_id)  { conditions.push(`mr.asset_id = $${p++}`);  params.push(asset_id); }
    if (status)    { conditions.push(`mr.status = $${p++}`);    params.push(status); }
    if (priority)  { conditions.push(`mr.priority = $${p++}`);  params.push(priority); }
    if (raised_by) { conditions.push(`mr.raised_by = $${p++}`); params.push(raised_by); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = await query(
      `SELECT mr.*,
              a.asset_tag, a.name AS asset_name,
              u1.name AS raised_by_name,
              u2.name AS approved_by_name,
              u3.name AS technician_name
       FROM maintenance_requests mr
       LEFT JOIN assets a  ON a.id  = mr.asset_id
       LEFT JOIN users  u1 ON u1.id = mr.raised_by
       LEFT JOIN users  u2 ON u2.id = mr.approved_by
       LEFT JOIN users  u3 ON u3.id = mr.technician_id
       ${where}
       ORDER BY
         CASE mr.priority
           WHEN 'critical' THEN 1 WHEN 'high' THEN 2
           WHEN 'medium' THEN 3 ELSE 4
         END,
         mr.created_at DESC
       LIMIT $${p} OFFSET $${p + 1}`,
      [...params, limit, offset]
    );
    return rows;
  },

  async count({ asset_id, status, priority, raised_by } = {}) {
    const conditions = [];
    const params = [];
    let p = 1;
    if (asset_id)  { conditions.push(`asset_id = $${p++}`);  params.push(asset_id); }
    if (status)    { conditions.push(`status = $${p++}`);    params.push(status); }
    if (priority)  { conditions.push(`priority = $${p++}`);  params.push(priority); }
    if (raised_by) { conditions.push(`raised_by = $${p++}`); params.push(raised_by); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await query(`SELECT COUNT(*) FROM maintenance_requests ${where}`, params);
    return parseInt(rows[0].count, 10);
  },

  async findById(id) {
    const { rows } = await query(
      `SELECT mr.*,
              a.asset_tag, a.name AS asset_name,
              u1.name AS raised_by_name,
              u2.name AS approved_by_name,
              u3.name AS technician_name
       FROM maintenance_requests mr
       LEFT JOIN assets a  ON a.id  = mr.asset_id
       LEFT JOIN users  u1 ON u1.id = mr.raised_by
       LEFT JOIN users  u2 ON u2.id = mr.approved_by
       LEFT JOIN users  u3 ON u3.id = mr.technician_id
       WHERE mr.id = $1 LIMIT 1`,
      [id]
    );
    return rows[0] ?? null;
  },

  async create({ asset_id, raised_by, issue_description, priority = 'medium', photo_url }) {
    const { rows } = await query(
      `INSERT INTO maintenance_requests
         (asset_id, raised_by, issue_description, priority, photo_url, status)
       VALUES ($1,$2,$3,$4,$5,'pending')
       RETURNING *`,
      [asset_id, raised_by, issue_description, priority, photo_url ?? null]
    );
    return rows[0];
  },

  async update(id, fields) {
    const allowed = ['status', 'approved_by', 'technician_id', 'resolution_notes',
      'rejection_reason', 'estimated_cost', 'actual_cost', 'resolved_at', 'photo_url'];
    const updates = Object.entries(fields).filter(([k]) => allowed.includes(k));
    if (!updates.length) return null;

    const setClauses = updates.map(([k], i) => `${k} = $${i + 2}`).join(', ');
    const values = [id, ...updates.map(([, v]) => v)];

    const { rows } = await query(
      `UPDATE maintenance_requests SET ${setClauses}, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      values
    );
    return rows[0] ?? null;
  },
};
