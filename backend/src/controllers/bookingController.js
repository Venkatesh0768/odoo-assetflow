import { BookingModel } from '../models/bookingModel.js';
import { AssetModel } from '../models/assetModel.js';
import { ActivityLogModel } from '../models/activityLogModel.js';
import { NotificationService } from '../services/notificationService.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const BookingController = {
  async getAll(req, res, next) {
    try {
      const { asset_id, user_id, status } = req.query;
      const page  = Math.max(parseInt(req.query.page  ?? '1', 10), 1);
      const limit = Math.min(parseInt(req.query.limit ?? '20', 10), 100);
      const offset = (page - 1) * limit;

      const [bookings, total] = await Promise.all([
        BookingModel.findAll({ asset_id, user_id, status, limit, offset }),
        BookingModel.count({ asset_id, user_id, status }),
      ]);

      ApiResponse.success(res, 200, {
        bookings,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      }, 'Bookings retrieved');
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      const booking = await BookingModel.findById(req.params.id);
      if (!booking) throw ApiError.notFound('Booking not found');
      ApiResponse.success(res, 200, booking, 'Booking retrieved');
    } catch (err) { next(err); }
  },

  async getCalendar(req, res, next) {
    try {
      const { id } = req.params;
      const { from, to } = req.query;

      const asset = await AssetModel.findById(id);
      if (!asset) throw ApiError.notFound('Asset not found');
      if (!asset.is_bookable) throw ApiError.badRequest('Asset is not bookable');

      const fromDate = from ? new Date(from) : new Date();
      const toDate   = to   ? new Date(to)   : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const bookings = await BookingModel.getCalendar(id, fromDate, toDate);
      ApiResponse.success(res, 200, { asset, bookings }, 'Calendar data retrieved');
    } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      const { asset_id, start_time, end_time, purpose, department_id } = req.body;

      const asset = await AssetModel.findById(asset_id);
      if (!asset) throw ApiError.notFound('Asset not found');
      if (!asset.is_bookable) throw ApiError.badRequest('This asset is not available for booking');

      const startDt = new Date(start_time);
      const endDt   = new Date(end_time);

      if (endDt <= startDt) throw ApiError.badRequest('end_time must be after start_time');

      /* Overlap check */
      const overlaps = await BookingModel.findOverlapping(asset_id, startDt, endDt);
      if (overlaps.length > 0) {
        return ApiResponse.error(res, 409, 'Time slot is not available', [{
          field: 'start_time',
          message: 'This time slot overlaps with an existing booking',
          conflicting: overlaps.map(o => ({ id: o.id, start_time: o.start_time, end_time: o.end_time })),
        }]);
      }

      const booking = await BookingModel.create({
        asset_id,
        booked_by: req.user.sub,
        department_id: department_id ?? null,
        start_time: startDt,
        end_time: endDt,
        purpose,
      });

      await NotificationService.bookingConfirmed(req.user.sub, asset.name, booking.id);

      await ActivityLogModel.log({
        user_id: req.user.sub,
        action: 'booking_created',
        entity_type: 'booking',
        entity_id: booking.id,
        description: `Booking created for asset "${asset.name}" (${asset.asset_tag})`,
        metadata: { asset_tag: asset.asset_tag, start_time, end_time },
        ip_address: req.ip,
      });

      ApiResponse.success(res, 201, booking, 'Booking created');
    } catch (err) { next(err); }
  },

  async reschedule(req, res, next) {
    try {
      const { id } = req.params;
      const { start_time, end_time, purpose, department_id } = req.body;

      const booking = await BookingModel.findById(id);
      if (!booking) throw ApiError.notFound('Booking not found');
      if (booking.status !== 'upcoming') {
        throw ApiError.badRequest('Only upcoming bookings can be rescheduled');
      }

      /* Only owner or admin can reschedule */
      if (booking.booked_by !== req.user.sub && req.user.role !== 'admin') {
        throw ApiError.forbidden('You can only reschedule your own bookings');
      }

      if (start_time && end_time) {
        const startDt = new Date(start_time);
        const endDt   = new Date(end_time);
        if (endDt <= startDt) throw ApiError.badRequest('end_time must be after start_time');

        const overlaps = await BookingModel.findOverlapping(booking.asset_id, startDt, endDt, id);
        if (overlaps.length > 0) {
          return ApiResponse.error(res, 409, 'New time slot is not available', [{
            field: 'start_time',
            message: 'This time slot overlaps with an existing booking',
          }]);
        }
      }

      const updated = await BookingModel.update(id, { start_time, end_time, purpose, department_id });

      await ActivityLogModel.log({
        user_id: req.user.sub,
        action: 'booking_rescheduled',
        entity_type: 'booking',
        entity_id: id,
        description: `Booking for "${booking.asset_name}" rescheduled`,
        ip_address: req.ip,
      });

      ApiResponse.success(res, 200, updated, 'Booking rescheduled');
    } catch (err) { next(err); }
  },

  async cancel(req, res, next) {
    try {
      const { id } = req.params;
      const { cancellation_reason } = req.body;

      const booking = await BookingModel.findById(id);
      if (!booking) throw ApiError.notFound('Booking not found');
      if (booking.status === 'cancelled') throw ApiError.badRequest('Booking is already cancelled');
      if (booking.status === 'completed')  throw ApiError.badRequest('Cannot cancel a completed booking');

      /* Only owner, admin, or asset_manager can cancel */
      if (booking.booked_by !== req.user.sub &&
          !['admin', 'asset_manager'].includes(req.user.role)) {
        throw ApiError.forbidden('You cannot cancel this booking');
      }

      const updated = await BookingModel.cancel(id, req.user.sub, cancellation_reason);

      await NotificationService.bookingCancelled(booking.booked_by, booking.asset_name, id, cancellation_reason);

      await ActivityLogModel.log({
        user_id: req.user.sub,
        action: 'booking_cancelled',
        entity_type: 'booking',
        entity_id: id,
        description: `Booking for "${booking.asset_name}" cancelled`,
        ip_address: req.ip,
      });

      ApiResponse.success(res, 200, updated, 'Booking cancelled');
    } catch (err) { next(err); }
  },
};
