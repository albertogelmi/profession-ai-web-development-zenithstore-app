import { Schema, model, Document } from 'mongoose';

/**
 * Activity Log Interface
 * Tracks all significant user and system activities for audit trail
 */
export interface IActivityLog extends Document {
  timestamp: Date;
  actorType: 'customer' | 'user' | 'system' | 'webhook';
  actorId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  result: 'success' | 'failure' | 'pending';
  errorDetails?: {
    code?: string;
    message?: string;
    stack?: string;
  };
  duration?: number;
}

/**
 * Activity Log Schema
 */
const ActivityLogSchema = new Schema<IActivityLog>(
  {
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    actorType: {
      type: String,
      required: [true, 'Actor type is required'],
      enum: {
        values: ['customer', 'user', 'system', 'webhook'],
        message: 'Invalid actor type',
      },
      index: true,
    },
    actorId: {
      type: String,
      required: [true, 'Actor ID is required'],
      trim: true,
      index: true,
    },
    action: {
      type: String,
      required: [true, 'Action is required'],
      trim: true,
      lowercase: true,
      index: true,
      // Examples: 'auth.login', 'order.create', 'product.update', 'payment.process'
    },
    resourceType: {
      type: String,
      required: [true, 'Resource type is required'],
      trim: true,
      lowercase: true,
      index: true,
      // Examples: 'order', 'product', 'customer', 'payment', 'shipment'
    },
    resourceId: {
      type: String,
      trim: true,
      index: true,
      // ID of the affected resource (order ID, product code, etc.)
    },
    ipAddress: {
      type: String,
      trim: true,
      validate: {
        validator: function (ip: string) {
          if (!ip) return true;
          // IPv4 validation
          const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
          // IPv6 validation (including shorthand like ::1)
          const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
          return ipv4Regex.test(ip) || ipv6Regex.test(ip);
        },
        message: 'Invalid IP address format',
      },
    },
    userAgent: {
      type: String,
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
      // Flexible object for storing action-specific data
      // Examples: { order_total: 150.00, items_count: 3, payment_method: 'stripe' }
    },
    result: {
      type: String,
      required: [true, 'Result is required'],
      enum: {
        values: ['success', 'failure', 'pending'],
        message: 'Invalid result status',
      },
      index: true,
    },
    errorDetails: {
      code: {
        type: String,
        trim: true,
      },
      message: {
        type: String,
        trim: true,
      },
      stack: {
        type: String,
        // Only store in development or for critical errors
      },
    },
    duration: {
      type: Number,
      min: [0, 'Duration cannot be negative'],
      // Duration in milliseconds
    },
  },
  {
    timestamps: false, // Using custom timestamp field
    collection: 'activity_logs',
  }
);

// Compound indexes for common query patterns
ActivityLogSchema.index({ actorId: 1, timestamp: -1 });
ActivityLogSchema.index({ action: 1, result: 1, timestamp: -1 });
ActivityLogSchema.index({ resourceType: 1, resourceId: 1, timestamp: -1 });
ActivityLogSchema.index({ actorType: 1, actorId: 1, timestamp: -1 });

// TTL index - automatically delete logs older than 90 days (optional)
// Uncomment if you want automatic log retention
// ActivityLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

// Export model
export const ActivityLog = model<IActivityLog>('ActivityLog', ActivityLogSchema);
