import { query } from '../config/db.js';

export const NotificationModel = {
  async findAll({ user_id, type, is_read, limit = 20, offset = 0 } = {}) {
    const conditions = [`n.user_id = $1`];
    const params = [user_id];
    let p = 2;

    if (type !== undefined)    { conditions.push(`n.type = $${p++}`);    params.push(type); }
    if (is_read !== undefined) { conditions.push(`n.is_read = $${p++}`); params.push(is_read); }

    const { rows } = await query(
      `SELECT * FROM notifications n
       WHERE ${conditions.join(' AND ')}
       ORDER BY n.created_at DESC
       LIMIT $${p} OFFSET $${p + 1}`,
      [...params, limit, offset]
    );
    return rows;
  },

  async count({ user_id, type, is_read } = {}) {
    const conditions = [`user_id = $1`];
    const params = [user_id];
    let p = 2;
    if (type !== undefined)    { conditions.push(`type = $${p++}`);    params.push(type); }
    if (is_read !== undefined) { conditions.push(`is_read = $${p++}`); params.push(is_read); }
    const { rows } = await query(
      `SELECT COUNT(*) FROM notifications WHERE ${conditions.join(' AND ')}`, params
    );
    return parseInt(rows[0].count, 10);
  },

  async create({ user_id, type, title, message, reference_type, reference_id }) {
    const { rows } = await query(
      `INSERT INTO notifications (user_id, type, title, message, reference_type, reference_id)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [user_id, type, title, message, reference_type ?? null, reference_id ?? null]
    );
    return rows[0];
  },

  async markRead(id, userId) {
    const { rows } = await query(
      `UPDATE notifications SET is_read = true
       WHERE id = $1 AND user_id = $2 RETURNING *`,
      [id, userId]
    );
    return rows[0] ?? null;
  },

  async markAllRead(userId) {
    const { rowCount } = await query(
      `UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false`,
      [userId]
    );
    return rowCount;
  },

  async countUnread(userId) {
    const { rows } = await query(
      `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false`,
      [userId]
    );
    return parseInt(rows[0].count, 10);
  },

  async delete(id, userId) {
    const { rowCount } = await query(
      `DELETE FROM notifications WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    return rowCount > 0;
  },
};
