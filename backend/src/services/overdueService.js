import { AllocationModel } from '../models/allocationModel.js';
import { AssetModel } from '../models/assetModel.js';
import { NotificationService } from './notificationService.js';
import { ActivityLogModel } from '../models/activityLogModel.js';
import { logger } from '../utils/logger.js';

/**
 * Overdue detection service.
 * Call checkAndFlagOverdue() on a schedule (e.g. daily cron or at startup).
 */
export const OverdueService = {
  async checkAndFlagOverdue() {
    try {
      const overdueAllocations = await AllocationModel.findOverdueActive();
      let flagged = 0;

      for (const alloc of overdueAllocations) {
        if (alloc.is_overdue) continue; // Already flagged

        await AllocationModel.markOverdue(alloc.id);
        flagged++;

        // Send overdue notification to the assigned user
        if (alloc.allocated_to_user) {
          await NotificationService.overdueReturn(
            alloc.allocated_to_user,
            alloc.asset_name,
            alloc.id
          );
        }

        await ActivityLogModel.log({
          action: 'allocation_overdue_flagged',
          entity_type: 'allocation',
          entity_id: alloc.id,
          description: `Allocation for asset "${alloc.asset_name}" (${alloc.asset_tag}) flagged as overdue`,
          metadata: {
            asset_tag: alloc.asset_tag,
            expected_return_date: alloc.expected_return_date,
            allocated_to: alloc.allocated_to_name,
          },
        });
      }

      if (flagged > 0) {
        logger.info(`OverdueService: flagged ${flagged} overdue allocations`);
      }

      return flagged;
    } catch (err) {
      logger.error('OverdueService error', { error: err.message });
      return 0;
    }
  },
};
