import { Schema, model, Document } from 'mongoose';

/**
 * Product Review Interface
 * Represents customer reviews for purchased products
 */
export interface IProductReview extends Document {
  productCode: string;
  customerId: number;
  customerName: string;
  orderId: number;
  rating: number;
  title: string;
  comment?: string;
  verifiedPurchase: boolean;
  helpfulCount: number;
  images?: string[];
  moderationStatus: 'pending' | 'approved' | 'rejected';
  moderatedBy?: string;
  moderatedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Product Review Schema
 */
const ProductReviewSchema = new Schema<IProductReview>(
  {
    productCode: {
      type: String,
      required: [true, 'Product code is required'],
      index: true,
      trim: true,
      uppercase: true,
    },
    customerId: {
      type: Number,
      required: [true, 'Customer ID is required'],
      index: true,
      min: [1, 'Customer ID must be positive'],
    },
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      minlength: [2, 'Customer name must be at least 2 characters'],
      maxlength: [200, 'Customer name cannot exceed 200 characters'],
    },
    orderId: {
      type: Number,
      required: [true, 'Order ID is required'],
      index: true,
      min: [1, 'Order ID must be positive'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be between 1 and 5'],
      max: [5, 'Rating must be between 1 and 5'],
      validate: {
        validator: Number.isInteger,
        message: 'Rating must be an integer',
      },
    },
    title: {
      type: String,
      required: [true, 'Review title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [5000, 'Comment cannot exceed 5000 characters'],
    },
    verifiedPurchase: {
      type: Boolean,
      required: true,
      default: false,
    },
    helpfulCount: {
      type: Number,
      default: 0,
      min: [0, 'Helpful count cannot be negative'],
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: function (images: string[]) {
          return images.length <= 10;
        },
        message: 'Cannot upload more than 10 images per review',
      },
    },
    moderationStatus: {
      type: String,
      enum: {
        values: ['pending', 'approved', 'rejected'],
        message: 'Invalid moderation status',
      },
      default: 'pending',
      index: true,
    },
    moderatedBy: {
      type: String,
      trim: true,
    },
    moderatedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Rejection reason cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
    collection: 'product_reviews',
  }
);

// Compound indexes for efficient queries
ProductReviewSchema.index({ productCode: 1, moderationStatus: 1 });
ProductReviewSchema.index({ customerId: 1, createdAt: -1 });
ProductReviewSchema.index({ rating: -1, createdAt: -1 });

// Ensure one review per customer per product per order
ProductReviewSchema.index(
  { customerId: 1, productCode: 1, orderId: 1 },
  { unique: true }
);

// Text index for full-text search on title and comment
ProductReviewSchema.index({ title: 'text', comment: 'text' });

// Virtual for calculating average rating (can be used in aggregations)
ProductReviewSchema.virtual('isHelpful').get(function () {
  return this.helpfulCount > 0;
});

// Pre-save hook to set moderation timestamp
ProductReviewSchema.pre('save', function (next) {
  if (this.isModified('moderationStatus') && this.moderationStatus !== 'pending') {
    this.moderatedAt = new Date();
  }
  next();
});

// Export model
export const ProductReview = model<IProductReview>('ProductReview', ProductReviewSchema);
