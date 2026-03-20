import { ActivityLog, IActivityLog } from '../../entities/mongodb/ActivityLog';
import { errorEmitter } from '../../utils/errorEmitter';

/**
 * Activity Log Repository
 * Handles all database operations for activity logging and audit trail
 */
export class ActivityLogRepository {
  
  /**
   * Create a new activity log entry
   */
  async create(logData: Partial<IActivityLog>): Promise<IActivityLog> {
    try {
      return await ActivityLog.create({
        timestamp: new Date(),
        ...logData,
      });
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'ActivityLogRepository.create',
      });
      throw error;
    }
  }

  /**
   * Get recent activity by actor (user/customer)
   */
  async getRecentActivityByActor(
    actorId: string,
    limit: number = 50
  ): Promise<IActivityLog[]> {
    try {
      return await ActivityLog.find({ actorId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .select('-__v -errorDetails.stack');
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'ActivityLogRepository.getRecentActivityByActor',
      });
      throw error;
    }
  }

  /**
   * Get activity for a specific resource
   */
  async getActivityByResource(
    resourceType: string,
    resourceId: string,
    limit: number = 50
  ): Promise<IActivityLog[]> {
    try {
      return await ActivityLog.find({ resourceType, resourceId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .select('-__v -errorDetails.stack');
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'ActivityLogRepository.getActivityByResource',
      });
      throw error;
    }
  }

  /**
   * Get failed actions within a date range
   */
  async getFailedActions(
    startDate: Date,
    endDate: Date,
    limit: number = 100
  ): Promise<IActivityLog[]> {
    try {
      return await ActivityLog.find({
        result: 'failure',
        timestamp: { $gte: startDate, $lte: endDate },
      })
        .sort({ timestamp: -1 })
        .limit(limit);
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'ActivityLogRepository.getFailedActions',
      });
      throw error;
    }
  }

  /**
   * Get action statistics (aggregation)
   */
  async getActionStats(
    startDate: Date,
    endDate: Date
  ): Promise<Array<{
    _id: { action: string; result: string };
    count: number;
    avgDuration: number;
  }>> {
    try {
      return await ActivityLog.aggregate([
        {
          $match: {
            timestamp: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: {
              action: '$action',
              result: '$result',
            },
            count: { $sum: 1 },
            avgDuration: { $avg: '$duration' },
          },
        },
        {
          $sort: { count: -1 },
        },
      ]);
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'ActivityLogRepository.getActionStats',
      });
      throw error;
    }
  }

  /**
   * Get user activity summary
   */
  async getUserActivitySummary(
    actorId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{
    _id: string;
    count: number;
    successCount: number;
    failureCount: number;
  }>> {
    try {
      return await ActivityLog.aggregate([
        {
          $match: {
            actorId,
            timestamp: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: '$action',
            count: { $sum: 1 },
            successCount: {
              $sum: { $cond: [{ $eq: ['$result', 'success'] }, 1, 0] },
            },
            failureCount: {
              $sum: { $cond: [{ $eq: ['$result', 'failure'] }, 1, 0] },
            },
          },
        },
        {
          $sort: { count: -1 },
        },
      ]);
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'ActivityLogRepository.getUserActivitySummary',
      });
      throw error;
    }
  }

  /**
   * Get logs by action type
   */
  async getByAction(
    action: string,
    limit: number = 50
  ): Promise<IActivityLog[]> {
    try {
      return await ActivityLog.find({ action })
        .sort({ timestamp: -1 })
        .limit(limit)
        .select('-__v -errorDetails.stack');
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'ActivityLogRepository.getByAction',
      });
      throw error;
    }
  }

  /**
   * Get logs with filters
   */
  async getWithFilters(filters: {
    actorType?: string;
    actorId?: string;
    action?: string;
    resourceType?: string;
    result?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<IActivityLog[]> {
    try {
      const query: any = {};
      
      if (filters.actorType) query.actorType = filters.actorType;
      if (filters.actorId) query.actorId = filters.actorId;
      if (filters.action) query.action = filters.action;
      if (filters.resourceType) query.resourceType = filters.resourceType;
      if (filters.result) query.result = filters.result;
      
      if (filters.startDate || filters.endDate) {
        query.timestamp = {};
        if (filters.startDate) query.timestamp.$gte = filters.startDate;
        if (filters.endDate) query.timestamp.$lte = filters.endDate;
      }

      return await ActivityLog.find(query)
        .sort({ timestamp: -1 })
        .limit(filters.limit || 50)
        .select('-__v -errorDetails.stack');
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'ActivityLogRepository.getWithFilters',
      });
      throw error;
    }
  }
}
