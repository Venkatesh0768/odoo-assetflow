import { query } from '../config/db.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const ReportController = {
  /** Asset utilization trends – daily snapshot of asset status counts for the last N days */
  async utilizationTrends(req, res, next) {
    try {
      const days = Math.min(parseInt(req.query.days ?? '30', 10), 90);

      /* Daily snapshots: count assets by status for each day in the range
         We use a generate_series to get a row per day, then join allocation events */
      const { rows } = await query(
        `WITH date_series AS (
           SELECT generate_series(
             (NOW() - ($1 || ' days')::INTERVAL)::date,
             NOW()::date,
             '1 day'::INTERVAL
           )::date AS day
         ),
         daily AS (
           SELECT
             d.day,
             COUNT(a.id) FILTER (WHERE a.status = 'allocated')         AS allocated,
             COUNT(a.id) FILTER (WHERE a.status = 'available')         AS available,
             COUNT(a.id) FILTER (WHERE a.status = 'under_maintenance') AS maintenance
           FROM date_series d
           CROSS JOIN assets a
           WHERE a.status NOT IN ('disposed')
           GROUP BY d.day
         )
         SELECT
           to_char(day, 'YYYY-MM-DD') AS date,
           COALESCE(allocated, 0)::int    AS allocated,
           COALESCE(available, 0)::int    AS available,
           COALESCE(maintenance, 0)::int  AS maintenance
         FROM daily
         ORDER BY day ASC`,
        [days]
      );
      ApiResponse.success(res, 200, rows, 'Utilization trends retrieved');
    } catch (err) { next(err); }
  },

  /** Maintenance frequency by asset and category */
  async maintenanceFrequency(req, res, next) {
    try {
      const { rows: byAsset } = await query(
        `SELECT a.asset_tag, a.name AS asset_name,
                COUNT(mr.id)                                  AS total_requests,
                COUNT(mr.id) FILTER (WHERE mr.status = 'resolved') AS resolved,
                AVG(EXTRACT(EPOCH FROM (mr.resolved_at - mr.created_at))/3600)::NUMERIC(10,2) AS avg_resolution_hours
         FROM assets a
         LEFT JOIN maintenance_requests mr ON mr.asset_id = a.id
         GROUP BY a.id, a.asset_tag, a.name
         HAVING COUNT(mr.id) > 0
         ORDER BY total_requests DESC
         LIMIT 20`
      );

      const { rows: byCategory } = await query(
        `SELECT c.name AS category_name, COUNT(mr.id) AS total_requests,
                COUNT(mr.id) FILTER (WHERE mr.status='resolved') AS resolved
         FROM asset_categories c
         JOIN assets a ON a.category_id = c.id
         JOIN maintenance_requests mr ON mr.asset_id = a.id
         GROUP BY c.id, c.name
         ORDER BY total_requests DESC`
      );

      ApiResponse.success(res, 200, { by_asset: byAsset, by_category: byCategory },
        'Maintenance frequency retrieved');
    } catch (err) { next(err); }
  },

  /** Assets due for maintenance or nearing retirement — returns a flat unified list */
  async maintenanceDue(req, res, next) {
    try {
      const { rows: poorCondition } = await query(
        `SELECT
           a.id                AS asset_id,
           a.asset_tag         AS tag,
           a.name              AS asset_name,
           a.condition,
           a.status,
           a.location,
           'Poor/Fair condition — inspect soon' AS reason,
           NULL::date          AS due_date
         FROM assets a
         WHERE a.status NOT IN ('retired','disposed','lost')
           AND a.condition IN ('fair','poor')
         ORDER BY a.condition DESC
         LIMIT 20`
      );

      const { rows: agingAssets } = await query(
        `SELECT
           a.id                AS asset_id,
           a.asset_tag         AS tag,
           a.name              AS asset_name,
           a.condition,
           a.status,
           a.acquisition_date,
           EXTRACT(YEAR FROM AGE(NOW(), a.acquisition_date))::INT AS age_years,
           'Nearing retirement (' || EXTRACT(YEAR FROM AGE(NOW(), a.acquisition_date))::INT || ' yrs old)' AS reason,
           NULL::date AS due_date
         FROM assets a
         WHERE a.acquisition_date IS NOT NULL
           AND a.acquisition_date < NOW() - INTERVAL '4 years'
           AND a.status NOT IN ('retired','disposed','lost')
         ORDER BY a.acquisition_date ASC
         LIMIT 20`
      );

      /* Deduplicate by asset_id, favour agingAssets reason if overlap */
      const seen = new Set();
      const combined = [...poorCondition, ...agingAssets].filter((r) => {
        if (seen.has(r.asset_id)) return false;
        seen.add(r.asset_id);
        return true;
      });

      ApiResponse.success(res, 200, { maintenance_due: combined }, 'Maintenance due report retrieved');
    } catch (err) { next(err); }
  },

  /** Department-wise allocation summary */
  async departmentAllocationSummary(req, res, next) {
    try {
      const { rows } = await query(
        `SELECT d.id, d.name AS department_name,
                COUNT(DISTINCT a.id)                                    AS total_assets,
                COUNT(DISTINCT a.id) FILTER (WHERE a.status='available')   AS available,
                COUNT(DISTINCT a.id) FILTER (WHERE a.status='allocated')   AS allocated,
                COUNT(DISTINCT a.id) FILTER (WHERE a.status='under_maintenance') AS under_maintenance,
                COUNT(DISTINCT al.id) FILTER (WHERE al.status='active')    AS active_allocations,
                COUNT(DISTINCT al.id) FILTER (WHERE al.is_overdue=true)    AS overdue_allocations
         FROM departments d
         LEFT JOIN assets a      ON a.department_id = d.id
         LEFT JOIN allocations al ON al.asset_id = a.id
         WHERE d.status = 'active'
         GROUP BY d.id, d.name
         ORDER BY total_assets DESC`
      );
      ApiResponse.success(res, 200, rows, 'Department allocation summary retrieved');
    } catch (err) { next(err); }
  },

  /** Quick summary stats for the reports header */
  async summary(req, res, next) {
    try {
      const { rows: [stats] } = await query(
        `SELECT
           COUNT(*)                                            AS total_assets,
           COUNT(*) FILTER (WHERE status='available')         AS available,
           COUNT(*) FILTER (WHERE status='allocated')         AS allocated,
           COUNT(*) FILTER (WHERE status='under_maintenance') AS under_maintenance,
           COUNT(*) FILTER (WHERE status='retired')           AS retired
         FROM assets WHERE status != 'disposed'`
      );
      const { rows: [maint] } = await query(
        `SELECT
           COUNT(*) FILTER (WHERE status='pending')    AS pending_maintenance,
           COUNT(*) FILTER (WHERE status='in_progress') AS in_progress_maintenance,
           COUNT(*) FILTER (WHERE status='resolved')   AS resolved_this_month
         FROM maintenance_requests
         WHERE status != 'rejected'`
      );
      const { rows: [bookings] } = await query(
        `SELECT COUNT(*) FILTER (WHERE status IN ('upcoming','ongoing')) AS active_bookings
         FROM bookings`
      );
      ApiResponse.success(res, 200, {
        assets: {
          total:             parseInt(stats.total_assets, 10),
          available:         parseInt(stats.available, 10),
          allocated:         parseInt(stats.allocated, 10),
          under_maintenance: parseInt(stats.under_maintenance, 10),
          retired:           parseInt(stats.retired, 10),
          utilization_rate:  stats.total_assets > 0
            ? Math.round((stats.allocated / stats.total_assets) * 100)
            : 0,
        },
        maintenance: {
          pending:     parseInt(maint.pending_maintenance, 10),
          in_progress: parseInt(maint.in_progress_maintenance, 10),
        },
        active_bookings: parseInt(bookings.active_bookings, 10),
      }, 'Report summary retrieved');
    } catch (err) { next(err); }
  },

  /** Booking heatmap – bookings by hour/day */
  async bookingHeatmap(req, res, next) {
    try {
      const { asset_id } = req.query;
      const params = [];
      let assetFilter = '';
      if (asset_id) {
        params.push(asset_id);
        assetFilter = `AND asset_id = $1`;
      }

      const { rows } = await query(
        `SELECT
           EXTRACT(DOW  FROM start_time)::INT AS day,
           EXTRACT(HOUR FROM start_time)::INT AS hour,
           COUNT(*)::INT                       AS count
         FROM bookings
         WHERE status NOT IN ('cancelled')
           ${assetFilter}
         GROUP BY 1, 2
         ORDER BY 1, 2`,
        params
      );
      ApiResponse.success(res, 200, rows, 'Booking heatmap data retrieved');
    } catch (err) { next(err); }
  },

  /** Most-used vs idle assets */
  async assetUsage(req, res, next) {
    try {
      const idleDays = Math.max(parseInt(req.query.idle_days ?? '45', 10), 1);

      const { rows: mostUsed } = await query(
        `SELECT
           a.id                                  AS asset_id,
           a.asset_tag                           AS tag,
           a.name                                AS asset_name,
           a.status,
           c.name                                AS category,
           COUNT(DISTINCT al.id)                 AS allocation_count,
           COUNT(DISTINCT b.id)                  AS booking_count,
           (COUNT(DISTINCT al.id) + COUNT(DISTINCT b.id)) AS usage_count,
           MAX(GREATEST(al.created_at, b.created_at))     AS last_used
         FROM assets a
         LEFT JOIN asset_categories c  ON c.id  = a.category_id
         LEFT JOIN allocations      al ON al.asset_id = a.id
         LEFT JOIN bookings         b  ON b.asset_id  = a.id AND b.status != 'cancelled'
         GROUP BY a.id, a.asset_tag, a.name, a.status, c.name
         HAVING (COUNT(DISTINCT al.id) + COUNT(DISTINCT b.id)) > 0
         ORDER BY usage_count DESC
         LIMIT 10`,
      );

      const { rows: idle } = await query(
        `SELECT
           a.id                 AS asset_id,
           a.asset_tag          AS tag,
           a.name               AS asset_name,
           a.status,
           c.name               AS category,
           a.acquisition_date,
           EXTRACT(DAY FROM NOW() - COALESCE(
             (SELECT MAX(greatest(al2.created_at, '1970-01-01'))
              FROM allocations al2 WHERE al2.asset_id = a.id),
             a.created_at
           ))::INT              AS idle_days,
           0                    AS usage_count
         FROM assets a
         LEFT JOIN asset_categories c ON c.id = a.category_id
         WHERE a.status = 'available'
           AND a.status NOT IN ('disposed','retired','lost')
           AND EXTRACT(DAY FROM NOW() - COALESCE(
             (SELECT MAX(al2.created_at) FROM allocations al2 WHERE al2.asset_id = a.id),
             a.created_at
           )) >= $1
         ORDER BY idle_days DESC
         LIMIT 10`,
        [idleDays]
      );

      ApiResponse.success(res, 200, { most_used: mostUsed, idle }, 'Asset usage report retrieved');
    } catch (err) { next(err); }
  },
};
