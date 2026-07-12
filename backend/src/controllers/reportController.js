import { query } from '../config/db.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const ReportController = {
  /** Asset utilization trends – allocation rates by month */
  async utilizationTrends(req, res, next) {
    try {
      const { months = 6 } = req.query;
      const { rows } = await query(
        `SELECT
           TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
           COUNT(*) AS total_allocations,
           COUNT(*) FILTER (WHERE status = 'returned') AS returned,
           COUNT(*) FILTER (WHERE status IN ('active','overdue')) AS active
         FROM allocations
         WHERE created_at >= NOW() - INTERVAL '1 month' * $1::int
         GROUP BY 1
         ORDER BY 1 ASC`,
        [parseInt(months, 10)]
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

  /** Assets due for maintenance or nearing retirement */
  async maintenanceDue(req, res, next) {
    try {
      /* Assets with no maintenance in last 90 days but have had allocations */
      const { rows: overdue } = await query(
        `SELECT a.id, a.asset_tag, a.name, a.condition, a.status, a.location,
                MAX(mr.created_at) AS last_maintenance
         FROM assets a
         LEFT JOIN maintenance_requests mr ON mr.asset_id = a.id AND mr.status = 'resolved'
         WHERE a.status NOT IN ('retired','disposed','lost')
           AND a.condition IN ('fair','poor')
         GROUP BY a.id, a.asset_tag, a.name, a.condition, a.status, a.location
         ORDER BY a.condition DESC, last_maintenance ASC NULLS FIRST
         LIMIT 50`
      );

      /* Assets in allocated/under_maintenance for > 180 days (nearing retirement) */
      const { rows: retiring } = await query(
        `SELECT a.id, a.asset_tag, a.name, a.condition, a.status,
                a.acquisition_date,
                EXTRACT(YEAR FROM AGE(NOW(), a.acquisition_date))::INT AS age_years
         FROM assets a
         WHERE a.acquisition_date IS NOT NULL
           AND a.acquisition_date < NOW() - INTERVAL '5 years'
           AND a.status NOT IN ('retired','disposed','lost')
         ORDER BY a.acquisition_date ASC
         LIMIT 30`
      );

      ApiResponse.success(res, 200, { maintenance_due: overdue, nearing_retirement: retiring },
        'Maintenance due report retrieved');
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

  /** Resource booking heatmap – bookings by hour/day */
  async bookingHeatmap(req, res, next) {
    try {
      const { asset_id } = req.query;
      const assetFilter = asset_id ? `AND asset_id = '${asset_id}'` : '';

      const { rows } = await query(
        `SELECT
           EXTRACT(DOW FROM start_time)::INT  AS day_of_week,
           EXTRACT(HOUR FROM start_time)::INT AS hour_of_day,
           COUNT(*) AS booking_count
         FROM bookings
         WHERE status NOT IN ('cancelled')
           ${assetFilter}
         GROUP BY 1, 2
         ORDER BY 1, 2`
      );
      ApiResponse.success(res, 200, rows, 'Booking heatmap data retrieved');
    } catch (err) { next(err); }
  },

  /** Most-used vs idle assets */
  async assetUsage(req, res, next) {
    try {
      const { rows: mostUsed } = await query(
        `SELECT a.id, a.asset_tag, a.name, a.status,
                c.name AS category_name,
                COUNT(al.id) AS allocation_count,
                COUNT(b.id)  AS booking_count,
                COUNT(al.id) + COUNT(b.id) AS total_usage
         FROM assets a
         LEFT JOIN asset_categories c  ON c.id  = a.category_id
         LEFT JOIN allocations      al ON al.asset_id = a.id
         LEFT JOIN bookings         b  ON b.asset_id  = a.id AND b.status != 'cancelled'
         GROUP BY a.id, a.asset_tag, a.name, a.status, c.name
         ORDER BY total_usage DESC
         LIMIT 20`
      );

      const { rows: idle } = await query(
        `SELECT a.id, a.asset_tag, a.name, a.status,
                c.name AS category_name,
                a.acquisition_date,
                a.acquisition_cost
         FROM assets a
         LEFT JOIN asset_categories c ON c.id = a.category_id
         WHERE a.status = 'available'
           AND NOT EXISTS (
             SELECT 1 FROM allocations WHERE asset_id = a.id AND created_at > NOW() - INTERVAL '90 days'
           )
           AND NOT EXISTS (
             SELECT 1 FROM bookings WHERE asset_id = a.id AND created_at > NOW() - INTERVAL '90 days'
           )
         ORDER BY a.acquisition_date ASC NULLS LAST
         LIMIT 20`
      );

      ApiResponse.success(res, 200, { most_used: mostUsed, idle }, 'Asset usage report retrieved');
    } catch (err) { next(err); }
  },
};
