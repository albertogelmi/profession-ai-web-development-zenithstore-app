import mongoose from 'mongoose';

/**
 * MongoDB Connection Manager using Mongoose
 * Handles connection, disconnection, and error handling for MongoDB
 */

class MongoDBConnection {
  private static instance: MongoDBConnection;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): MongoDBConnection {
    if (!MongoDBConnection.instance) {
      MongoDBConnection.instance = new MongoDBConnection();
    }
    return MongoDBConnection.instance;
  }

  /**
   * Initialize MongoDB connection
   */
  public async connect(): Promise<void> {
    if (this.isConnected) {
      console.info('📊 MongoDB already connected');
      return;
    }

    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    try {
      // Mongoose connection options
      const options = {
        maxPoolSize: 10,
        minPoolSize: 2,
        socketTimeoutMS: 45000,
        serverSelectionTimeoutMS: 5000,
        family: 4, // Use IPv4, skip trying IPv6
      };

      await mongoose.connect(mongoUri, options);
      
      this.isConnected = true;
      console.info('📊 MongoDB connected successfully');
      
      if (mongoose.connection.db) {
        console.info(`📊 Database: ${mongoose.connection.db.databaseName}`);
      }

      // Initialize indexes for all models
      await this.initializeIndexes();

      // Connection event listeners
      mongoose.connection.on('error', (error) => {
        console.error('❌ MongoDB connection error:', error);
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️ MongoDB disconnected');
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        console.info('🔄 MongoDB reconnected');
        this.isConnected = true;
      });

    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  /**
   * Disconnect from MongoDB
   */
  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      console.info('📊 MongoDB disconnected successfully');
    } catch (error) {
      console.error('❌ Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  /**
   * Initialize MongoDB indexes for all models
   */
  private async initializeIndexes(): Promise<void> {
    try {
      console.info('📊 Initializing MongoDB indexes...');
      
      const { ProductReview } = await import('../entities/mongodb/ProductReview');
      const { ActivityLog } = await import('../entities/mongodb/ActivityLog');
      const { ProductQuestion } = await import('../entities/mongodb/ProductQuestion');

      // Create indexes for all models
      await Promise.all([
        ProductReview.createIndexes(),
        ActivityLog.createIndexes(),
        ProductQuestion.createIndexes(),
      ]);

      console.info('✅ MongoDB indexes initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing MongoDB indexes:', error);
      throw error;
    }
  }

  /**
   * Get connection status
   */
  public getConnectionStatus(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  /**
   * Get Mongoose connection instance
   */
  public getConnection(): typeof mongoose {
    return mongoose;
  }
}

// Export singleton instance
export const mongoDBConnection = MongoDBConnection.getInstance();

// Export mongoose for model definitions
export { mongoose };
