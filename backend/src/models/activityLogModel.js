import { query } from '../config/db.js';

export const ActivityLogModel = {
  async log({ user_id, action, entity_type, entity_id, description, metadata = {}, ip_address }) {
    const { rows } = await query(
      `INSERT INTO activity_logs
         (user_id, action, entity_type, entity_id, description, metadata, ip_address)
       VALUES ($1,$2,$3,$4,$5,$6,$7::inet)
       RETURNING *`,
      [user_id ?? null, action, entity_type ?? null, entity_id ?? null,
       description ?? null, JSON.stringify(metadata), ip_address ?? null]
    );
    return rows[0];
  },

  async findAll({ user_id, entity_type, entity_id, limit = 50, offset = 0 } = {}) {
    const conditions = [];
    const params = [];
    let p = 1;

    if (user_id)     { conditions.push(`al.user_id = $${p++}`);     params.push(user_id); }
    if (entity_type) { conditions.push(`al.entity_type = $${p++}`); params.push(entity_type); }
    if (entity_id)   { conditions.push(`al.entity_id = $${p++}`);   params.push(entity_id); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = await query(
      `SELECT al.id, al.user_id, al.action, al.entity_type AS entity, al.entity_id, 
              al.description AS details, al.created_at AS "createdAt", al.metadata, al.ip_address,
              u.name AS user_name, u.email AS user_email, u.role AS user_role,
              u.id AS "performed_by"
       FROM activity_logs al
       LEFT JOIN users u ON u.id = al.user_id
       ${where}
       ORDER BY al.created_at DESC
       LIMIT $${p} OFFSET $${p + 1}`,
      [...params, limit, offset]
    );
    return rows;
  },

  async count({ user_id, entity_type, entity_id } = {}) {
    const conditions = [];
    const params = [];
    let p = 1;
    if (user_id)     { conditions.push(`user_id = $${p++}`);     params.push(user_id); }
    if (entity_type) { conditions.push(`entity_type = $${p++}`); params.push(entity_type); }
    if (entity_id)   { conditions.push(`entity_id = $${p++}`);   params.push(entity_id); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await query(`SELECT COUNT(*) FROM activity_logs ${where}`, params);
    return parseInt(rows[0].count, 10);
  },
};
