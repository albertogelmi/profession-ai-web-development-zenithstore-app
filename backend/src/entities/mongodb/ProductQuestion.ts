import { Schema, model, Document } from 'mongoose';

/**
 * Product Question Answer Interface
 */
export interface IAnswer {
  text: string;
  answeredBy: string;
  answeredById: string;
  answeredAt: Date;
}

/**
 * Product Question Interface
 * Represents Q&A for products - customers ask, admins/users answer
 */
export interface IProductQuestion extends Document {
  productCode: string;
  customerId: number;
  customerName: string;
  question: string;
  answer?: IAnswer;
  status: 'pending' | 'answered' | 'hidden';
  helpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Answer Sub-Schema
 */
const AnswerSchema = new Schema<IAnswer>(
  {
    text: {
      type: String,
      required: [true, 'Answer text is required'],
      trim: true,
      minlength: [10, 'Answer must be at least 10 characters'],
      maxlength: [2000, 'Answer cannot exceed 2000 characters'],
    },
    answeredBy: {
      type: String,
      required: [true, 'Answered by is required'],
      trim: true,
      // Name or username of the person answering
    },
    answeredById: {
      type: String,
      required: [true, 'Answered by ID is required'],
      trim: true,
      // User ID of the person answering
    },
    answeredAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { _id: false }
);

/**
 * Product Question Schema
 */
const ProductQuestionSchema = new Schema<IProductQuestion>(
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
    question: {
      type: String,
      required: [true, 'Question is required'],
      trim: true,
      minlength: [10, 'Question must be at least 10 characters'],
      maxlength: [1000, 'Question cannot exceed 1000 characters'],
    },
    answer: {
      type: AnswerSchema,
      default: undefined,
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'answered', 'hidden'],
        message: 'Invalid status',
      },
      default: 'pending',
      index: true,
    },
    helpfulCount: {
      type: Number,
      default: 0,
      min: [0, 'Helpful count cannot be negative'],
    },
  },
  {
    timestamps: true,
    collection: 'product_questions',
  }
);

// Compound indexes for efficient queries
ProductQuestionSchema.index({ productCode: 1, status: 1, createdAt: -1 });
ProductQuestionSchema.index({ customerId: 1, createdAt: -1 });
ProductQuestionSchema.index({ status: 1, createdAt: -1 });

// Text index for full-text search on questions and answers
ProductQuestionSchema.index({ question: 'text', 'answer.text': 'text' });

// Virtual to check if question is answered
ProductQuestionSchema.virtual('isAnswered').get(function () {
  return this.answer !== undefined && this.answer !== null;
});

// Pre-save hook to update status when answer is provided
ProductQuestionSchema.pre('save', function (next) {
  if (this.isModified('answer') && this.answer) {
    this.status = 'answered';
  }
  next();
});

// Export model
export const ProductQuestion = model<IProductQuestion>(
  'ProductQuestion',
  ProductQuestionSchema
);
