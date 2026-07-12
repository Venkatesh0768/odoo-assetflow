import { query } from '../config/db.js';

export const AuditModel = {
  /* ── Audit Cycles ──────────────────────────────────────────────── */
  async findAllCycles({ status, limit = 20, offset = 0 } = {}) {
    const conditions = [];
    const params = [];
    let p = 1;

    if (status) { conditions.push(`ac.status = $${p++}`); params.push(status); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = await query(
      `SELECT ac.*,
              u1.name AS created_by_name,
              u2.name AS closed_by_name,
              d.name  AS scope_department_name,
              (SELECT json_agg(json_build_object('id', au.auditor_id, 'name', usr.name, 'email', usr.email))
               FROM audit_auditors au
               JOIN users usr ON usr.id = au.auditor_id
               WHERE au.audit_cycle_id = ac.id) AS auditors
       FROM audit_cycles ac
       LEFT JOIN users       u1 ON u1.id = ac.created_by
       LEFT JOIN users       u2 ON u2.id = ac.closed_by
       LEFT JOIN departments d  ON d.id  = ac.scope_department_id
       ${where}
       ORDER BY ac.created_at DESC
       LIMIT $${p} OFFSET $${p + 1}`,
      [...params, limit, offset]
    );
    return rows;
  },

  async findCycleById(id) {
    const { rows } = await query(
      `SELECT ac.*,
              u1.name AS created_by_name,
              u2.name AS closed_by_name,
              d.name  AS scope_department_name,
              (SELECT json_agg(json_build_object('id', au.auditor_id, 'name', usr.name, 'email', usr.email))
               FROM audit_auditors au
               JOIN users usr ON usr.id = au.auditor_id
               WHERE au.audit_cycle_id = ac.id) AS auditors
       FROM audit_cycles ac
       LEFT JOIN users       u1 ON u1.id = ac.created_by
       LEFT JOIN users       u2 ON u2.id = ac.closed_by
       LEFT JOIN departments d  ON d.id  = ac.scope_department_id
       WHERE ac.id = $1 LIMIT 1`,
      [id]
    );
    return rows[0] ?? null;
  },

  async createCycle({ title, scope_type, scope_department_id, scope_location, start_date, end_date, created_by }) {
    const { rows } = await query(
      `INSERT INTO audit_cycles
         (title, scope_type, scope_department_id, scope_location, start_date, end_date, created_by, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'active')
       RETURNING *`,
      [title, scope_type, scope_department_id ?? null, scope_location ?? null, start_date, end_date, created_by]
    );
    return rows[0];
  },

  async updateCycle(id, fields) {
    const allowed = ['title', 'start_date', 'end_date', 'status', 'closed_by', 'closed_at',
      'total_assets', 'verified_count', 'missing_count', 'damaged_count'];
    const updates = Object.entries(fields).filter(([k]) => allowed.includes(k));
    if (!updates.length) return null;

    const setClauses = updates.map(([k], i) => `${k} = $${i + 2}`).join(', ');
    const values = [id, ...updates.map(([, v]) => v)];

    const { rows } = await query(
      `UPDATE audit_cycles SET ${setClauses}, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      values
    );
    return rows[0] ?? null;
  },

  /* ── Auditors ───────────────────────────────────────────────────── */
  async assignAuditor(auditCycleId, auditorId) {
    const { rows } = await query(
      `INSERT INTO audit_auditors (audit_cycle_id, auditor_id)
       VALUES ($1, $2)
       ON CONFLICT (audit_cycle_id, auditor_id) DO NOTHING
       RETURNING *`,
      [auditCycleId, auditorId]
    );
    return rows[0];
  },

  async removeAuditor(auditCycleId, auditorId) {
    const { rowCount } = await query(
      `DELETE FROM audit_auditors WHERE audit_cycle_id = $1 AND auditor_id = $2`,
      [auditCycleId, auditorId]
    );
    return rowCount > 0;
  },

  /* ── Audit Items ────────────────────────────────────────────────── */
  async findItems(auditCycleId, { verification_status } = {}) {
    const conditions = [`ai.audit_cycle_id = $1`];
    const params = [auditCycleId];
    let p = 2;

    if (verification_status) {
      conditions.push(`ai.verification_status = $${p++}`);
      params.push(verification_status);
    }

    const { rows } = await query(
      `SELECT ai.*,
              a.asset_tag, a.name AS asset_name, a.location AS current_location,
              a.status AS current_status,
              u.name AS auditor_name
       FROM audit_items ai
       LEFT JOIN assets a ON a.id = ai.asset_id
       LEFT JOIN users  u ON u.id = ai.auditor_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY ai.created_at ASC`,
      params
    );
    return rows;
  },

  async findItemById(id) {
    const { rows } = await query(
      `SELECT ai.*,
              a.asset_tag, a.name AS asset_name,
              u.name AS auditor_name
       FROM audit_items ai
       LEFT JOIN assets a ON a.id = ai.asset_id
       LEFT JOIN users  u ON u.id = ai.auditor_id
       WHERE ai.id = $1 LIMIT 1`,
      [id]
    );
    return rows[0] ?? null;
  },

  async addItem({ audit_cycle_id, asset_id, expected_location }) {
    const { rows } = await query(
      `INSERT INTO audit_items (audit_cycle_id, asset_id, expected_location, verification_status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING *`,
      [audit_cycle_id, asset_id, expected_location ?? null]
    );
    return rows[0];
  },

  async verifyItem(id, { verification_status, auditor_id, notes }) {
    const { rows } = await query(
      `UPDATE audit_items
       SET verification_status = $2, auditor_id = $3, notes = $4, verified_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id, verification_status, auditor_id, notes ?? null]
    );
    return rows[0] ?? null;
  },

  /** Discrepancy report – items not verified (missing or damaged) */
  async getDiscrepancyReport(auditCycleId) {
    const { rows } = await query(
      `SELECT ai.*,
              a.asset_tag, a.name AS asset_name, a.location AS current_location,
              a.department_id,
              d.name AS department_name,
              u.name AS auditor_name
       FROM audit_items ai
       LEFT JOIN assets      a ON a.id  = ai.asset_id
       LEFT JOIN departments d ON d.id  = a.department_id
       LEFT JOIN users       u ON u.id  = ai.auditor_id
       WHERE ai.audit_cycle_id = $1
         AND ai.verification_status IN ('missing','damaged')
       ORDER BY ai.verification_status, a.asset_tag`,
      [auditCycleId]
    );
    return rows;
  },

  /** Get asset IDs marked as missing in a cycle */
  async getMissingAssetIds(auditCycleId) {
    const { rows } = await query(
      `SELECT asset_id FROM audit_items
       WHERE audit_cycle_id = $1 AND verification_status = 'missing'`,
      [auditCycleId]
    );
    return rows.map(r => r.asset_id);
  },

  async getItemCounts(auditCycleId) {
    const { rows } = await query(
      `SELECT
         COUNT(*) FILTER (WHERE true) AS total,
         COUNT(*) FILTER (WHERE verification_status = 'verified') AS verified,
         COUNT(*) FILTER (WHERE verification_status = 'missing') AS missing,
         COUNT(*) FILTER (WHERE verification_status = 'damaged') AS damaged
       FROM audit_items WHERE audit_cycle_id = $1`,
      [auditCycleId]
    );
    return rows[0];
  },
};
