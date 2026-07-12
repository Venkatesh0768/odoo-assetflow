import { query } from '../config/db.js';
import { ActivityLogModel } from '../models/activityLogModel.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const DashboardController = {
  async getKPIs(req, res, next) {
    try {
      const [
        { rows: [assetStats] },
        { rows: [maintenanceToday] },
        { rows: [bookingStats] },
        { rows: [transferStats] },
        { rows: [allocationStats] },
      ] = await Promise.all([
        query(`SELECT
          COUNT(*) FILTER (WHERE status = 'available')          AS assets_available,
          COUNT(*) FILTER (WHERE status = 'allocated')          AS assets_allocated,
          COUNT(*) FILTER (WHERE status = 'under_maintenance')  AS assets_under_maintenance,
          COUNT(*) FILTER (WHERE status = 'retired')            AS assets_retired,
          COUNT(*) FILTER (WHERE status = 'lost')               AS assets_lost,
          COUNT(*)                                              AS total_assets
        FROM assets WHERE status NOT IN ('disposed')`),

        query(`SELECT
          COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) AS raised_today,
          COUNT(*) FILTER (WHERE status = 'pending')              AS pending,
          COUNT(*) FILTER (WHERE status = 'approved')             AS approved,
          COUNT(*) FILTER (WHERE status = 'in_progress')          AS in_progress
        FROM maintenance_requests`),

        query(`SELECT
          COUNT(*) FILTER (WHERE status = 'upcoming') AS upcoming_bookings,
          COUNT(*) FILTER (WHERE status = 'ongoing')  AS ongoing_bookings
        FROM bookings`),

        query(`SELECT
          COUNT(*) FILTER (WHERE status = 'requested') AS pending_transfers
        FROM transfer_requests`),

        query(`SELECT
          COUNT(*) FILTER (WHERE status = 'active' AND expected_return_date IS NOT NULL AND expected_return_date > CURRENT_DATE) AS upcoming_returns,
          COUNT(*) FILTER (WHERE status = 'overdue' OR (status = 'active' AND expected_return_date < CURRENT_DATE))               AS overdue_returns
        FROM allocations`),
      ]);

      ApiResponse.success(res, 200, {
        assets_available:          parseInt(assetStats.assets_available, 10),
        assets_allocated:          parseInt(assetStats.assets_allocated, 10),
        assets_under_maintenance:  parseInt(assetStats.assets_under_maintenance, 10),
        assets_retired:            parseInt(assetStats.assets_retired, 10),
        assets_lost:               parseInt(assetStats.assets_lost, 10),
        total_assets:              parseInt(assetStats.total_assets, 10),
        maintenance_today:         parseInt(maintenanceToday.raised_today, 10),
        pending_maintenance:       parseInt(maintenanceToday.pending, 10),
        active_bookings:           parseInt(bookingStats.upcoming_bookings, 10) + parseInt(bookingStats.ongoing_bookings, 10),
        pending_transfers:         parseInt(transferStats.pending_transfers, 10),
        upcoming_returns:          parseInt(allocationStats.upcoming_returns, 10),
        overdue_returns:           parseInt(allocationStats.overdue_returns, 10),
      }, 'Dashboard KPIs retrieved');
    } catch (err) { next(err); }
  },

  async getRecentActivity(req, res, next) {
    try {
      const limit = Math.min(parseInt(req.query.limit ?? '20', 10), 100);
      const logs = await ActivityLogModel.findAll({ limit, offset: 0 });
      ApiResponse.success(res, 200, logs, 'Recent activity retrieved');
    } catch (err) { next(err); }
  },

  async getFullDashboard(req, res, next) {
    try {
      const [
        { rows: [assetStats] },
        { rows: [maintenanceToday] },
        { rows: [bookingStats] },
        { rows: [transferStats] },
        { rows: [allocationStats] },
        { rows: topCategories },
        { rows: recentAllocations },
        recentLogs,
      ] = await Promise.all([
        query(`SELECT
          COUNT(*) FILTER (WHERE status = 'available')         AS assets_available,
          COUNT(*) FILTER (WHERE status = 'allocated')         AS assets_allocated,
          COUNT(*) FILTER (WHERE status = 'under_maintenance') AS assets_under_maintenance,
          COUNT(*)                                             AS total_assets
        FROM assets WHERE status != 'disposed'`),

        query(`SELECT
          COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) AS raised_today,
          COUNT(*) FILTER (WHERE status = 'pending')              AS pending
        FROM maintenance_requests`),

        query(`SELECT COUNT(*) FILTER (WHERE status IN ('upcoming','ongoing')) AS active_bookings FROM bookings`),

        query(`SELECT COUNT(*) FILTER (WHERE status = 'requested') AS pending_transfers FROM transfer_requests`),

        query(`SELECT
          COUNT(*) FILTER (WHERE status = 'active' AND expected_return_date > CURRENT_DATE) AS upcoming_returns,
          COUNT(*) FILTER (WHERE is_overdue = true OR (status = 'active' AND expected_return_date < CURRENT_DATE)) AS overdue_returns
        FROM allocations`),

        query(`SELECT c.name, COUNT(a.id) AS asset_count
          FROM asset_categories c
          LEFT JOIN assets a ON a.category_id = c.id
          GROUP BY c.id, c.name
          ORDER BY asset_count DESC LIMIT 5`),

        query(`SELECT al.id, a.asset_tag, a.name AS asset_name,
                u.name AS allocated_to, al.created_at, al.expected_return_date, al.status
         FROM allocations al
         JOIN assets a ON a.id = al.asset_id
         LEFT JOIN users u ON u.id = al.allocated_to_user
         ORDER BY al.created_at DESC LIMIT 5`),

        ActivityLogModel.findAll({ limit: 10, offset: 0 }),
      ]);

      ApiResponse.success(res, 200, {
        kpis: {
          assets_available:         parseInt(assetStats.assets_available, 10),
          assets_allocated:         parseInt(assetStats.assets_allocated, 10),
          assets_under_maintenance: parseInt(assetStats.assets_under_maintenance, 10),
          total_assets:             parseInt(assetStats.total_assets, 10),
          maintenance_today:        parseInt(maintenanceToday.raised_today, 10),
          pending_maintenance:      parseInt(maintenanceToday.pending, 10),
          active_bookings:          parseInt(bookingStats.active_bookings, 10),
          pending_transfers:        parseInt(transferStats.pending_transfers, 10),
          upcoming_returns:         parseInt(allocationStats.upcoming_returns, 10),
          overdue_returns:          parseInt(allocationStats.overdue_returns, 10),
        },
        top_categories: topCategories,
        recent_allocations: recentAllocations,
        recent_activity: recentLogs,
      }, 'Dashboard data retrieved');
    } catch (err) { next(err); }
  },
};
