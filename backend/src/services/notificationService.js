import { NotificationModel } from '../models/notificationModel.js';
import { logger } from '../utils/logger.js';

/**
 * Centralised notification dispatch.
 * All notification creation goes through here to enforce consistent
 * type/title/message structure.
 */
export const NotificationService = {
  async send({ user_id, type, title, message, reference_type, reference_id }) {
    try {
      return await NotificationModel.create({ user_id, type, title, message, reference_type, reference_id });
    } catch (err) {
      // Never let notification failures break primary business logic
      logger.error('Failed to create notification', { error: err.message, user_id, type });
      return null;
    }
  },

  async assetAssigned(userId, assetName, assetId) {
    return NotificationService.send({
      user_id: userId,
      type: 'asset_assigned',
      title: 'Asset Assigned to You',
      message: `The asset "${assetName}" has been allocated to you.`,
      reference_type: 'asset',
      reference_id: assetId,
    });
  },

  async maintenanceApproved(userId, assetName, requestId) {
    return NotificationService.send({
      user_id: userId,
      type: 'maintenance_approved',
      title: 'Maintenance Request Approved',
      message: `Your maintenance request for "${assetName}" has been approved.`,
      reference_type: 'maintenance_request',
      reference_id: requestId,
    });
  },

  async maintenanceRejected(userId, assetName, requestId, reason) {
    return NotificationService.send({
      user_id: userId,
      type: 'maintenance_rejected',
      title: 'Maintenance Request Rejected',
      message: `Your maintenance request for "${assetName}" was rejected. ${reason ? `Reason: ${reason}` : ''}`,
      reference_type: 'maintenance_request',
      reference_id: requestId,
    });
  },

  async bookingConfirmed(userId, assetName, bookingId) {
    return NotificationService.send({
      user_id: userId,
      type: 'booking_confirmed',
      title: 'Booking Confirmed',
      message: `Your booking for "${assetName}" has been confirmed.`,
      reference_type: 'booking',
      reference_id: bookingId,
    });
  },

  async bookingCancelled(userId, assetName, bookingId, reason) {
    return NotificationService.send({
      user_id: userId,
      type: 'booking_cancelled',
      title: 'Booking Cancelled',
      message: `Your booking for "${assetName}" has been cancelled. ${reason ? `Reason: ${reason}` : ''}`,
      reference_type: 'booking',
      reference_id: bookingId,
    });
  },

  async transferApproved(userId, assetName, transferId) {
    return NotificationService.send({
      user_id: userId,
      type: 'transfer_approved',
      title: 'Transfer Request Approved',
      message: `Transfer request for asset "${assetName}" has been approved.`,
      reference_type: 'transfer_request',
      reference_id: transferId,
    });
  },

  async overdueReturn(userId, assetName, allocationId) {
    return NotificationService.send({
      user_id: userId,
      type: 'overdue_return',
      title: 'Asset Return Overdue',
      message: `The asset "${assetName}" allocated to you is overdue for return. Please return it immediately.`,
      reference_type: 'allocation',
      reference_id: allocationId,
    });
  },

  async auditDiscrepancy(userId, assetName, auditCycleId) {
    return NotificationService.send({
      user_id: userId,
      type: 'audit_discrepancy',
      title: 'Audit Discrepancy Detected',
      message: `Asset "${assetName}" was flagged during audit with a discrepancy.`,
      reference_type: 'audit_cycle',
      reference_id: auditCycleId,
    });
  },

  async returnApproved(userId, assetName, allocationId) {
    return NotificationService.send({
      user_id: userId,
      type: 'return_approved',
      title: 'Asset Return Processed',
      message: `The return of asset "${assetName}" has been processed successfully.`,
      reference_type: 'allocation',
      reference_id: allocationId,
    });
  },
};
