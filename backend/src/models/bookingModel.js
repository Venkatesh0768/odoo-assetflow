import { query } from '../config/db.js';

export const BookingModel = {
  async findAll({ asset_id, user_id, status, limit = 20, offset = 0 } = {}) {
    const conditions = [];
    const params = [];
    let p = 1;

    if (asset_id) { conditions.push(`b.asset_id = $${p++}`);   params.push(asset_id); }
    if (user_id)  { conditions.push(`b.booked_by = $${p++}`);  params.push(user_id); }
    if (status)   { conditions.push(`b.status = $${p++}`);     params.push(status); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = await query(
      `SELECT b.*,
              a.asset_tag, a.name AS asset_name,
              u.name AS booked_by_name, u.email AS booked_by_email,
              d.name AS department_name
       FROM bookings b
       LEFT JOIN assets      a ON a.id = b.asset_id
       LEFT JOIN users       u ON u.id = b.booked_by
       LEFT JOIN departments d ON d.id = b.department_id
       ${where}
       ORDER BY b.start_time ASC
       LIMIT $${p} OFFSET $${p + 1}`,
      [...params, limit, offset]
    );
    return rows;
  },

  async count({ asset_id, user_id, status } = {}) {
    const conditions = [];
    const params = [];
    let p = 1;
    if (asset_id) { conditions.push(`asset_id = $${p++}`);  params.push(asset_id); }
    if (user_id)  { conditions.push(`booked_by = $${p++}`); params.push(user_id); }
    if (status)   { conditions.push(`status = $${p++}`);    params.push(status); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await query(`SELECT COUNT(*) FROM bookings ${where}`, params);
    return parseInt(rows[0].count, 10);
  },

  async findById(id) {
    const { rows } = await query(
      `SELECT b.*,
              a.asset_tag, a.name AS asset_name,
              u.name AS booked_by_name, u.email AS booked_by_email,
              d.name AS department_name
       FROM bookings b
       LEFT JOIN assets      a ON a.id = b.asset_id
       LEFT JOIN users       u ON u.id = b.booked_by
       LEFT JOIN departments d ON d.id = b.department_id
       WHERE b.id = $1 LIMIT 1`,
      [id]
    );
    return rows[0] ?? null;
  },

  /** Check for overlapping bookings (exclusive end, so end = start is ok) */
  async findOverlapping(assetId, startTime, endTime, excludeId = null) {
    const params = [assetId, startTime, endTime];
    let excludeClause = '';
    if (excludeId) {
      params.push(excludeId);
      excludeClause = `AND id != $${params.length}`;
    }

    const { rows } = await query(
      `SELECT * FROM bookings
       WHERE asset_id = $1
         AND status NOT IN ('cancelled','completed')
         AND start_time < $3
         AND end_time > $2
         ${excludeClause}`,
      params
    );
    return rows;
  },

  async create({ asset_id, booked_by, department_id, start_time, end_time, purpose }) {
    const { rows } = await query(
      `INSERT INTO bookings (asset_id, booked_by, department_id, start_time, end_time, purpose, status)
       VALUES ($1,$2,$3,$4,$5,$6,'upcoming')
       RETURNING *`,
      [asset_id, booked_by, department_id ?? null, start_time, end_time, purpose ?? null]
    );
    return rows[0];
  },

  async update(id, { start_time, end_time, purpose, department_id }) {
    const { rows } = await query(
      `UPDATE bookings
       SET start_time = COALESCE($2, start_time),
           end_time   = COALESCE($3, end_time),
           purpose    = COALESCE($4, purpose),
           department_id = COALESCE($5, department_id),
           updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id, start_time ?? null, end_time ?? null, purpose ?? null, department_id ?? null]
    );
    return rows[0] ?? null;
  },

  async cancel(id, cancelledBy, reason) {
    const { rows } = await query(
      `UPDATE bookings
       SET status = 'cancelled', cancelled_by = $2, cancellation_reason = $3, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id, cancelledBy, reason ?? null]
    );
    return rows[0] ?? null;
  },

  async setStatus(id, status) {
    const { rows } = await query(
      `UPDATE bookings SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, status]
    );
    return rows[0] ?? null;
  },

  /** Calendar view: all bookings for an asset in a date range */
  async getCalendar(assetId, from, to) {
    const { rows } = await query(
      `SELECT b.*, u.name AS booked_by_name, u.email AS booked_by_email
       FROM bookings b
       LEFT JOIN users u ON u.id = b.booked_by
       WHERE b.asset_id = $1
         AND b.status NOT IN ('cancelled')
         AND b.start_time >= $2
         AND b.end_time   <= $3
       ORDER BY b.start_time ASC`,
      [assetId, from, to]
    );
    return rows;
  },
};
