import { query } from '../config/db.js';

export const AssetModel = {
  async findAll({ status, category_id, department_id, location, search, is_bookable, limit = 20, offset = 0 } = {}) {
    const conditions = [];
    const params = [];
    let p = 1;

    if (status)        { conditions.push(`a.status = $${p++}`);        params.push(status); }
    if (category_id)   { conditions.push(`a.category_id = $${p++}`);   params.push(category_id); }
    if (department_id) { conditions.push(`a.department_id = $${p++}`); params.push(department_id); }
    if (location)      { conditions.push(`a.location ILIKE $${p++}`);  params.push(`%${location}%`); }
    if (is_bookable !== undefined) {
      conditions.push(`a.is_bookable = $${p++}`);
      params.push(is_bookable);
    }
    if (search) {
      conditions.push(
        `(a.name ILIKE $${p} OR a.asset_tag ILIKE $${p} OR a.serial_number ILIKE $${p})`
      );
      params.push(`%${search}%`);
      p++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = await query(
      `SELECT a.*,
              c.name AS category_name,
              d.name AS department_name,
              u.name AS created_by_name
       FROM assets a
       LEFT JOIN asset_categories c ON c.id = a.category_id
       LEFT JOIN departments d ON d.id = a.department_id
       LEFT JOIN users u ON u.id = a.created_by
       ${where}
       ORDER BY a.created_at DESC
       LIMIT $${p} OFFSET $${p + 1}`,
      [...params, limit, offset]
    );
    return rows;
  },

  async count({ status, category_id, department_id, location, search, is_bookable } = {}) {
    const conditions = [];
    const params = [];
    let p = 1;

    if (status)        { conditions.push(`status = $${p++}`);        params.push(status); }
    if (category_id)   { conditions.push(`category_id = $${p++}`);   params.push(category_id); }
    if (department_id) { conditions.push(`department_id = $${p++}`); params.push(department_id); }
    if (location)      { conditions.push(`location ILIKE $${p++}`);  params.push(`%${location}%`); }
    if (is_bookable !== undefined) { conditions.push(`is_bookable = $${p++}`); params.push(is_bookable); }
    if (search) {
      conditions.push(`(name ILIKE $${p} OR asset_tag ILIKE $${p} OR serial_number ILIKE $${p})`);
      params.push(`%${search}%`);
      p++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await query(`SELECT COUNT(*) FROM assets ${where}`, params);
    return parseInt(rows[0].count, 10);
  },

  async findById(id) {
    const { rows } = await query(
      `SELECT a.*,
              c.name AS category_name,
              d.name AS department_name,
              u.name AS created_by_name
       FROM assets a
       LEFT JOIN asset_categories c ON c.id = a.category_id
       LEFT JOIN departments d ON d.id = a.department_id
       LEFT JOIN users u ON u.id = a.created_by
       WHERE a.id = $1 LIMIT 1`,
      [id]
    );
    return rows[0] ?? null;
  },

  async findByTag(tag) {
    const { rows } = await query(
      `SELECT * FROM assets WHERE asset_tag = $1 LIMIT 1`,
      [tag]
    );
    return rows[0] ?? null;
  },

  async generateTag() {
    const { rows } = await query(`SELECT nextval('asset_tag_seq') AS n`);
    return `AF-${String(rows[0].n).padStart(4, '0')}`;
  },

  async create(data) {
    const tag = await AssetModel.generateTag();
    const {
      name, category_id, serial_number, acquisition_date, acquisition_cost,
      condition = 'good', status = 'available', location, department_id,
      is_bookable = false, photo_url, documents_url, custom_fields = {},
      notes, created_by,
    } = data;

    const { rows } = await query(
      `INSERT INTO assets
         (asset_tag, name, category_id, serial_number, acquisition_date, acquisition_cost,
          condition, status, location, department_id, is_bookable, photo_url, documents_url,
          custom_fields, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING *`,
      [tag, name, category_id ?? null, serial_number ?? null, acquisition_date ?? null,
       acquisition_cost ?? null, condition, status, location ?? null, department_id ?? null,
       is_bookable, photo_url ?? null, documents_url ?? null, JSON.stringify(custom_fields),
       notes ?? null, created_by]
    );
    return rows[0];
  },

  async update(id, fields) {
    const allowed = ['name', 'category_id', 'serial_number', 'acquisition_date', 'acquisition_cost',
      'condition', 'status', 'location', 'department_id', 'is_bookable', 'photo_url',
      'documents_url', 'custom_fields', 'notes'];
    const updates = Object.entries(fields).filter(([k]) => allowed.includes(k));
    if (!updates.length) return null;

    const values = updates.map(([k, v]) =>
      k === 'custom_fields' && typeof v === 'object' ? JSON.stringify(v) : v
    );
    const setClauses = updates.map(([k], i) => `${k} = $${i + 2}`).join(', ');

    const { rows } = await query(
      `UPDATE assets SET ${setClauses}, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return rows[0] ?? null;
  },

  async setStatus(id, status) {
    const { rows } = await query(
      `UPDATE assets SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, status]
    );
    return rows[0] ?? null;
  },

  /** Full asset history: allocations + maintenance */
  async getHistory(assetId) {
    const allocations = (await query(
      `SELECT al.*, u1.name AS allocated_to_name, u2.name AS allocated_by_name
       FROM allocations al
       LEFT JOIN users u1 ON u1.id = al.allocated_to_user
       LEFT JOIN users u2 ON u2.id = al.allocated_by
       WHERE al.asset_id = $1 ORDER BY al.created_at DESC`,
      [assetId]
    )).rows;

    const maintenance = (await query(
      `SELECT mr.*, u1.name AS raised_by_name, u2.name AS technician_name
       FROM maintenance_requests mr
       LEFT JOIN users u1 ON u1.id = mr.raised_by
       LEFT JOIN users u2 ON u2.id = mr.technician_id
       WHERE mr.asset_id = $1 ORDER BY mr.created_at DESC`,
      [assetId]
    )).rows;

    return { allocations, maintenance };
  },
};
